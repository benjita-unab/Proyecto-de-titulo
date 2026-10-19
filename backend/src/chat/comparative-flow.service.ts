import { Injectable, Logger } from '@nestjs/common';
import { RutasService } from '../transport/rutas/rutas.service';
import { ColectivosService } from '../transport/colectivos/colectivos.service';
import { TaxisService } from '../transport/taxis/taxis.service';
import { FormatterService } from '../formatter/formatter.service';
import { TelegramFormatterService } from '../formatter/telegram-formatter.service';

export interface UserSessionState {
  destination?: string;
  lastComparativeTimestamp: number;
}

@Injectable()
export class ComparativeFlowService {
  private readonly logger = new Logger(ComparativeFlowService.name);
  private readonly userSessions = new Map<string, UserSessionState>();
  private readonly SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutos

  constructor(
    private readonly rutasService: RutasService,
    private readonly colectivosService: ColectivosService,
    private readonly taxisService: TaxisService,
    private readonly formatterService: FormatterService,
    private readonly telegramFormatter: TelegramFormatterService,
  ) {}

  public setSessionDestination(userId: string, destination: string): void {
    this.userSessions.set(userId, {
      destination,
      lastComparativeTimestamp: Date.now(),
    });
  }

  public getSessionDestination(userId: string): string | null {
    const session = this.userSessions.get(userId);
    if (!session) return null;
    if (Date.now() - session.lastComparativeTimestamp > this.SESSION_TTL_MS) {
      this.userSessions.delete(userId);
      return null;
    }
    return session.destination || null;
  }

  public clearSession(userId: string): void {
    this.userSessions.delete(userId);
  }

  /**
   * Tarea 2 (HU #2): Genera la respuesta comparativa general de 3 opciones (versus)
   */
  async generateComparativeSummary(userId: string, destination: string) {
    this.setSessionDestination(userId, destination);

    const [micros, colectivos, taxis] = await Promise.all([
      this.rutasService.getRoutesForDestination(destination),
      this.colectivosService.getColectivos(destination),
      this.taxisService.getCentralesRadioTaxi(),
    ]);

    const lineasMicros = micros.length > 0
      ? micros.map((m) => m.linea).slice(0, 3).join(', ')
      : 'C02, 108, 111';
    const lineasColectivos = colectivos.length > 0
      ? colectivos.map((c) => c.numeroLinea).slice(0, 3).join(', ')
      : 'Línea 1, Línea 2, Línea 3';
    const centralesTaxis = taxis.length > 0
      ? taxis.map((t) => t.nombre).slice(0, 2).join(', ')
      : 'Taxiexpress Quilpué, Transporte 24 Horas';

    const comparativeData = {
      microbus: {
        lineas: lineasMicros,
        tarifaGeneral: '$450',
        tarifaAdultoMayor: '$150 (Pase adulto mayor)',
        frecuencia: 'Cada 10-15 min',
      },
      colectivo: {
        lineas: lineasColectivos,
        tarifaGeneral: '$850',
        tarifaAdultoMayor: '$600 (Rebaja adulto mayor)',
        frecuencia: 'Cada 4-6 min',
      },
      radiotaxi: {
        centrales: centralesTaxis,
        tarifaBase: '$2.500 - $3.200',
        tiempoEspera: 'Inmediato a domicilio',
      },
    };

    const webResponse = this.formatterService.formatComparativeResponse(destination, comparativeData);
    const telegramResponse = this.telegramFormatter.formatComparativeResponse(destination, comparativeData);

    return {
      destination,
      comparativeData,
      webResponse,
      telegramResponse,
    };
  }

  /**
   * Tarea 2 y 5 (HU #2): Procesa la selección del usuario (1. Micro, 2. Colectivo, 3. Taxi)
   * y entrega el desglose con líneas, paradas y costos en <= 1.5s.
   */
  async processSelection(userId: string, rawInput: string) {
    let destination = this.getSessionDestination(userId);
    if (!destination && /sel_(?:micro|col|taxi)_(.+)/i.test(rawInput)) {
      const match = rawInput.match(/sel_(?:micro|col|taxi)_(.+)/i);
      if (match && match[1]) {
        destination = match[1];
      }
    }
    destination = destination || 'tu destino';
    const clean = rawInput.toLowerCase().trim();

    // Detección de selección
    const isMicro = clean === '1' || /micro|bus|autobus|sel_micro/i.test(clean);
    const isColectivo = clean === '2' || /colectivo|sel_col/i.test(clean);
    const isTaxi = clean === '3' || /taxi|radiotaxi|sel_taxi/i.test(clean);

    if (isMicro) {
      const routes = await this.rutasService.getRoutesForDestination(destination);
      const web = this.formatterService.formatRouteResponse(destination, routes);
      const telegram = this.telegramFormatter.formatRouteResponse(
        destination,
        routes.map((r) => ({
          linea: r.linea,
          recorrido: r.recorrido,
          tipo: r.tipo,
          tarifaAdultoMayor: '$150 (Con pase adulto mayor)',
          tarifaGeneral: '$450',
          frecuencia: 'Cada 10-15 min',
        })),
      );

      return {
        selectedType: 'microbus',
        destination,
        web,
        telegram,
      };
    }

    if (isColectivo) {
      const colectivos = await this.colectivosService.getColectivos(destination);
      const telegram = this.telegramFormatter.formatColectivosResponse(destination, colectivos);

      let webText = `🚕 *Líneas de Colectivos hacia ${destination}:*\n\n`;
      colectivos.slice(0, 3).forEach((col, idx) => {
        webText += `*${idx + 1}. ${col.numeroLinea}*\n`;
        webText += `Pasa por: ${col.trazadoIda}\n`;
        webText += `Tarifa Adulto Mayor: *$${col.tarifaAdultoMayor}* (General: $${col.tarifaDiurna})\n\n`;
      });
      const encodedDest = encodeURIComponent(`${destination} Quilpue`);
      webText += `🗺️ Ver paradas en mapa:\nhttps://maps.google.com/?q=${encodedDest}`;

      return {
        selectedType: 'colectivo',
        destination,
        web: { text: webText, options: colectivos },
        telegram,
      };
    }

    if (isTaxi) {
      const taxis = await this.taxisService.getCentralesRadioTaxi();
      const telegram = this.telegramFormatter.formatRadioTaxisResponse(taxis);
      return {
        selectedType: 'radiotaxi',
        destination,
        web: {
          text: `Aquí tiene las centrales de Radio Taxi autorizadas para llamar a ${destination}:`,
          showRadioTaxis: true,
          taxis,
        },
        telegram,
      };
    }

    return null;
  }
}
