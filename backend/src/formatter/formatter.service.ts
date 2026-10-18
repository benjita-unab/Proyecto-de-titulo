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

  /**
   * Tarea 4 (HU #5) y Tarea 1 (HU #2): Estructura visual del comparativo de las 3 modalidades
   * Bloques cortos (máx 3 líneas), negritas semánticas, emojis y 3 opciones interactivas.
   */
  formatComparativeResponse(
    destination: string,
    data: {
      microbus?: { lineas: string; tarifaGeneral: string; tarifaAdultoMayor: string; frecuencia: string };
      colectivo?: { lineas: string; tarifaGeneral: string; tarifaAdultoMayor: string; frecuencia: string };
      radiotaxi?: { centrales: string; tarifaBase: string; tiempoEspera: string };
    },
  ) {
    let text = `🧭 *Opciones de transporte para llegar a ${destination}:*\n\n`;

    // Bloque 1: Microbuses
    const mb = data.microbus || {
      lineas: 'Líneas C02, 108, 111, Q02',
      tarifaGeneral: '$350 - $450',
      tarifaAdultoMayor: '$150',
      frecuencia: 'Cada 10-15 min',
    };
    text += `🚌 *1. Microbús (${mb.lineas})*\n`;
    text += `💰 Adulto mayor: *${mb.tarifaAdultoMayor}* | General: ${mb.tarifaGeneral}\n`;
    text += `⏱️ Frecuencia: ${mb.frecuencia} | Rampa de acceso\n\n`;

    // Bloque 2: Colectivos (Tercera modalidad - HU #5)
    const col = data.colectivo || {
      lineas: 'Líneas 1, 2, 3, 4',
      tarifaGeneral: '$850',
      tarifaAdultoMayor: '$600',
      frecuencia: 'Cada 4-6 min',
    };
    text += `🚕 *2. Colectivo (${col.lineas})*\n`;
    text += `💰 Adulto mayor: *${col.tarifaAdultoMayor}* | General: ${col.tarifaGeneral}\n`;
    text += `⏱️ Frecuencia: ${col.frecuencia} | Parada a solicitud\n\n`;

    // Bloque 3: Radiotaxis
    const tx = data.radiotaxi || {
      centrales: 'Taxiexpress, Aracis Vía, C&B',
      tarifaBase: '$2.500 - $3.200',
      tiempoEspera: 'Inmediato / Domicilio',
    };
    text += `🚖 *3. Radio Taxi Directo (${tx.centrales})*\n`;
    text += `💰 Tarifa estimada: *${tx.tarifaBase}*\n`;
    text += `📞 Servicio puerta a puerta | 24 Horas\n\n`;

    text += `👇 *¿Cuál medio prefieres usar hoy?*\n`;
    text += `Responde *1* para Micro, *2* para Colectivo o *3* para Radio Taxi.`;

    return {
      text,
      destination,
      options: [
        { id: 'opt_micro', label: '1. Microbús 🚌', tipo: 'microbus' },
        { id: 'opt_colectivo', label: '2. Colectivo 🚕', tipo: 'colectivo' },
        { id: 'opt_taxi', label: '3. Radio Taxi 🚖', tipo: 'radiotaxi' },
      ],
    };
  }
}
