import { Controller, Post, Body } from '@nestjs/common';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { HorariosService } from '../transport/horarios/horarios.service';
import { FormatterService } from '../formatter/formatter.service';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly rutasService: RutasService,
    private readonly horariosService: HorariosService,
    private readonly formatterService: FormatterService,
  ) {}

  @Post()
  async handleChat(
    @Body('text') text: string,
    @Body('clientTime') clientTime?: string,
  ) {
    if (!text) {
      return { text: 'No he recibido ningún texto.' };
    }

    const queryResult = this.nlpService.processQuery(text);
    const { intent, destination } = queryResult;

    if (intent === 'Consultar RadioTaxi') {
      return {
        text: 'Aquí tiene las centrales de Radio Taxi autorizadas en Limache para llamar con un solo toque:',
        showRadioTaxis: true,
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
      const routes = await this.rutasService.getRoutesForDestination(destination);
      return this.formatterService.formatRouteResponse(destination, routes);
    }

    return this.formatterService.formatRouteResponse('', []);
  }
}
