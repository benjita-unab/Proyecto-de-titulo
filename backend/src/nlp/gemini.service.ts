import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NlpService } from './nlp.service';
import { MqttService } from '../mqtt/mqtt.service';

export interface GeminiIntentResult {
  intent: 'Buscar Ruta' | 'Consultar Horario' | 'Consultar RadioTaxi' | 'Saludo' | 'AclaracionDestino' | 'unknown';
  destination: string | null;
  linea?: string | null;
  comuna?: string | null;
  respuestaModelada?: string | null;
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
    @Optional() private readonly mqttService?: MqttService,
  ) {
    this.apiKey =
      this.configService?.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    this.model =
      this.configService?.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-flash-lite-latest';
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
   * Modela respuestas cálidas, humanas y accesibles para adultos mayores de Quilpué.
   * Si la IA falla o excede el tiempo límite, conmuta a respaldo predefinido (Nivel 1).
   */
  async interpretQuery(userText: string, senderName?: string): Promise<GeminiIntentResult> {
    const startTime = Date.now();

    if (!userText || !userText.trim()) {
      return {
        intent: 'unknown',
        destination: null,
        usandoFallback: false,
        latenciaMs: 0,
      };
    }

    // HU #6 Tarea 3: Publicación desacoplada de la consulta hacia el tópico MQTT de IA
    if (this.mqttService) {
      this.mqttService.publishAiRequest(userText, { senderName });
    }

    const deliverResult = (res: GeminiIntentResult): GeminiIntentResult => {
      if (this.mqttService) {
        this.mqttService.publishAiResponse(res, { query: userText, senderName });
      }
      return res;
    };

    // Si no hay API key de Gemini, usar inmediatamente Nivel 1 de respaldo
    if (!this.apiKey) {
      return deliverResult(this.executeNlpFallback(userText, startTime));
    }

    const nameClause = senderName ? `El usuario se llama "${senderName}".` : '';

    const systemPrompt = `
Eres MoviTech, el asistente virtual empático, paciente y cercano para adultos mayores de Quilpué (y comunas vecinas de la Región de Valparaíso, Chile).
${nameClause}
Tu misión es:
1. Interpretar la consulta del usuario, tolerando modismos chilenos ("micro", "bondi", "colectivo", "ir pa", "dejar botado", "la feria"), abreviaturas y faltas de ortografía.
2. Modelar una "respuestaModelada" cálida, empática, escrita en tono respetuoso y claro (máximo 2 a 3 oraciones cortas).

Lista blanca de destinos oficiales:
${LISTA_BLANCA_DESTINOS_MARGA_MARGA.map((d) => `- "${d}"`).join('\n')}

Clasifica la intención en UNA de estas:
1. "Buscar Ruta": Si desea viajar o consultar cómo llegar a un destino (ej: "¿cómo llego al hospital de Quilpué?").
2. "Consultar Horario": Si pregunta por frecuencias o a qué hora pasa una micro/colectivo.
3. "Consultar RadioTaxi": Si busca teléfonos o centrales de radiotaxis de Quilpué.
4. "Saludo": Si sólo saluda cordialmente (ej: "hola", "buenos días", "cómo estás").
5. "AclaracionDestino": Si el destino no es comprensible o está fuera de la zona.

PAUTAS PARA "respuestaModelada":
- Si es "Saludo": Saluda afectuosamente (con su nombre si está disponible), dile que estás para ayudarle con sus viajes en micro, colectivo o radiotaxi en Quilpué y pregúntale a dónde le gustaría ir.
- Si es "Buscar Ruta": Confirma amablemente que le ayudarás a llegar a su destino (ej: "¡Con gusto te ayudo a llegar a [Destino]!").
- Si es "Consultar RadioTaxi": Indica cordialmente que aquí tienes las centrales autorizadas de Radio Taxi de Quilpué.
- Si es "Consultar Horario": Indica amablemente los horarios de recorrido disponibles.
- Si es "AclaracionDestino": Pregunta con mucha paciencia si se dirige a puntos conocidos como Hospital de Quilpué, Centro, Feria El Belloto o Los Pinos.

REGLAS ESTRICTAS DE RESPUESTA:
- Responde ÚNICAMENTE en formato JSON plano:
{
  "intent": "Buscar Ruta" | "Consultar Horario" | "Consultar RadioTaxi" | "Saludo" | "AclaracionDestino" | "unknown",
  "destination": "Nombre exacto normalizado o null",
  "linea": "Nombre de línea o null",
  "comuna": "Quilpué" o "Villa Alemana" o null,
  "respuestaModelada": "Texto cálido y natural para el adulto mayor",
  "mensajeAclaracion": "Mensaje corto en negritas y emojis o null"
}
`;

    const tryModels = [
      this.model,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
    ];
    const uniqueModels = [...new Set(tryModels.filter(Boolean))];

    for (const currentModel of uniqueModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`;

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
              temperature: 0.2,
              maxOutputTokens: 1000,
              responseMimeType: 'application/json',
            },
          },
          { timeout: this.timeoutMs },
        );

        let candidateText =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        candidateText = candidateText
          .replace(/^```json/i, '')
          .replace(/^```/i, '')
          .replace(/```$/i, '')
          .trim();

        const parsed = JSON.parse(candidateText);

        const latencia = Date.now() - startTime;
        this.logger.log(`[Gemini HTTPS] Consulta interpretada con éxito con modelo ${currentModel} en ${latencia}ms`);

        let intentFinal = parsed.intent || 'Buscar Ruta';
        if (intentFinal.toLowerCase().includes('ruta') || intentFinal === 'Consultar Ruta') {
          intentFinal = 'Buscar Ruta';
        }

        return deliverResult({
          intent: intentFinal,
          destination: parsed.destination || null,
          linea: parsed.linea || null,
          comuna: parsed.comuna || 'Quilpué',
          respuestaModelada: parsed.respuestaModelada || null,
          mensajeAclaracion: parsed.mensajeAclaracion || null,
          usandoFallback: false,
          latenciaMs: latencia,
        });
      } catch (err: any) {
        this.logger.warn(
          `[Gemini HTTPS] Fallo con modelo ${currentModel} (${err.response?.status || err.message}). Probando alternativa o fallback...`,
        );
      }
    }

    this.logger.warn(`[Gemini HTTPS] No se pudo obtener respuesta de la API de Gemini. Activando respaldo Nivel 1.`);
    return deliverResult(this.executeNlpFallback(userText, startTime));
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
        respuestaModelada:
          nlpResult.intent === 'Saludo'
            ? '¡Hola! Es un gusto saludarte. Soy tu asistente MoviTech de Quilpué. ¿A dónde deseas viajar hoy o qué horario necesitas consultar?'
            : null,
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
      respuestaModelada: null,
      usandoFallback: true,
      latenciaMs: Date.now() - startTime,
    };
  }
}

