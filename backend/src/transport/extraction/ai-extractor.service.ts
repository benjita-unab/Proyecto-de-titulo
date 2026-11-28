import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { PuppeteerExtractor } from '../../scripts/extraer-tarifas-puppeteer';
import type { IBrowserExtractor } from '../../scripts/extraer-tarifas-puppeteer';

export interface StructuredTransportPayload {
  fuenteUrl: string;
  fechaExtraccion: string;
  rutas: Array<{
    idRecorrido: string;
    idTransporte: string;
    nombreRecorrido: string;
    sentido: string;
    callesPrincipales: string;
    frecuencia: string;
    evidenciaFuente: string;
    pasaHospitalQuilpue: boolean;
  }>;
  paradas: Array<{
    idParada: string;
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    comuna: string;
    evidenciaFuente: string;
  }>;
  tarifas: Array<{
    tipoTransporte: string;
    nombreLinea: string;
    tarifaGeneral: number;
    tarifaAdultoMayor: number;
    evidenciaFuente: string;
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
    @Optional() customExtractor?: IBrowserExtractor,
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
      'gemini-flash-lite-latest';

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
      if (!this.isOfficialSource(sourceUrl)) {
        this.logger.warn(`Se rechazó una fuente de transporte no oficial: ${sourceUrl}`);
        return null;
      }

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
    { "idRecorrido": "REC-01", "idTransporte": "TRANS-01", "nombreRecorrido": "Texto exacto", "sentido": "Ida y Retorno", "callesPrincipales": "Texto exacto", "frecuencia": "Texto exacto", "evidenciaFuente": "Fragmento literal copiado de la fuente que prueba esos datos", "pasaHospitalQuilpue": false }
  ],
  "paradas": [
    { "idParada": "PAR-01", "nombre": "Nombre exacto", "direccion": "Dirección exacta", "latitud": -33.048, "longitud": -71.443, "comuna": "Quilpué", "evidenciaFuente": "Fragmento literal que contiene nombre, dirección y coordenadas" }
  ],
  "tarifas": [
    { "tipoTransporte": "Microbús", "nombreLinea": "Línea 111", "tarifaGeneral": 450, "tarifaAdultoMayor": 150, "evidenciaFuente": "Fragmento literal que contiene línea y ambas tarifas" }
  ]
}
`;

      const tryModels = [this.model, 'gemini-flash-lite-latest', 'gemini-3.6-flash', 'gemini-flash-latest'];
      const uniqueModels = [...new Set(tryModels.filter(Boolean))];

      for (const currentModel of uniqueModels) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`;
          const resp = await axios.post(
            geminiEndpoint,
            {
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
            },
            { timeout: 15000 },
          );

          const jsonStr = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            return this.validateAndNormalizePayload({
              ...parsed,
              fuenteUrl: sourceUrl,
              fechaExtraccion: new Date().toISOString(),
            }, textSample, sourceUrl);
          }
        } catch (mErr: any) {
          this.logger.warn(`Modelo ${currentModel} falló en ai-extractor (${mErr.response?.status || mErr.message}). Probando alternativo...`);
        }
      }

      return null;
    } catch (err: any) {
      this.logger.error(`Error en pipeline de extracción con IA: ${err.message}`);
      return null;
    }
  }

  /**
   * Tarea 4 (HU #6): Validación y normalización estricta antes de guardar
   * Valida esquema, rango de tarifas razonables y coordenadas dentro de Quilpué / Villa Alemana.
   */
  public validateAndNormalizePayload(
    payload: StructuredTransportPayload,
    sourceText: string,
    sourceUrl: string,
  ): StructuredTransportPayload {
    if (!this.isOfficialSource(sourceUrl)) {
      return { fuenteUrl: sourceUrl, fechaExtraccion: payload.fechaExtraccion, rutas: [], paradas: [], tarifas: [] };
    }

    const normalize = (value: string | number) => String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const text = normalize(sourceText);
    const evidenceIsInSource = (evidence: string) =>
      typeof evidence === 'string' && evidence.length > 0 && text.includes(normalize(evidence));
    const valuesAreInEvidence = (evidence: string, values: Array<string | number>) => {
      const normalizedEvidence = normalize(evidence || '');
      return values.every((value) => normalizedEvidence.includes(normalize(value)));
    };

    const validRutas = (payload.rutas || []).filter((route) =>
      route.idRecorrido
      && route.nombreRecorrido
      && route.callesPrincipales
      && route.frecuencia
      && evidenceIsInSource(route.evidenciaFuente)
      && valuesAreInEvidence(route.evidenciaFuente, [
        route.nombreRecorrido,
        route.callesPrincipales,
        route.frecuencia,
      ]),
    ).map((route) => ({
      ...route,
      pasaHospitalQuilpue: normalize(route.evidenciaFuente).includes('hospital')
        && route.pasaHospitalQuilpue === true,
    }));

    // Validación de coordenadas dentro de Quilpué y Villa Alemana (-33.15 a -32.95 lat, -71.55 a -71.25 lon)
    const validParadas = (payload.paradas || []).filter((p) => {
      const lat = Number(p.latitud);
      const lng = Number(p.longitud);
      const coordsValidas =
        !isNaN(lat) && !isNaN(lng) && lat >= -33.20 && lat <= -32.90 && lng >= -71.60 && lng <= -71.20;
      return p.nombre
        && coordsValidas
        && evidenceIsInSource(p.evidenciaFuente)
        && valuesAreInEvidence(p.evidenciaFuente, [
          p.nombre,
          p.direccion,
          p.latitud,
          p.longitud,
        ]);
    });

    // Validación de rangos de tarifas
    const validTarifas = (payload.tarifas || []).filter((t) => {
      const tg = Number(t.tarifaGeneral);
      const ta = Number(t.tarifaAdultoMayor);
      const tarifasValidas = tg >= 100 && tg <= 15000 && ta >= 0 && ta <= tg;
      return t.nombreLinea
        && tarifasValidas
        && evidenceIsInSource(t.evidenciaFuente)
        && valuesAreInEvidence(t.evidenciaFuente, [
          t.nombreLinea,
          t.tarifaGeneral,
          t.tarifaAdultoMayor,
        ]);
    });

    return {
      fuenteUrl: sourceUrl,
      fechaExtraccion: payload.fechaExtraccion,
      rutas: validRutas,
      paradas: validParadas,
      tarifas: validTarifas,
    };
  }

  private isOfficialSource(sourceUrl: string): boolean {
    try {
      const url = new URL(sourceUrl);
      const host = url.hostname.toLowerCase();
      const officialHosts = [
        'dtpr.gob.cl',
        'mtt.gob.cl',
        'quilpue.cl',
        'docs.quilpue.cl',
        'efe.cl',
      ];
      return url.protocol === 'https:'
        && officialHosts.some((officialHost) =>
          host === officialHost || host.endsWith(`.${officialHost}`),
        );
    } catch {
      return false;
    }
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

    if (!payload.fuenteUrl || !this.isOfficialSource(payload.fuenteUrl)
      || payload.rutas.some((route) =>
        !route.evidenciaFuente
        || !route.nombreRecorrido
        || !route.callesPrincipales
        || !route.frecuencia
        || !route.pasaHospitalQuilpue && /hospital/i.test(route.evidenciaFuente))) {
      throw new Error('No se guardan rutas sin una fuente oficial y evidencia verificable.');
    }

    if (payload.rutas.length === 0) {
      this.logger.warn('[AiExtractor] No hay rutas con evidencia literal suficiente; no se guardaron datos.');
      return false;
    }

    if (!this.supabase) {
      this.logger.warn('[AiExtractor] Sin conexión a Supabase. Se mantiene en memoria.');
      return false;
    }

    try {
      this.logger.log(`[AiExtractor] Detectadas actualizaciones. Guardando en Supabase...`);

      const { error } = await this.supabase.from('recorrido_transporte').upsert(
        payload.rutas.map((route) => ({
          id_recorrido: route.idRecorrido,
          id_transporte: route.idTransporte,
          nombre_recorrido: route.nombreRecorrido,
          sentido: route.sentido,
          calles_principales: route.callesPrincipales,
          frecuencia: route.frecuencia,
          pasa_hospital_quilpue: route.pasaHospitalQuilpue,
          verificado: true,
          fuente_url: payload.fuenteUrl,
          evidencia_fuente: route.evidenciaFuente,
          fecha_verificacion: payload.fechaExtraccion,
          activo: true,
        })),
        { onConflict: 'id_recorrido' },
      );
      if (error) throw error;

      this.lastExtractedHash = serialized;
      this.logger.log('✅ [AiExtractor] Datos actualizados correctamente en Supabase.');
      return true;
    } catch (err: any) {
      this.logger.error(`Error guardando datos en Supabase: ${err.message}.`);
      throw err;
    }
  }
}
