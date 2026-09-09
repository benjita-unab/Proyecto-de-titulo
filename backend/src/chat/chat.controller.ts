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

    const { intent, destination } = this.nlpService.processQuery(text);

    if (intent === 'Consultar Horario') {
      const statusResult = this.horariosService.checkHorarioStatus(clientTime);
      return this.formatterService.formatHorarioResponse(statusResult);
    }

    if (intent === 'Buscar Ruta' && destination) {
      const routes = await this.rutasService.getRoutesForDestination(destination);
      return this.formatterService.formatRouteResponse(destination, routes);
    }

    return this.formatterService.formatRouteResponse('', []);
  }
}
