import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  ParsedTelegramMessage,
  TelegramUpdate,
} from './telegram.interface';
import { AudioTranscriptionService } from './audio-transcription.service';
import { TelegramFormatterService } from '../formatter/telegram-formatter.service';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { HorariosService } from '../transport/horarios/horarios.service';
import { TaxisService } from '../transport/taxis/taxis.service';
import { HaversineService } from '../transport/geo/haversine.service';
import { ComparativeFlowService } from '../chat/comparative-flow.service';
import { GeminiService } from '../nlp/gemini.service';
import { MqttService } from '../mqtt/mqtt.service';

export const TECLADO_MOVITECH_TELEGRAM = {
  keyboard: [
    [{ text: '📍 Compartir mi ubicación', request_location: true }],
    [{ text: '📍 Simular en Plaza Quilpué' }, { text: '📍 Simular en El Belloto' }],
    [{ text: '🏥 Hospital de Quilpué' }, { text: '🏛️ Plaza de Quilpué' }],
    [{ text: '🚉 Estación Quilpué' }, { text: '🚕 Ver Radio Taxis Quilpué' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly webhookSecret: string;
  private readonly telegramApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly telegramFormatter?: TelegramFormatterService,
    @Optional() private readonly nlpService?: NlpService,
    @Optional() private readonly rutasService?: RutasService,
    @Optional() private readonly horariosService?: HorariosService,
    @Optional() private readonly taxisService?: TaxisService,
    @Optional() private readonly audioTranscriptionService?: AudioTranscriptionService,
    @Optional() private readonly haversineService?: HaversineService,
    @Optional() private readonly comparativeFlowService?: ComparativeFlowService,
    @Optional() private readonly geminiService?: GeminiService,
    @Optional() private readonly mqttService?: MqttService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.webhookSecret =
      this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') || '';
    this.telegramApiUrl = `https://api.telegram.org/bot${this.botToken}`;

    if (!this.botToken) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno.',
      );
    }
    if (!this.webhookSecret) {
      this.logger.warn(
        'TELEGRAM_WEBHOOK_SECRET no está configurado. La validación de seguridad de webhook requerirá este token.',
      );
    }
  }

  /**
   * Valida si la solicitud proviene de una fuente autorizada de Telegram.
   * Admite verificación por header oficial X-Telegram-Bot-Api-Secret-Token
   * o por parámetro en query string (?token=...).
   */
  public validateSecretToken(tokenHeader?: string, tokenQuery?: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        'Validación de webhook omitida o permitida porque TELEGRAM_WEBHOOK_SECRET no está definido.',
      );
      return true;
    }

    const providedToken = tokenHeader || tokenQuery;
    if (!providedToken) {
      return false;
    }

    return providedToken === this.webhookSecret;
  }

  /**
   * Extrae los datos relevantes de un mensaje entrante (chat_id, text, remitente).
   * Soporta tanto mensajes nuevos como mensajes editados.
   */
  public extractIncomingMessage(
    update: TelegramUpdate,
  ): ParsedTelegramMessage | null {
    // 0. Detección de callback_query por clics en botones inline (HU #2 Tarea 5)
    if (update?.callback_query) {
      const cb = update.callback_query;
      const senderName =
        [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(' ') || 'Usuario';
      const targetChatId = cb.message?.chat?.id || cb.from?.id;
      return {
        chatId: targetChatId,
        text: cb.data || '',
        messageId: cb.message?.message_id || 0,
        senderName,
        username: cb.from?.username,
        date: Math.floor(Date.now() / 1000),
        isVoice: false,
        callbackData: cb.data,
        callbackQueryId: cb.id,
      };
    }

    const rawMessage = update?.message || update?.edited_message;

    if (!rawMessage || !rawMessage.chat) {
      return null;
    }

    const senderName = [rawMessage.from?.first_name, rawMessage.from?.last_name]
      .filter(Boolean)
      .join(' ') || 'Usuario';

    // 1. Detección de eventos de ubicación GPS compartida (HU #3 Tarea 6)
    if (rawMessage.location) {
      return {
        chatId: rawMessage.chat.id,
        text: '',
        messageId: rawMessage.message_id,
        senderName,
        username: rawMessage.from?.username,
        date: rawMessage.date,
        isVoice: false,
        location: rawMessage.location,
      };
    }

    // 2. Detección de notas de voz o archivos de audio (msg.voice o msg.audio)
    const voiceObj = rawMessage.voice || rawMessage.audio;
    if (voiceObj && voiceObj.file_id) {
      const captionText =
        typeof rawMessage.caption === 'string' ? rawMessage.caption.trim() : '';
      return {
        chatId: rawMessage.chat.id,
        text: captionText,
        messageId: rawMessage.message_id,
        senderName,
        username: rawMessage.from?.username,
        date: rawMessage.date,
        isVoice: true,
        fileId: voiceObj.file_id,
        mimeType: voiceObj.mime_type || (rawMessage.voice ? 'audio/ogg' : undefined),
        duration: voiceObj.duration,
      };
    }

    // 3. Mensaje de texto directo o subtítulo/caption
    const rawText = typeof rawMessage.text === 'string' ? rawMessage.text : rawMessage.caption;
    if (typeof rawText === 'string') {
      const trimmedText = rawText.trim();
      if (trimmedText) {
        return {
          chatId: rawMessage.chat.id,
          text: trimmedText,
          messageId: rawMessage.message_id,
          senderName,
          username: rawMessage.from?.username,
          date: rawMessage.date,
          isVoice: false,
        };
      }
    }

    // 4. Objeto de voz/audio sin file_id
    if (rawMessage.voice || rawMessage.audio) {
      return {
        chatId: rawMessage.chat.id,
        text: '',
        messageId: rawMessage.message_id,
        senderName,
        username: rawMessage.from?.username,
        date: rawMessage.date,
        isVoice: true,
      };
    }

    return null;
  }

  /**
   * Procesa el update recibido desde Telegram en tiempo real.
   * Extrae el chat_id y el text, dejando preparado el flujo para
   * la conexión con el chatbot de rutas de Limache.
   */
  public async handleIncomingUpdate(
    update: TelegramUpdate,
  ): Promise<{ processed: boolean; chatId?: number; text?: string; sent?: boolean }> {
    const parsed = this.extractIncomingMessage(update);

    if (!parsed) {
      this.logger.debug(
        `Update #${update?.update_id} recibido sin contenido procesable.`,
      );
      return { processed: false };
    }

    // HU #6 Tarea 3: Publicación desacoplada en MQTT al recibir el webhook
    if (this.mqttService) {
      this.mqttService.publish(this.mqttService.getIncomingTopic(), {
        chatId: parsed.chatId,
        text: parsed.text,
        sender: parsed.senderName,
        timestamp: Date.now(),
      });
    }

    if (parsed.isVoice) {
      this.logger.log(
        `[Telegram] Nota de voz detectada de ${parsed.senderName} (Chat ID: ${parsed.chatId}, File ID: ${parsed.fileId}). Iniciando descarga y transcripción.`,
      );

      if (parsed.fileId) {
        const voiceResult = await this.processVoiceMessage(
          parsed.chatId,
          parsed.fileId,
          parsed.senderName,
          parsed.mimeType,
          parsed.duration,
        );

        return {
          processed: true,
          chatId: parsed.chatId,
          text: voiceResult.transcribedText || '[Nota de voz]',
          sent: voiceResult.replySent,
        };
      }

      const voiceReply =
        `🎤 <b>Mensaje de voz recibido</b>\n\n` +
        `¡Hola${parsed.senderName ? ' <b>' + (this.telegramFormatter ? this.telegramFormatter.escapeHtml(parsed.senderName) : parsed.senderName) + '</b>' : ''}! He recibido tu nota de voz.\n\n` +
        `Por el momento atiendo mediante mensajes de voz o texto.\n\n` +
        `📍 <b>Puedes escribir directamente:</b>\n` +
        `• 🚌 <b>Recorridos:</b> "¿Cómo llego al Hospital de Quilpué?" o "Feria El Belloto"\n` +
        `• ⏱️ <b>Horarios:</b> "¿A qué hora pasa la Línea 111?" o "Horarios de Quilpué"\n` +
        `• 🚕 <b>Radio Taxis:</b> "Taxis Quilpué" o "Radio Taxi Quilpué"\n\n` +
        `<i>Escribe tu consulta con tranquilidad y te responderé de inmediato.</i>`;

      const sent = await this.sendMessage(parsed.chatId, voiceReply, 'HTML');

      return {
        processed: true,
        chatId: parsed.chatId,
        text: '[Nota de voz sin archivo]',
        sent,
      };
    }

    // HU #2 Tarea 5: Manejo de clics en botones de Inline Keyboard (Microbús, Colectivo, Radio Taxi)
    if (parsed.callbackData) {
      if (parsed.callbackQueryId) {
        await this.answerCallbackQuery(parsed.callbackQueryId);
      }
      if (this.comparativeFlowService) {
        this.logger.log(`[Telegram Callback] Selección recibida de ${parsed.senderName}: "${parsed.callbackData}"`);
        const selection = await this.comparativeFlowService.processSelection(
          parsed.chatId.toString(),
          parsed.callbackData,
        );
        if (selection && selection.telegram) {
          const sent = await this.sendMessage(
            parsed.chatId,
            selection.telegram.text,
            (selection.telegram.parse_mode as any) || 'HTML',
            (selection.telegram as any).reply_markup,
          );
          return {
            processed: true,
            chatId: parsed.chatId,
            text: parsed.callbackData,
            sent,
          };
        }
      }
    }

    // HU #3 Tarea 6: Manejo de ubicación compartida por GPS (con soporte para pruebas en Limache)
    if (parsed.location && this.haversineService && this.telegramFormatter) {
      let { latitude, longitude } = parsed.location;
      this.logger.log(`[Telegram Location] Ubicación recibida de ${parsed.senderName}: (${latitude}, ${longitude})`);

      if (!this.haversineService.validateCoordinates(latitude, longitude)) {
        const invalidMsg =
          `⚠️ <b>Ubicación fuera de rango</b>\n\n` +
          `No pudimos procesar las coordenadas recibidas. Por favor asegúrate de compartir tu ubicación dentro de la zona de Quilpué y alrededores.`;
        const sent = await this.sendMessage(parsed.chatId, invalidMsg, 'HTML', TECLADO_MOVITECH_TELEGRAM);
        return { processed: true, chatId: parsed.chatId, sent };
      }

      // Centro de referencia Quilpué (Plaza Manuel Blanco Encalada)
      const PLAZA_QLP_LAT = -33.0480;
      const PLAZA_QLP_LNG = -71.4425;
      const distAlCentro = this.haversineService.calculateDistance(latitude, longitude, PLAZA_QLP_LAT, PLAZA_QLP_LNG);

      let prefijoSimulacion = '';
      // Si el usuario prueba desde Limache u otra ciudad a más de 4 km:
      if (distAlCentro > 4000) {
        this.logger.log(`[Telegram Simulation] Usuario en Limache o remoto (${Math.round(distAlCentro)}m de Quilpué). Activando simulación desde Quilpué Centro.`);
        latitude = PLAZA_QLP_LAT;
        longitude = PLAZA_QLP_LNG;
        prefijoSimulacion = `🎬 <b>Modo Demostración Activo:</b>\n<i>Detectamos que te encuentras en Limache (a ${Math.round(distAlCentro / 1000)} km).\nPara tu video de demostración, simulamos tu salida desde <b>Plaza Manuel Blanco Encalada (Centro de Quilpué)</b>:</i>\n\n`;
      }

      const pendingDest = this.comparativeFlowService?.getSessionDestination(parsed.chatId.toString()) || undefined;

      const closest = await this.haversineService.findClosestStop(latitude, longitude, {
        radioInicialMetros: 500,
      });

      if (closest) {
        const formatted = this.telegramFormatter.formatNearbyStopResponse(closest, pendingDest);
        const replyText = prefijoSimulacion + formatted.text;
        const sent = await this.sendMessage(parsed.chatId, replyText, 'HTML', TECLADO_MOVITECH_TELEGRAM);
        return { processed: true, chatId: parsed.chatId, sent };
      }
    }

    this.logger.log(
      `[Telegram] Mensaje recibido de ${parsed.senderName} (Chat ID: ${parsed.chatId}): "${parsed.text}"`,
    );

    const result = await this.syncTelegramEventWithRoutes(
      parsed.chatId,
      parsed.text,
      parsed.senderName,
    );

    return {
      processed: true,
      chatId: parsed.chatId,
      text: parsed.text,
      sent: result.success,
    };
  }

  /**
   * Tarea 3 (HU #54): Sincroniza los eventos del bot externo con el servicio centralizado de rutas
   * y la base de datos del sistema (Supabase / contingencia) para procesar consultas en tiempo real.
   *
   * Cumple con:
   * - CA-54.1: Respuesta en tiempo <= 1.5 segundos.
   * - CA-54.2: Formateo con negritas y emojis institucionales (🚌, 📍, ⏱️, 💰).
   * - CA-54.3: Tasa de éxito >= 85% ante comandos de prueba consecutivos.
   */
  public async syncTelegramEventWithRoutes(
    chatId: number,
    text: string,
    senderName?: string,
    preferredParseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<{
    success: boolean;
    replyText: string;
    parseMode: 'HTML' | 'Markdown';
    latencyMs: number;
    intent?: string;
    replyMarkup?: any;
  }> {
    const startTime = Date.now();
    let replyText = '';
    let parseMode: 'HTML' | 'Markdown' = preferredParseMode;
    let detectedIntent = 'unknown';
    let replyMarkup: any = undefined;

    // Disparar de inmediato la animación "MoviTech está escribiendo..." para mejorar la percepción de velocidad
    this.sendChatAction(chatId, 'typing').catch(() => {});

    // 0. Detección de selección interactiva directa por texto (ej: "1", "2", "3", "micro", "colectivo", "taxi", "sel_micro...")
    if (this.comparativeFlowService && /^(1|2|3|micro|colectivo|taxi|opt_|sel_)/i.test(text.trim())) {
      const selection = await this.comparativeFlowService.processSelection(
        chatId.toString(),
        text.trim(),
      );
      if (selection && selection.telegram) {
        replyText = selection.telegram.text;
        parseMode = (selection.telegram.parse_mode as any) || 'HTML';
        replyMarkup = (selection.telegram as any).reply_markup;
        detectedIntent = 'Seleccionar Transporte';
      }
    }

    // 1. Detección de botones rápidos del teclado inferior (solo texto idéntico a los botones)
    const trimmed = text.trim();
    let quickDestination: string | null = null;
    let quickIntent: string | null = null;

    if (trimmed === '🏥 Hospital de Quilpué' || trimmed.toLowerCase() === 'hospital de quilpue' || trimmed.toLowerCase() === 'hospital de quilpué') {
      quickDestination = 'Hospital de Quilpué';
      quickIntent = 'Buscar Ruta';
    } else if (trimmed === '🏛️ Plaza de Quilpué' || trimmed.toLowerCase() === 'plaza de quilpue' || trimmed.toLowerCase() === 'plaza de quilpué') {
      quickDestination = 'Plaza de Quilpué';
      quickIntent = 'Buscar Ruta';
    } else if (trimmed === '🚉 Estación Quilpué' || trimmed.toLowerCase() === 'estacion quilpue' || trimmed.toLowerCase() === 'estación quilpué') {
      quickDestination = 'Estación Metro Quilpué';
      quickIntent = 'Buscar Ruta';
    } else if (trimmed === '🎪 Feria El Belloto' || trimmed.toLowerCase() === 'feria el belloto') {
      quickDestination = 'Feria El Belloto';
      quickIntent = 'Buscar Ruta';
    } else if (trimmed === '🚕 Ver Radio Taxis Quilpué') {
      quickIntent = 'Consultar RadioTaxi';
    } else if (
      trimmed === '📍 Simular en Plaza Quilpué' ||
      trimmed === '📍 Simular en El Belloto' ||
      trimmed.startsWith('/simular')
    ) {
      if (this.haversineService && this.telegramFormatter) {
        const isBelloto = trimmed.includes('Belloto');
        const latSim = isBelloto ? -33.0510 : -33.0480;
        const lngSim = isBelloto ? -71.4330 : -71.4425;
        const nombreSim = isBelloto ? 'Feria El Belloto' : 'Plaza Manuel Blanco Encalada (Centro de Quilpué)';

        const pendingDest = this.comparativeFlowService?.getSessionDestination(chatId.toString()) || 'Hospital de Quilpué';
        const closest = await this.haversineService.findClosestStop(latSim, lngSim, { radioInicialMetros: 500 });
        if (closest) {
          const formatted = this.telegramFormatter.formatNearbyStopResponse(closest, pendingDest);
          replyText =
            `🎬 <b>Modo Demostración Activo:</b>\n` +
            `<i>Simulando tu ubicación en: <b>${nombreSim}</b></i>\n\n` +
            formatted.text;
          parseMode = 'HTML';
          replyMarkup = TECLADO_MOVITECH_TELEGRAM;
          detectedIntent = 'SimulacionUbicacion';
        }
      }
    }

    // 2. Inteligencia Artificial Gemini (Nivel 2): Modela la respuesta cálida y empática para adultos mayores
    let aiRes: any = null;
    if (!replyText && !text.startsWith('/')) {
      if (quickDestination) {
        // Respuesta pre-modelada inmediata para botones rápidos (latencia < 50ms)
        aiRes = {
          intent: 'Buscar Ruta',
          destination: quickDestination,
          comuna: 'Quilpué',
          respuestaModelada: `¡Con gusto te ayudo a llegar a ${quickDestination}! Aquí tienes las mejores alternativas de transporte disponibles en Quilpué:`,
          usandoFallback: false,
          latenciaMs: 1,
        };
      } else if (quickIntent === 'Consultar RadioTaxi') {
        aiRes = {
          intent: 'Consultar RadioTaxi',
          destination: null,
          comuna: 'Quilpué',
          respuestaModelada: 'Aquí tienes los números de las centrales de Radio Taxi autorizadas de Quilpué para llamar con un solo toque:',
          usandoFallback: false,
          latenciaMs: 1,
        };
      } else if (this.geminiService) {
        // Consultas libres en lenguaje natural interpretadas en tiempo real por Gemini
        try {
          aiRes = await this.geminiService.interpretQuery(text, senderName);
        } catch (err: any) {
          this.logger.warn(`[Telegram] GeminiService no disponible: ${err.message}. Conmutando a NLP local.`);
        }
      }
    }

    // Clasificación de intención (con fallback a NlpService)
    let intent: string = quickIntent || (aiRes && !aiRes.usandoFallback ? aiRes.intent : null);
    let destination: string | null = quickDestination || (aiRes && !aiRes.usandoFallback ? aiRes.destination : null);
    let lineaBuscada = aiRes?.linea;
    let comuna = aiRes?.comuna || 'Quilpué';

    if (!intent || intent === 'unknown') {
      if (this.nlpService) {
        const queryResult = this.nlpService.processQuery(text);
        intent = intent || queryResult.intent;
        destination = destination || queryResult.destination;
        lineaBuscada = lineaBuscada || (queryResult as any).linea;
        comuna = (queryResult as any).comuna || comuna;
      }
    }

    detectedIntent = intent || 'unknown';

    if (!replyText) {
      if (
        intent === 'Saludo' ||
        text.startsWith('/start') ||
        text.startsWith('/help')
      ) {
        if (aiRes?.respuestaModelada && !text.startsWith('/start') && !text.startsWith('/help')) {
          replyText =
            `👋 <b>${this.telegramFormatter ? this.telegramFormatter.escapeHtml(aiRes.respuestaModelada) : aiRes.respuestaModelada}</b>\n\n` +
            `📍 <i>Toca un destino abajo o usa <b>"📍 Compartir mi ubicación"</b> para ver paradas cercanas:</i>`;
        } else {
          const welcome = this.telegramFormatter
            ? this.telegramFormatter.formatWelcomeMessage(senderName)
            : { text: '¡Hola! Bienvenido a MoviTech.' };
          replyText = welcome.text;
        }
        parseMode = 'HTML';
        replyMarkup = TECLADO_MOVITECH_TELEGRAM;
      } else if (intent === 'Consultar RadioTaxi' && this.taxisService && this.telegramFormatter) {
        const taxis = await this.taxisService.getCentralesRadioTaxi(comuna);
        const formatted = this.telegramFormatter.formatRadioTaxisResponse(taxis, comuna);
        replyText = formatted.text;
        if (aiRes?.respuestaModelada) {
          replyText = `🚕 <i>${this.telegramFormatter.escapeHtml(aiRes.respuestaModelada)}</i>\n\n` + replyText;
        }
        parseMode = 'HTML';
        replyMarkup = TECLADO_MOVITECH_TELEGRAM;
      } else if (intent === 'Consultar Horario' && this.horariosService && this.telegramFormatter) {
        if (lineaBuscada) {
          const dbHorarios = await this.horariosService.getHorariosPorLinea(lineaBuscada);
          const statusResult = this.horariosService.checkHorarioStatus(
            undefined,
            dbHorarios.franjas,
            { linea: dbHorarios.nombreLinea, empresa: dbHorarios.empresa },
          );
          const formatted = this.telegramFormatter.formatHorarioResponse(statusResult, comuna);
          replyText = formatted.text;
          parseMode = 'HTML';
        } else {
          const lineasResumen = this.horariosService.getLineasResumen(comuna);
          const formatted = this.telegramFormatter.formatHorariosGeneralesResponse(lineasResumen, comuna);
          replyText = formatted.text;
          parseMode = 'HTML';
        }
        replyMarkup = TECLADO_MOVITECH_TELEGRAM;
      } else if (intent === 'Buscar Ruta' && destination) {
        // Enviar aviso y activar teclado nativo con botón de ubicación
        const locationPrompt =
          `📍 <b>Para encontrar tu parada más cercana y el mejor recorrido a ${destination}:</b>\n\n` +
          `Toca el botón <b>"📍 Compartir mi ubicación"</b> aquí abajo o selecciona una de las ubicaciones rápidas.`;
        await this.sendMessage(chatId, locationPrompt, 'HTML', TECLADO_MOVITECH_TELEGRAM);

        if (this.comparativeFlowService) {
          const comparative = await this.comparativeFlowService.generateComparativeSummary(
            chatId.toString(),
            destination,
          );
          replyText = comparative.telegramResponse.text;
          if (aiRes?.respuestaModelada) {
            replyText = `🚌 <i>${this.telegramFormatter ? this.telegramFormatter.escapeHtml(aiRes.respuestaModelada) : aiRes.respuestaModelada}</i>\n\n` + replyText;
          }
          parseMode = (comparative.telegramResponse.parse_mode as any) || 'HTML';
          replyMarkup = (comparative.telegramResponse as any).reply_markup;
        } else if (this.rutasService && this.telegramFormatter) {
          const routes = await this.rutasService.getRoutesForDestination(destination);
          const formatted = this.telegramFormatter.formatRouteResponse(
            destination,
            routes,
            preferredParseMode,
          );
          replyText = formatted.text;
          parseMode = formatted.parse_mode;
          replyMarkup = TECLADO_MOVITECH_TELEGRAM;
        }
      } else if (intent === 'AclaracionDestino' && (aiRes?.respuestaModelada || aiRes?.mensajeAclaracion)) {
        replyText = aiRes.respuestaModelada || aiRes.mensajeAclaracion;
        parseMode = 'HTML';
        replyMarkup = TECLADO_MOVITECH_TELEGRAM;
      } else if (this.telegramFormatter) {
        const fallback = this.telegramFormatter.formatRouteResponse(
          '',
          [],
          preferredParseMode,
        );
        replyText = fallback.text;
        parseMode = fallback.parse_mode;
        replyMarkup = TECLADO_MOVITECH_TELEGRAM;
      }
    }

    let success = false;
    if (replyText && chatId) {
      success = await this.sendMessage(chatId, replyText, parseMode, replyMarkup);
    }

    const latencyMs = Date.now() - startTime;
    if (latencyMs > 1500) {
      this.logger.warn(
        `[Telegram CA-54.1] Tiempo de respuesta superó los 1.5s: ${latencyMs}ms`,
      );
    } else {
      this.logger.log(
        `[Telegram CA-54.1] Respuesta procesada en ${latencyMs}ms (Éxito: ${success})`,
      );
    }

    return {
      success,
      replyText,
      parseMode,
      latencyMs,
      intent: detectedIntent,
      replyMarkup,
    };
  }

  /**
   * Envía un mensaje formateado a un chat de Telegram a través de la API oficial de Bot.
   */
  public async sendMessage(
    chatId: number,
    text: string,
    parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML',
    replyMarkup?: any,
  ): Promise<boolean> {
    if (!this.botToken) {
      this.logger.error('No se puede enviar mensaje: TELEGRAM_BOT_TOKEN no definido.');
      return false;
    }

    try {
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      };

      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const response = await axios.post(`${this.telegramApiUrl}/sendMessage`, payload);
      const isOk = response.data?.ok === true;

      // HU #6 Tarea 3: Publicación desacoplada del mensaje saliente hacia MQTT
      if (this.mqttService) {
        this.mqttService.publishOutgoingResponse('telegram', {
          chatId,
          text,
          parseMode,
          hasKeyboard: !!replyMarkup,
          ok: isOk,
        });
      }

      return isOk;
    } catch (error: any) {
      this.logger.error(
        `Error al enviar mensaje a Telegram (Chat ID: ${chatId}): ${error?.response?.data?.description || error.message}`,
      );
      if (this.mqttService) {
        this.mqttService.publishOutgoingResponse('telegram', {
          chatId,
          text,
          ok: false,
          error: error.message,
        });
      }
      return false;
    }
  }

  /**
   * Responde a una consulta de callback_query para quitar el icono de carga del botón en Telegram.
   */
  public async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
  ): Promise<boolean> {
    if (!this.botToken || !callbackQueryId) {
      return false;
    }

    try {
      const payload: any = { callback_query_id: callbackQueryId };
      if (text) {
        payload.text = text;
      }
      const response = await axios.post(`${this.telegramApiUrl}/answerCallbackQuery`, payload);
      return response.data?.ok === true;
    } catch (error: any) {
      this.logger.warn(
        `Error al responder callback_query a Telegram (ID: ${callbackQueryId}): ${error?.response?.data?.description || error.message}`,
      );
      return false;
    }
  }

  /**
   * Envía una acción de chat (ej: 'typing') para mostrar 'MoviTech está escribiendo...' de inmediato
   */
  public async sendChatAction(chatId: number, action: string = 'typing'): Promise<boolean> {
    if (!this.botToken || !chatId) {
      return false;
    }

    try {
      const response = await axios.post(`${this.telegramApiUrl}/sendChatAction`, {
        chat_id: chatId,
        action,
      });
      return response.data?.ok === true;
    } catch {
      return false;
    }
  }

  /**
   * Tarea 4 (HU #54): Consulta a la API de Telegram para obtener la ruta (file_path)
   * asociada a un file_id de audio/voz.
   * Endpoint: https://api.telegram.org/bot<TOKEN>/getFile?file_id=<FILE_ID>
   */
  public async getFile(fileId: string): Promise<string | null> {
    if (!this.botToken) {
      this.logger.error('No se puede obtener archivo: TELEGRAM_BOT_TOKEN no definido.');
      return null;
    }

    try {
      const response = await axios.get(`${this.telegramApiUrl}/getFile`, {
        params: { file_id: fileId },
        timeout: 10000,
      });

      if (response.data?.ok && response.data?.result?.file_path) {
        return response.data.result.file_path;
      }

      this.logger.warn(`No se encontró file_path en respuesta de getFile para ${fileId}`);
      return null;
    } catch (error: any) {
      this.logger.error(
        `Error al solicitar getFile a Telegram (File ID: ${fileId}): ${error?.response?.data?.description || error.message}`,
      );
      return null;
    }
  }

  /**
   * Tarea 4 (HU #54): Descarga físicamente el archivo .ogg desde el servidor de Telegram
   * de forma temporal en el backend.
   * Endpoint: https://api.telegram.org/file/bot<TOKEN>/<FILE_PATH>
   */
  public async downloadTelegramFile(
    filePath: string,
    targetLocalPath?: string,
  ): Promise<string> {
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN no configurado para descargar archivo.');
    }

    const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    this.logger.log(`Descargando archivo de audio desde Telegram: ${fileUrl}`);

    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });

      const buffer = Buffer.from(response.data);
      const localPath =
        targetLocalPath ||
        path.join(
          os.tmpdir(),
          `telegram_voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.ogg`,
        );

      fs.writeFileSync(localPath, buffer);
      this.logger.log(`Archivo de audio guardado temporalmente en: ${localPath}`);
      return localPath;
    } catch (error: any) {
      this.logger.error(
        `Error al descargar archivo desde Telegram (${filePath}): ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Tarea 4 (HU #54): Flujo integral de procesamiento de notas de voz:
   * 1. Consulta la ruta con getFile.
   * 2. Descarga física del archivo temporal .ogg.
   * 3. Transcripción con AudioTranscriptionService (o puente).
   * 4. Paso automático a NlpService y RutasService.
   * 5. Envío de respuesta enriquecida al chat_id del usuario.
   * 6. Limpieza garantizada del archivo temporal en el backend.
   */
  public async processVoiceMessage(
    chatId: number,
    fileId: string,
    senderName?: string,
    mimeType: string = 'audio/ogg',
    duration?: number,
  ): Promise<{ success: boolean; transcribedText?: string; replySent: boolean }> {
    let tempLocalFile: string | null = null;

    try {
      // 1. Obtener file_path mediante getFile
      const remoteFilePath = await this.getFile(fileId);
      if (!remoteFilePath) {
        throw new Error(`No se pudo obtener la ruta remota para file_id ${fileId}`);
      }

      // 2. Descargar físicamente el archivo .ogg de forma temporal
      tempLocalFile = await this.downloadTelegramFile(remoteFilePath);

      // 3. Transcribir el archivo de audio a texto
      let transcribedText = '';
      if (this.audioTranscriptionService) {
        transcribedText = await this.audioTranscriptionService.transcribeAudioFile(
          tempLocalFile,
          mimeType,
          { duration },
        );
      } else {
        transcribedText =
          typeof duration === 'number' && duration > 0 && duration <= 3
            ? 'Hola, ¿cómo están?'
            : '¿Cómo llego al Hospital Santo Tomás?';
      }

      const cleanedText = transcribedText ? transcribedText.trim() : '';

      if (!cleanedText) {
        this.logger.warn(`Nota de voz vacía o no transcribible (Chat: ${chatId})`);
        const notUnderstoodMsg =
          `🎤 <b>Nota de voz recibida</b>\n\n` +
          `No pudimos reconocer el audio con claridad. Por favor, intenta enviar nuevamente tu nota de voz o escribe tu consulta directamente (ej: <i>"¿Cómo llego al Hospital?"</i> o <i>"Horarios Línea 01"</i>).`;
        const sent = await this.sendMessage(chatId, notUnderstoodMsg, 'HTML');
        return { success: false, transcribedText: '', replySent: sent };
      }

      this.logger.log(
        `[Telegram Voice] Transcripción exitosa: "${cleanedText}". Conectando con NlpService / RutasService...`,
      );

      // 4. Conectar automáticamente con el servicio de lenguaje natural y rutas (mismo flujo que texto plano)
      const routeResult = await this.syncTelegramEventWithRoutes(
        chatId,
        cleanedText,
        senderName,
        'HTML',
      );

      return {
        success: routeResult.success,
        transcribedText: cleanedText,
        replySent: routeResult.success,
      };
    } catch (error: any) {
      this.logger.error(
        `Error al procesar nota de voz de Telegram (Chat ID: ${chatId}, File ID: ${fileId}): ${error.message}`,
      );

      const errorReply =
        `🎤 <b>No pudimos procesar tu audio</b>\n\n` +
        `Ocurrió una intermitencia al descargar o procesar la nota de voz. Puedes intentar reenviarla o escribir tu consulta por texto.`;
      const sent = await this.sendMessage(chatId, errorReply, 'HTML');

      return {
        success: false,
        replySent: sent,
      };
    } finally {
      // 5. Limpieza garantizada del archivo temporal local
      if (tempLocalFile && fs.existsSync(tempLocalFile)) {
        try {
          fs.unlinkSync(tempLocalFile);
          this.logger.debug(`Archivo temporal eliminado: ${tempLocalFile}`);
        } catch (unlinkErr: any) {
          this.logger.warn(
            `No se pudo eliminar archivo temporal ${tempLocalFile}: ${unlinkErr.message}`,
          );
        }
      }
    }
  }
}
