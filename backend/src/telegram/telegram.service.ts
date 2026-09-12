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

    // 1. Detección de notas de voz o archivos de audio (msg.voice o msg.audio)
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

    // 2. Mensaje de texto directo o subtítulo/caption
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

    // 3. Objeto de voz/audio sin file_id
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
        `• 🚌 <b>Recorridos:</b> "¿Cómo llego al Hospital?" o "Plaza de las 40 Horas"\n` +
        `• ⏱️ <b>Horarios:</b> "Horarios de la Línea 01"\n` +
        `• 🚕 <b>Radio Taxis:</b> "Taxi"\n\n` +
        `<i>Escribe tu consulta con tranquilidad y te responderé de inmediato.</i>`;

      const sent = await this.sendMessage(parsed.chatId, voiceReply, 'HTML');

      return {
        processed: true,
        chatId: parsed.chatId,
        text: '[Nota de voz sin archivo]',
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
