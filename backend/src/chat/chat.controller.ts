import { Controller, Post, Body } from '@nestjs/common';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { HorariosService } from '../transport/horarios/horarios.service';
import { TaxisService } from '../transport/taxis/taxis.service';
import { FormatterService } from '../formatter/formatter.service';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly rutasService: RutasService,
    private readonly horariosService: HorariosService,
    private readonly taxisService: TaxisService,
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
      const routes = await this.rutasService.getRoutesForDestination(destination);
      return this.formatterService.formatRouteResponse(destination, routes);
    }

    return this.formatterService.formatRouteResponse('', []);
  }
}
