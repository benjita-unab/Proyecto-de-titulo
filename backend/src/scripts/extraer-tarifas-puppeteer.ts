import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export interface TarifaExtraida {
  tipoTransporte: 'Microbús' | 'Colectivo' | 'Radio Taxi';
  lineaOCompania: string;
  tarifaGeneral: number;
  tarifaAdultoMayor: number;
  fuenteUrl: string;
  fechaActualizacion: string;
}

/**
 * Interfaz para permitir simulación o inyección del navegador Puppeteer
 */
export interface IBrowserExtractor {
  fetchPageContent(url: string): Promise<string>;
}

export class PuppeteerExtractor implements IBrowserExtractor {
  async fetchPageContent(url: string): Promise<string> {
    try {
      // Importación dinámica para permitir ejecución en entornos con o sin Puppeteer instalado
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        timeout: 10000,
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const content = await page.content();
      await browser.close();
      return content;
    } catch (err: any) {
      console.warn(`[Puppeteer] Advertencia o Puppeteer no disponible (${err.message}). Utilizando extracción HTTP ligera de contingencia.`);
      const resp = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      });
      return resp.data;
    }
  }
}

export class ExtractorTarifasService {
  constructor(private readonly extractor: IBrowserExtractor = new PuppeteerExtractor()) {}

  /**
   * No publica tarifas cuando la página oficial no contiene valores legibles y verificables.
   */
  async extraerTarifasOficiales(): Promise<TarifaExtraida[]> {
    const urlDTPR = 'https://dtpr.mtt.gob.cl/';
    const raw = await this.extractor.fetchPageContent(urlDTPR);
    const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!/colectivo.{0,80}(?:\$\s?\d{3,5}|\d{3,5}\s?pesos)/i.test(text)) {
      console.warn(
        `[ExtractorTarifas] La fuente ${urlDTPR} no publica un valor de tarifa de colectivo verificable; no se actualizaron tarifas.`,
      );
    }

    return [];
  }

  /**
   * Sincroniza las tarifas extraídas hacia Supabase
   */
  async sincronizarTarifasConSupabase(): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
      console.log('[ExtractorTarifas] Supabase no configurado en este entorno. Finalizando extracción.');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const tarifas = await this.extraerTarifasOficiales();
    if (tarifas.length === 0) {
      console.warn('[ExtractorTarifas] No hay tarifas verificables para sincronizar.');
      return;
    }

    for (const t of tarifas) {
      if (t.tipoTransporte === 'Microbús') {
        await supabase
          .from('medio_transporte')
          .update({
            tarifa_general: t.tarifaGeneral,
            tarifa_adulto_mayor: t.tarifaAdultoMayor,
          })
          .eq('tipo_transporte', 'Microbús');
      } else if (t.tipoTransporte === 'Colectivo') {
        await supabase
          .from('colectivo')
          .update({
            tarifa_diurna: t.tarifaGeneral,
            tarifa_adulto_mayor: t.tarifaAdultoMayor,
          })
          .neq('id_colectivo', '0');
      }
    }

    console.log(`✅ [ExtractorTarifas] Sincronización exitosa de ${tarifas.length} categorías de tarifas.`);
  }
}

if (require.main === module) {
  const service = new ExtractorTarifasService();
  service.sincronizarTarifasConSupabase();
}
