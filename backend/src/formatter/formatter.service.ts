import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatterService {
  formatRouteResponse(destination: string, routes: any[]) {
    if (!destination || !routes || routes.length === 0) {
      return {
        text: 'Disculpa, no alcancé a entender bien a qué lugar quieres ir. ¿Me podrías indicar si vas al Hospital Santo Tomás, a la Estación Limache, al Centro o a la Plaza de las 40 Horas?',
        options: []
      };
    }

    // El usuario pidió "al menos 2", mostraremos todas las que coincidan (hasta 4 para no saturar)
    const topRoutes = routes.slice(0, 4);
    
    let text = `Aquí tienes opciones para llegar a ${destination}:\n\n`;
    
    topRoutes.forEach(route => {
      text += `🚌 *${route.linea} (Microbús Agdabus)*\n`;
      text += `Pasa por: ${route.recorrido}.\n\n`;
    });

    // Enlace de Google Maps
    const mapsDest = encodeURIComponent(destination + " Limache");
    text += `🗺️ Puedes ver la ruta en el mapa aquí:\nhttps://www.google.com/maps/dir/?api=1&destination=${mapsDest}&travelmode=transit`;

    return {
      text: text,
      options: topRoutes
    };
  }
}
