import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { PuppeteerExtractor, IBrowserExtractor } from '../../scripts/extraer-tarifas-puppeteer';

export interface StructuredTransportPayload {
  rutas: Array<{
    idRecorrido: string;
    idTransporte: string;
    nombreRecorrido: string;
    sentido: string;
    callesPrincipales: string;
    frecuencia: string;
  }>;
  paradas: Array<{
    idParada: string;
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    comuna: string;
  }>;
  tarifas: Array<{
    tipoTransporte: string;
    nombreLinea: string;
    tarifaGeneral: number;
    tarifaAdultoMayor: number;
  }>;
}

@Injectable()
export class AiExtractorService {
  private readonly logger = new Logger(AiExtractorService.name);
  private supabase: SupabaseClient | null = null;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly browserExtractor: IBrowserExtractor;

  // Cache del último hash de datos para evitar escrituras redundantes (HU #6 Tarea 4)
  private lastExtractedHash: string = '';

  constructor(
    @Optional() private readonly configService?: ConfigService,
    @Optional() customExtractor?: PuppeteerExtractor,
  ) {
    const supabaseUrl =
      this.configService?.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService?.get<string>('SUPABASE_KEY') ||
      this.configService?.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.apiKey =
      this.configService?.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    this.model =
      this.configService?.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-1.5-flash';

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    this.browserExtractor = customExtractor || new PuppeteerExtractor();
  }

  /**
   * Tarea 1 (HU #6): Extracción de datos con Puppeteer + estructuración con IA Gemini HTTPS
   */
  async extractAndStructureWithAi(sourceUrl: string): Promise<StructuredTransportPayload | null> {
    try {
      this.logger.log(`Iniciando extracción con Puppeteer desde: ${sourceUrl}`);
      const rawHtmlOrText = await this.browserExtractor.fetchPageContent(sourceUrl);

      // Limpiar texto crudo para optimizar tokens hacia la IA
      const textSample = rawHtmlOrText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000);

      if (!this.apiKey) {
        this.logger.warn('GEMINI_API_KEY no configurada. Estructuración con IA omitida, entregando esquema base.');
        return null;
      }

      const prompt = `
Analiza la siguiente información de transporte público de Quilpué y Villa Alemana y conviértela a JSON estrictamente válido:
"${textSample}"

Esquema requerido:
{
  "rutas": [
    { "idRecorrido": "REC-01", "idTransporte": "TRANS-01", "nombreRecorrido": "Texto", "sentido": "Ida y Retorno", "callesPrincipales": "Calles", "frecuencia": "Cada 10 min" }
  ],
  "paradas": [
    { "idParada": "PAR-01", "nombre": "Nombre", "direccion": "Dirección", "latitud": -33.048, "longitud": -71.443, "comuna": "Quilpué" }
  ],
  "tarifas": [
    { "tipoTransporte": "Microbús", "nombreLinea": "Línea 111", "tarifaGeneral": 450, "tarifaAdultoMayor": 150 }
  ]
}
`;

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const resp = await axios.post(
        geminiEndpoint,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        },
        { timeout: 15000 },
      );

      const jsonStr = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonStr) return null;

      const parsed: StructuredTransportPayload = JSON.parse(jsonStr);
      return this.validateAndNormalizePayload(parsed);
    } catch (err: any) {
      this.logger.error(`Error en pipeline de extracción con IA: ${err.message}`);
      return null;
    }
  }

  /**
   * Tarea 4 (HU #6): Validación y normalización estricta antes de guardar
   * Valida esquema, rango de tarifas razonables y coordenadas dentro de Quilpué / Villa Alemana.
   */
  public validateAndNormalizePayload(payload: StructuredTransportPayload): StructuredTransportPayload {
    const validRutas = (payload.rutas || []).filter(
      (r) => r.idRecorrido && r.nombreRecorrido && r.callesPrincipales,
    );

    // Validación de coordenadas dentro de Quilpué y Villa Alemana (-33.15 a -32.95 lat, -71.55 a -71.25 lon)
    const validParadas = (payload.paradas || []).filter((p) => {
      const lat = Number(p.latitud);
      const lng = Number(p.longitud);
      const coordsValidas =
        !isNaN(lat) && !isNaN(lng) && lat >= -33.20 && lat <= -32.90 && lng >= -71.60 && lng <= -71.20;
      return p.nombre && coordsValidas;
    });

    // Validación de rangos de tarifas
    const validTarifas = (payload.tarifas || []).filter((t) => {
      const tg = Number(t.tarifaGeneral);
      const ta = Number(t.tarifaAdultoMayor);
      const tarifasValidas = tg >= 100 && tg <= 15000 && ta >= 0 && ta <= tg;
      return t.nombreLinea && tarifasValidas;
    });

    return {
      rutas: validRutas,
      paradas: validParadas,
      tarifas: validTarifas,
    };
  }

  /**
   * Tarea 4 (HU #6): Verifica si los datos cambiaron y solo guarda/actualiza cuando corresponde.
   */
  async saveIfChanged(payload: StructuredTransportPayload): Promise<boolean> {
    const serialized = JSON.stringify(payload);
    if (serialized === this.lastExtractedHash) {
      this.logger.log('[AiExtractor] Los datos no han cambiado desde la última verificación. Omitiendo guardado en Supabase.');
      return false;
    }

    if (!this.supabase) {
      this.logger.warn('[AiExtractor] Sin conexión a Supabase. Se mantiene en memoria.');
      this.lastExtractedHash = serialized;
      return false;
    }

    try {
      this.logger.log(`[AiExtractor] Detectadas actualizaciones. Guardando en Supabase...`);

      if (payload.rutas.length > 0) {
        await this.supabase.from('recorrido_transporte').upsert(
          payload.rutas.map((r) => ({
            id_recorrido: r.idRecorrido,
            id_transporte: r.idTransporte || 'TRANS-C02',
            nombre_recorrido: r.nombreRecorrido,
            sentido: r.sentido,
            calles_principales: r.callesPrincipales,
            frecuencia: r.frecuencia,
          })),
          { onConflict: 'id_recorrido' },
        );
      }

      this.lastExtractedHash = serialized;
      this.logger.log('✅ [AiExtractor] Datos actualizados correctamente en Supabase.');
      return true;
    } catch (err: any) {
      this.logger.error(`Error guardando datos en Supabase: ${err.message}. Entregando últimos datos guardados.`);
      return false;
    }
  }
}
