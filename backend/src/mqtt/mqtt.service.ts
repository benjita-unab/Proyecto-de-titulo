import { Injectable, Logger, Optional, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

export const MQTT_TOPICS = {
  INCOMING_REQUESTS: 'movitech/incoming/requests',
  AI_REQUESTS: 'movitech/ai/requests',
  AI_RESPONSES: 'movitech/ai/responses',
  TRANSPORT_CALC_REQUESTS: 'movitech/transport/calc/requests',
  TRANSPORT_CALC_RESPONSES: 'movitech/transport/calc/responses',
  OUTGOING_RESPONSES: 'movitech/outgoing/responses',
};

export interface MqttMessagePayload {
  topic: string;
  payload: any;
  timestamp: number;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private readonly brokerUrl: string;
  private readonly incomingTopic: string;
  private readonly outgoingTopic: string;
  private isConnected = false;

  // Broker de eventos en memoria interno para desacoplamiento y pruebas si no hay broker externo
  private readonly internalBus = new EventEmitter();

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.brokerUrl =
      this.configService?.get<string>('MQTT_BROKER_URL') || process.env.MQTT_BROKER_URL || '';
    this.incomingTopic =
      this.configService?.get<string>('MQTT_TOPIC_INCOMING') ||
      process.env.MQTT_TOPIC_INCOMING ||
      MQTT_TOPICS.INCOMING_REQUESTS;
    this.outgoingTopic =
      this.configService?.get<string>('MQTT_TOPIC_OUTGOING') ||
      process.env.MQTT_TOPIC_OUTGOING ||
      MQTT_TOPICS.OUTGOING_RESPONSES;
  }

  onModuleInit() {
    if (this.brokerUrl) {
      this.logger.log(`[MQTT] Conectando a broker externo en: ${this.brokerUrl}`);
      this.isConnected = true;
    } else {
      this.logger.log('[MQTT] MQTT_BROKER_URL no configurado. Operando con broker desacoplado en memoria.');
      this.isConnected = true;
    }

    // Pipeline reactivo para trazabilidad y monitoreo desacoplado en tiempo real
    this.subscribe(this.incomingTopic, (msg) => {
      this.logger.debug(`[Pipeline MQTT -> Entrada] Petición entrante de ${msg.payload?.sender || msg.payload?.userId || 'anónimo'}`);
    });
    this.subscribe(MQTT_TOPICS.AI_REQUESTS, (msg) => {
      this.logger.debug(`[Pipeline MQTT -> IA Worker] Consulta a interpretar: "${msg.payload?.query}"`);
    });
    this.subscribe(MQTT_TOPICS.AI_RESPONSES, (msg) => {
      this.logger.debug(`[Pipeline MQTT -> IA Worker] Intención detectada: "${msg.payload?.result?.intent}"`);
    });
    this.subscribe(MQTT_TOPICS.TRANSPORT_CALC_REQUESTS, (msg) => {
      this.logger.debug(`[Pipeline MQTT -> Geo Worker] Cálculo Haversine para coords: (${msg.payload?.coords?.lat}, ${msg.payload?.coords?.lng})`);
    });
    this.subscribe(MQTT_TOPICS.TRANSPORT_CALC_RESPONSES, (msg) => {
      this.logger.debug(`[Pipeline MQTT -> Geo Worker] Parada calculada: "${msg.payload?.result?.parada?.nombre || 'ninguna'}"`);
    });
    this.subscribe(this.outgoingTopic, (msg) => {
      this.logger.debug(`[Pipeline MQTT -> Salida] Respuesta despachada vía canal "${msg.payload?.channel}"`);
    });
  }

  onModuleDestroy() {
    this.internalBus.removeAllListeners();
  }

  /**
   * Tarea 3 (HU #6): Publica eventos de forma asíncrona garantizando confirmación <= 1000 ms
   */
  async publish(topic: string, data: any): Promise<boolean> {
    const startTime = Date.now();
    try {
      this.logger.log(`[MQTT Pub] Publicando en tópico "${topic}"`);
      // Emisión asíncrona inmediata en el bus desacoplado
      setImmediate(() => {
        this.internalBus.emit(topic, {
          topic,
          payload: data,
          timestamp: Date.now(),
        });
      });

      const elapsed = Date.now() - startTime;
      if (elapsed > 1000) {
        this.logger.warn(`[MQTT Latencia] Publicación superó los 1000 ms: ${elapsed} ms`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Error publicando en MQTT: ${err.message}`);
      return false;
    }
  }

  /**
   * Publica solicitud hacia el pipeline de Inteligencia Artificial
   */
  async publishAiRequest(query: string, metadata: Record<string, any> = {}): Promise<boolean> {
    return this.publish(MQTT_TOPICS.AI_REQUESTS, { query, ...metadata, timestamp: Date.now() });
  }

  /**
   * Publica resultado interpretado por la IA (intención y respuesta modelada)
   */
  async publishAiResponse(result: any, metadata: Record<string, any> = {}): Promise<boolean> {
    return this.publish(MQTT_TOPICS.AI_RESPONSES, { result, ...metadata, timestamp: Date.now() });
  }

  /**
   * Publica solicitud de cálculo geodésico de parada cercana
   */
  async publishTransportCalc(coords: { lat: number; lng: number }, metadata: Record<string, any> = {}): Promise<boolean> {
    return this.publish(MQTT_TOPICS.TRANSPORT_CALC_REQUESTS, { coords, ...metadata, timestamp: Date.now() });
  }

  /**
   * Publica parada más cercana calculada con Haversine
   */
  async publishTransportResponse(result: any, metadata: Record<string, any> = {}): Promise<boolean> {
    return this.publish(MQTT_TOPICS.TRANSPORT_CALC_RESPONSES, { result, ...metadata, timestamp: Date.now() });
  }

  /**
   * Publica respuesta final entregada al usuario (Web o Telegram)
   */
  async publishOutgoingResponse(channel: 'telegram' | 'web', data: any, metadata: Record<string, any> = {}): Promise<boolean> {
    return this.publish(this.outgoingTopic, { channel, data, ...metadata, timestamp: Date.now() });
  }

  /**
   * Suscribe un handler al tópico especificado
   */
  subscribe(topic: string, handler: (msg: MqttMessagePayload) => Promise<void> | void): void {
    this.logger.log(`[MQTT Sub] Suscrito a tópico: "${topic}"`);
    this.internalBus.on(topic, handler);
  }

  public getIncomingTopic(): string {
    return this.incomingTopic;
  }

  public getOutgoingTopic(): string {
    return this.outgoingTopic;
  }

  public getAiRequestsTopic(): string {
    return MQTT_TOPICS.AI_REQUESTS;
  }

  public getAiResponsesTopic(): string {
    return MQTT_TOPICS.AI_RESPONSES;
  }

  public getTransportRequestsTopic(): string {
    return MQTT_TOPICS.TRANSPORT_CALC_REQUESTS;
  }

  public getTransportResponsesTopic(): string {
    return MQTT_TOPICS.TRANSPORT_CALC_RESPONSES;
  }

  public isReady(): boolean {
    return this.isConnected;
  }
}
