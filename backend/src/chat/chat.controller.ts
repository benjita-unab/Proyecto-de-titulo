import { Controller, Post, Body, Optional, BadRequestException } from '@nestjs/common';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { HorariosService } from '../transport/horarios/horarios.service';
import { TaxisService } from '../transport/taxis/taxis.service';
import { FormatterService } from '../formatter/formatter.service';
import { ComparativeFlowService } from './comparative-flow.service';
import { HaversineService } from '../transport/geo/haversine.service';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly rutasService: RutasService,
    private readonly horariosService: HorariosService,
    private readonly taxisService: TaxisService,
    private readonly formatterService: FormatterService,
    @Optional() private readonly comparativeFlowService?: ComparativeFlowService,
    @Optional() private readonly haversineService?: HaversineService,
  ) {}

  @Post()
  async handleChat(
    @Body('text') text: string,
    @Body('clientTime') clientTime?: string,
    @Body('userId') userId?: string,
    @Body('comparative') comparative?: boolean,
  ) {
    if (!text) {
      return { text: 'No he recibido ningún texto.' };
    }

    const currentUserId = userId || 'default_user';

    // HU #2: Verificar si el usuario está enviando una selección interactiva (1, 2, 3 o nombres)
    if (this.comparativeFlowService && /^(1|2|3|micro|colectivo|taxi|opt_)/i.test(text.trim())) {
      const selection = await this.comparativeFlowService.processSelection(currentUserId, text);
      if (selection) {
        return selection.web;
      }
    }

    const queryResult = this.nlpService.processQuery(text);
    const { intent, destination } = queryResult;

    if (intent === 'Saludo') {
      return {
        text: '¡Hola! Te damos la bienvenida a MoviTech. Soy tu asistente de movilidad para acompañarte en tus viajes en Quilpué y Villa Alemana. ¿En qué te puedo ayudar hoy? Puedes preguntarme cómo llegar a algún lugar (ej: Hospital de Quilpué o Feria El Belloto), consultar horarios de microbuses o pedir el contacto de radiotaxis.',
      };
    }

    if (intent === 'Consultar RadioTaxi') {
      const comuna = (queryResult as any).comuna;
      const taxis = await this.taxisService.getCentralesRadioTaxi(comuna);
      const textoComuna = comuna ? ` en ${comuna}` : ' en Quilpué y Villa Alemana';
      return {
        text: `Aquí tiene las centrales de Radio Taxi autorizadas${textoComuna} para llamar con un solo toque:`,
        showRadioTaxis: true,
        taxis,
      };
    }

    if (intent === 'Consultar Horario') {
      const lineaBuscada = (queryResult as any).linea;
      const dbHorarios = await this.horariosService.getHorariosPorLinea(lineaBuscada);
      const statusResult = this.horariosService.checkHorarioStatus(
        clientTime,
        dbHorarios.franjas,
        { linea: dbHorarios.nombreLinea, empresa: dbHorarios.empresa },
      );
      return this.formatterService.formatHorarioResponse(statusResult);
    }

    if (intent === 'Buscar Ruta' && destination) {
      // Si se solicita explícitamente modo comparativo de 3 modalidades
      if (comparative && this.comparativeFlowService) {
        const comparativeResult = await this.comparativeFlowService.generateComparativeSummary(
          currentUserId,
          destination,
        );
        return comparativeResult.webResponse;
      }

      const routes = await this.rutasService.getRoutesForDestination(destination);
      return this.formatterService.formatRouteResponse(destination, routes);
    }

    return this.formatterService.formatRouteResponse('', []);
  }

  /**
   * Endpoint directo para solicitar comparativo visual de 3 modalidades (HU #2 Tarea 2)
   */
  @Post('comparative')
  async getComparative(
    @Body('destination') destination: string,
    @Body('userId') userId?: string,
  ) {
    if (!destination || !this.comparativeFlowService) {
      return { text: 'Por favor indica un destino para comparar transportes.' };
    }
    const currentUserId = userId || 'default_user';
    return this.comparativeFlowService.generateComparativeSummary(currentUserId, destination);
  }

  /**
   * Tarea 6 (HU #3): Endpoint seguro para recibir, parsear y validar eventos de ubicación GPS
   * Retorna la parada o punto seguro más cercano en <= 1.5s (CA de HU #3).
   */
  @Post('location')
  async handleLocation(
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
    @Body('destination') destination?: string,
    @Body('forTaxi') forTaxi?: boolean,
  ) {
    if (!this.haversineService) {
      return { text: 'Servicio geoespacial no disponible temporalmente.' };
    }

    if (!this.haversineService.validateCoordinates(latitude, longitude)) {
      throw new BadRequestException('Coordenadas geográficas inválidas o fuera de rango permitido.');
    }

    if (forTaxi) {
      const safePoint = await this.haversineService.findClosestStop(latitude, longitude, {
        soloPuntosSeguros: true,
      });
      const taxis = await this.taxisService.getCentralesRadioTaxi();
      if (!safePoint) {
        return { text: 'No pudimos localizar un punto seguro en las inmediaciones.' };
      }
      return this.formatterService.formatRadioTaxiWithSafePoint(safePoint, taxis);
    }

    const stopResult = await this.haversineService.findClosestStop(latitude, longitude, {
      radioInicialMetros: 500,
    });

    if (!stopResult) {
      return { text: 'No encontramos paradas cercanas a tu ubicación actual.' };
    }

    return this.formatterService.formatNearbyStopResponse(stopResult, destination);
  }
}
