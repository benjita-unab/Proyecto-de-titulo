import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ParsedTelegramMessage,
  TelegramUpdate,
} from './telegram.interface';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly webhookSecret: string;
  private readonly telegramApiUrl: string;

  constructor(private readonly configService: ConfigService) {
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

    if (!rawMessage || !rawMessage.chat || typeof rawMessage.text !== 'string') {
      return null;
    }

    const trimmedText = rawMessage.text.trim();
    if (!trimmedText) {
      return null;
    }

    const senderName = [rawMessage.from?.first_name, rawMessage.from?.last_name]
      .filter(Boolean)
      .join(' ') || 'Usuario';

    return {
      chatId: rawMessage.chat.id,
      text: trimmedText,
      messageId: rawMessage.message_id,
      senderName,
      username: rawMessage.from?.username,
      date: rawMessage.date,
    };
  }

  /**
   * Procesa el update recibido desde Telegram en tiempo real.
   * Extrae el chat_id y el text, dejando preparado el flujo para
   * la conexión con el chatbot de rutas de Limache.
   */
  public async handleIncomingUpdate(
    update: TelegramUpdate,
  ): Promise<{ processed: boolean; chatId?: number; text?: string }> {
    const parsed = this.extractIncomingMessage(update);

    if (!parsed) {
      this.logger.debug(
        `Update #${update?.update_id} recibido sin contenido de texto procesable.`,
      );
      return { processed: false };
    }

    this.logger.log(
      `[Telegram] Mensaje recibido de ${parsed.senderName} (Chat ID: ${parsed.chatId}): "${parsed.text}"`,
    );

    // Método base listo para orquestar la consulta a la lógica de transporte de Limache
    // En las siguientes tareas de la HU se integrará directamente con NLP y Rutas/Horarios.

    return {
      processed: true,
      chatId: parsed.chatId,
      text: parsed.text,
    };
  }

  /**
   * Envía un mensaje formateado a un chat de Telegram a través de la API oficial de Bot.
   */
  public async sendMessage(
    chatId: number,
    text: string,
    parseMode: 'HTML' | 'MarkdownV2' = 'HTML',
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
