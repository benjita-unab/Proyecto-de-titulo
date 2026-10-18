import { Controller, Get, Post, Body, Query, HttpStatus, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { WhatsAppWebhookDto } from './whatsapp.dto';
import { ComparativeFlowService } from './comparative-flow.service';
import { NlpService } from '../nlp/nlp.service';

@Controller('api/whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly comparativeFlowService: ComparativeFlowService,
    private readonly nlpService: NlpService,
  ) {}

  /**
   * Endpoint de verificación del Webhook de WhatsApp Cloud API (Meta)
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken =
      this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || 'movitech_token_seguro';

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook de WhatsApp verificado con éxito.');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn('Fallo en la verificación del webhook de WhatsApp. Token inválido.');
    return res.status(HttpStatus.FORBIDDEN).send('Token no coincide');
  }

  /**
   * Endpoint receptor de eventos y mensajes de WhatsApp (HU #2 Tarea 5)
   * Captura texto y clics en botones nativos (Microbús, Colectivo, Radio Taxi).
   */
  @Post()
  async handleIncomingMessage(@Body() body: WhatsAppWebhookDto, @Res() res: Response) {
    // Responder inmediatamente 200 OK para cumplir con latencia <= 1000ms de WhatsApp
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    try {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (!message) {
        return;
      }

      const senderPhone = message.from;
      let userText = '';

      if (message.type === 'text' && message.text?.body) {
        userText = message.text.body;
      } else if (message.type === 'interactive') {
        userText =
          message.interactive?.button_reply?.id ||
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.id ||
          '';
      } else if (message.type === 'button') {
        userText = message.button?.payload || message.button?.text || '';
      }

      this.logger.log(`[WhatsApp] Mensaje de ${senderPhone}: "${userText}"`);

      // 1. Verificar si es selección interactiva de un comparativo previo
      const selectionResult = await this.comparativeFlowService.processSelection(senderPhone, userText);
      if (selectionResult) {
        this.logger.log(`[WhatsApp] Opción seleccionada por ${senderPhone}: ${selectionResult.selectedType}`);
        return;
      }

      // 2. Procesar intención con NLP
      const queryResult = this.nlpService.processQuery(userText);
      if (queryResult.intent === 'Buscar Ruta' && queryResult.destination) {
        const comparative = await this.comparativeFlowService.generateComparativeSummary(
          senderPhone,
          queryResult.destination,
        );
        this.logger.log(`[WhatsApp] Comparativa generada para ${senderPhone} hacia ${comparative.destination}`);
      }
    } catch (err: any) {
      this.logger.error(`Error procesando mensaje entrante de WhatsApp: ${err.message}`);
    }
  }
}
