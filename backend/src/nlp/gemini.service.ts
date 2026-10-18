import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NlpService } from './nlp.service';

export interface GeminiIntentResult {
  intent: 'Buscar Ruta' | 'Consultar Horario' | 'Consultar RadioTaxi' | 'Saludo' | 'AclaracionDestino' | 'unknown';
  destination: string | null;
  linea?: string | null;
  comuna?: string | null;
  mensajeAclaracion?: string | null;
  usandoFallback: boolean;
  latenciaMs: number;
}

export const LISTA_BLANCA_DESTINOS_MARGA_MARGA = [
  'Hospital de Quilpué',
  'Estación Metro Quilpué',
  'Estación Metro Villa Alemana',
  'Feria El Belloto',
  'Los Pinos',
  'Belloto Norte',
  'Belloto Sur',
  'El Retiro',
  'Colinas de Oro',
  'Valencia',
  'Peumo',
  'Peñablanca',
  'Plaza de Quilpué',
  'Plaza 40 Horas',
  'Pompeya',
];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly nlpFallback?: NlpService,
  ) {
    this.apiKey =
      this.configService?.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    this.model =
      this.configService?.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-1.5-flash';
    this.timeoutMs = Number(
      this.configService?.get<string>('GEMINI_TIMEOUT_MS') ||
        process.env.GEMINI_TIMEOUT_MS ||
        3500,
    );

    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY no configurada. GeminiService operará con respaldo automático (Nivel 1: NlpService).',
      );
    }
  }

  /**
   * Tarea 2 (HU #6): Interpreta consultas en lenguaje natural con Gemini HTTPS.
   * Maneja modismos, errores de tipeo, valida contra lista blanca y responde en <= 4s.
   * Si la IA falla o excede el tiempo límite, conmuta a respaldo predefinido (Nivel 1).
   */
  async interpretQuery(userText: string): Promise<GeminiIntentResult> {
    const startTime = Date.now();

    if (!userText || !userText.trim()) {
      return {
        intent: 'unknown',
        destination: null,
        usandoFallback: false,
        latenciaMs: 0,
      };
    }

    // Si no hay API key de Gemini, usar inmediatamente Nivel 1 de respaldo
    if (!this.apiKey) {
      return this.executeNlpFallback(userText, startTime);
    }

    const systemPrompt = `
Eres el asistente de movilidad MoviTech para adultos mayores de Quilpué y Villa Alemana (Región de Valparaíso, Chile).
Tu misión es interpretar la consulta del usuario, tolerando modismos chilenos ("micro", "bondi", "colectivo", "ir pa", "dejar botado", "la feria"), abreviaturas y faltas de ortografía.

Lista blanca de destinos oficiales:
${LISTA_BLANCA_DESTINOS_MARGA_MARGA.map((d) => `- "${d}"`).join('\n')}

Debes clasificar la intención en UNA de estas:
1. "Buscar Ruta": Si desea viajar o consultar cómo llegar a un destino.
2. "Consultar Horario": Si pregunta por frecuencias o a qué hora pasa una micro/colectivo.
3. "Consultar RadioTaxi": Si busca teléfonos o centrales de radiotaxis.
4. "Saludo": Si sólo saluda cordialmente.
5. "AclaracionDestino": Si el destino no es comprensible o está fuera de la zona de Quilpué y Villa Alemana.

REGLAS ESTRICTAS DE RESPUESTA:
- Responde ÚNICAMENTE en formato JSON plano:
{
  "intent": "Buscar Ruta" | "Consultar Horario" | "Consultar RadioTaxi" | "Saludo" | "AclaracionDestino" | "unknown",
  "destination": "Nombre exacto normalizado o null",
  "linea": "Nombre de línea o null",
  "comuna": "Quilpué" o "Villa Alemana" o null,
  "mensajeAclaracion": "Mensaje corto en negritas y emojis (máx 3 líneas) o null"
}
`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await axios.post(
        endpoint,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nConsulta del usuario: "${userText}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
            responseMimeType: 'application/json',
          },
        },
        { timeout: this.timeoutMs },
      );

      const candidateText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(candidateText);

      const latencia = Date.now() - startTime;
      this.logger.log(`[Gemini HTTPS] Consulta interpretada con éxito en ${latencia}ms`);

      return {
        intent: parsed.intent || 'Buscar Ruta',
        destination: parsed.destination || null,
        linea: parsed.linea || null,
        comuna: parsed.comuna || null,
        mensajeAclaracion: parsed.mensajeAclaracion || null,
        usandoFallback: false,
        latenciaMs: latencia,
      };
    } catch (err: any) {
      this.logger.warn(
        `[Gemini HTTPS] Fallo o timeout al consultar Gemini (${err.message}). Activando respaldo Nivel 1.`,
      );
      return this.executeNlpFallback(userText, startTime);
    }
  }

  /**
   * Respaldo Nivel 1 (HU #6 Tarea 5a): Motor léxico local predefinido ante caídas de la IA
   */
  private executeNlpFallback(userText: string, startTime: number): GeminiIntentResult {
    if (this.nlpFallback) {
      const nlpResult = this.nlpFallback.processQuery(userText);
      return {
        intent: nlpResult.intent as any,
        destination: nlpResult.destination,
        linea: (nlpResult as any).linea || null,
        comuna: (nlpResult as any).comuna || null,
        mensajeAclaracion:
          nlpResult.intent === 'unknown'
            ? 'Disculpa, no entendí bien tu destino. ¿Vas al Hospital de Quilpué, Estación Quilpué, Los Pinos o Feria El Belloto?'
            : null,
        usandoFallback: true,
        latenciaMs: Date.now() - startTime,
      };
    }

    return {
      intent: 'Buscar Ruta',
      destination: userText.substring(0, 30),
      usandoFallback: true,
      latenciaMs: Date.now() - startTime,
    };
  }
}
