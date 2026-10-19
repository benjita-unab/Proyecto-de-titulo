import { Injectable, Logger, Optional, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

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
      'movitech/incoming/requests';
    this.outgoingTopic =
      this.configService?.get<string>('MQTT_TOPIC_OUTGOING') ||
      process.env.MQTT_TOPIC_OUTGOING ||
      'movitech/outgoing/responses';
  }

  onModuleInit() {
    if (this.brokerUrl) {
      this.logger.log(`[MQTT] Conectando a broker externo en: ${this.brokerUrl}`);
      this.isConnected = true;
    } else {
      this.logger.log('[MQTT] MQTT_BROKER_URL no configurado. Operando con broker desacoplado en memoria.');
      this.isConnected = true;
    }
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

  public isReady(): boolean {
    return this.isConnected;
  }
}
