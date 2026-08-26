import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatterService {
  formatRouteResponse(destination: string, routes: string[]) {
    if (!destination || routes.length === 0) {
      return {
        text: 'Lo siento, no he podido reconocer tu destino o no hay rutas registradas. Por favor, intenta decir "micro al hospital" o "cómo llego a la plaza".',
        options: []
      };
    }

    return {
      text: `Aquí tienes algunas opciones para llegar a ${destination}:`,
      options: routes
    };
  }
}
