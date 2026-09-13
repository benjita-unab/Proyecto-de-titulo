import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatterService {
  formatRouteResponse(destination: string, routes: any[]) {
    if (!destination || !routes || routes.length === 0) {
      return {
        text: 'Disculpa, no alcancé a entender bien a qué lugar quieres ir. ¿Me podrías indicar si vas al Hospital de Quilpué, a la Estación Metro Quilpué, Estación Villa Alemana, a la Feria El Belloto o a Los Pinos?',
        options: []
      };
    }

    // El usuario pidió "al menos 2", mostraremos todas las que coincidan (hasta 4 para no saturar)
    const topRoutes = routes.slice(0, 4);
    
    let text = `Aquí tienes opciones para llegar a ${destination}:\n\n`;
    
    topRoutes.forEach(route => {
      text += `🚌 *${route.linea}*\n`;
      text += `Pasa por: ${route.recorrido}.\n\n`;
    });

    // Enlace de Google Maps
    const mapsDest = encodeURIComponent(destination + " Quilpue");
    text += `🗺️ Puedes ver la ruta en el mapa aquí:\nhttps://www.google.com/maps/dir/?api=1&destination=${mapsDest}&travelmode=transit`;

    return {
      text: text,
      options: topRoutes
    };
  }

  formatHorarioResponse(statusResult: any) {
    const lineaTitulo = statusResult.linea ? ` - ${statusResult.linea}` : '';
    let text = `🕐 *Horarios de Operación${lineaTitulo}*\n\n`;

    if (statusResult.isOutOfService) {
      text += `⚠️ *Estado:* ${statusResult.badgeText}\n${statusResult.detail}\n\n`;
    } else {
      text += `🟢 *Estado:* ${statusResult.badgeText}\n${statusResult.detail}\n\n`;
    }

    text += `*Itinerario oficial de salidas:*\n`;
    if (statusResult.horarios && Array.isArray(statusResult.horarios)) {
      statusResult.horarios.forEach((f: any) => {
        text += `• *${f.dias}:* ${f.inicio} hrs a ${f.termino} hrs\n`;
      });
    }

    const nombreLinea = statusResult.linea || 'Transporte Metropolitano de Valparaíso (TMV)';
    const nombreEmpresa = statusResult.empresa || 'Transporte Público Marga Marga';

    return {
      text,
      showHorarios: true,
      horarios: {
        linea: nombreLinea,
        empresa: nombreEmpresa,
        franjas: statusResult.horarios,
        ...statusResult,
      },
    };
  }
}
