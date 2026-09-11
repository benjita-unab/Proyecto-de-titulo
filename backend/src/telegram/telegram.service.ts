import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ParsedTelegramMessage,
  TelegramUpdate,
} from './telegram.interface';
import { TelegramFormatterService } from '../formatter/telegram-formatter.service';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { HorariosService } from '../transport/horarios/horarios.service';
import { TaxisService } from '../transport/taxis/taxis.service';

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
    const rawMessage = update?.message || update?.edited_message;

    if (!rawMessage || !rawMessage.chat) {
      return null;
    }

    const senderName = [rawMessage.from?.first_name, rawMessage.from?.last_name]
      .filter(Boolean)
      .join(' ') || 'Usuario';

    // 1. Mensaje de texto directo o subtítulo/caption (ej. archivo de audio o foto con texto)
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

    // 2. Mensaje de voz o nota de audio sin texto
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
        `Update #${update?.update_id} recibido sin contenido de texto procesable.`,
      );
      return { processed: false };
    }

    if (parsed.isVoice) {
      this.logger.log(
        `[Telegram] Nota de voz recibida de ${parsed.senderName} (Chat ID: ${parsed.chatId}). Enviando mensaje de orientación accesible.`,
      );

      const voiceReply =
        `🎤 <b>Mensaje de voz recibido</b>\n\n` +
        `¡Hola${parsed.senderName ? ' <b>' + (this.telegramFormatter ? this.telegramFormatter.escapeHtml(parsed.senderName) : parsed.senderName) + '</b>' : ''}! He recibido tu nota de voz.\n\n` +
        `Por el momento en Telegram atiendo mediante <b>mensajes de texto</b>.\n\n` +
        `📍 <b>Puedes escribir directamente:</b>\n` +
        `• 🚌 <b>Recorridos:</b> "¿Cómo llego al Hospital?" o "Plaza de las 40 Horas"\n` +
        `• ⏱️ <b>Horarios:</b> "Horarios de la Línea 01"\n` +
        `• 🚕 <b>Radio Taxis:</b> "Taxi"\n\n` +
        `<i>Escribe tu consulta con tranquilidad y te responderé de inmediato.</i>`;

      const sent = await this.sendMessage(parsed.chatId, voiceReply, 'HTML');

      return {
        processed: true,
        chatId: parsed.chatId,
        text: '[Nota de voz]',
        sent,
      };
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
  }> {
    const startTime = Date.now();
    let replyText = '';
    let parseMode: 'HTML' | 'Markdown' = preferredParseMode;
    let detectedIntent = 'unknown';

    if (this.nlpService && this.telegramFormatter) {
      const queryResult = this.nlpService.processQuery(text);
      const { intent, destination } = queryResult;
      detectedIntent = intent;

      if (
        intent === 'Saludo' ||
        text.startsWith('/start') ||
        text.startsWith('/help')
      ) {
        const welcome = this.telegramFormatter.formatWelcomeMessage(senderName);
        replyText = welcome.text;
        parseMode = 'HTML';
      } else if (intent === 'Consultar RadioTaxi' && this.taxisService) {
        const taxis = await this.taxisService.getCentralesRadioTaxi();
        const formatted = this.telegramFormatter.formatRadioTaxisResponse(taxis);
        replyText = formatted.text;
        parseMode = 'HTML';
      } else if (intent === 'Consultar Horario' && this.horariosService) {
        const lineaBuscada = (queryResult as any).linea;
        const dbHorarios = await this.horariosService.getHorariosPorLinea(lineaBuscada);
        const statusResult = this.horariosService.checkHorarioStatus(
          undefined,
          dbHorarios.franjas,
          { linea: dbHorarios.nombreLinea, empresa: dbHorarios.empresa },
        );
        const formatted = this.telegramFormatter.formatHorarioResponse(statusResult);
        replyText = formatted.text;
        parseMode = 'HTML';
      } else if (intent === 'Buscar Ruta' && destination && this.rutasService) {
        // Consulta directa a capa de datos de rutas (Supabase / contingencia Limache)
        const routes = await this.rutasService.getRoutesForDestination(destination);
        const formatted = this.telegramFormatter.formatRouteResponse(
          destination,
          routes,
          preferredParseMode,
        );
        replyText = formatted.text;
        parseMode = formatted.parse_mode;
      } else {
        const fallback = this.telegramFormatter.formatRouteResponse(
          '',
          [],
          preferredParseMode,
        );
        replyText = fallback.text;
        parseMode = fallback.parse_mode;
      }
    } else if (this.telegramFormatter) {
      const welcome = this.telegramFormatter.formatWelcomeMessage(senderName);
      replyText = welcome.text;
      parseMode = 'HTML';
    }

    let success = false;
    if (replyText && chatId) {
      success = await this.sendMessage(chatId, replyText, parseMode);
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
    };
  }

  /**
   * Envía un mensaje formateado a un chat de Telegram a través de la API oficial de Bot.
   */
  public async sendMessage(
    chatId: number,
    text: string,
    parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML',
  ): Promise<boolean> {
    if (!this.botToken) {
      this.logger.error('No se puede enviar mensaje: TELEGRAM_BOT_TOKEN no definido.');
      return false;
    }

    try {
      const response = await axios.post(`${this.telegramApiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      });

      return response.data?.ok === true;
    } catch (error: any) {
      this.logger.error(
        `Error al enviar mensaje a Telegram (Chat ID: ${chatId}): ${error?.response?.data?.description || error.message}`,
      );
      return false;
    }
  }
}
