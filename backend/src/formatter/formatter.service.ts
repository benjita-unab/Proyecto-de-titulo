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

    // Enlace de Google Maps universal (evita error 404)
    const mapsDest = encodeURIComponent(destination + " Quilpue");
    text += `🗺️ Puedes ver la ruta en el mapa aquí:\nhttps://maps.google.com/?q=${mapsDest}`;

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
      centrales: 'Taxiexpress Quilpué, Transporte 24 Horas',
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

  /**
   * Tarea 1 (HU #3): Tarjeta visual enriquecida para parada más cercana
   * Despliega la parada cercana, distancia exacta en metros y enlace a mapa nativo.
   */
  formatNearbyStopResponse(paradaResult: any, destination?: string) {
    const p = paradaResult.parada;
    const destText = destination ? ` hacia ${destination}` : '';
    const advertenciaRadio = paradaResult.radioAmpliado
      ? `\nℹ️ *Nota:* No encontramos paradas a menos de 500m. Te sugerimos el punto más accesible a ${paradaResult.distanciaMetros} metros.`
      : '';

    let text = `📍 *Parada más cercana${destText}:*\n\n`;
    text += `🚏 *${p.nombre}*\n`;
    text += `🚶‍♂️ *Distancia:* A ${paradaResult.distanciaMetros} metros de tu ubicación\n`;
    text += `🏠 *Dirección:* ${p.direccion}\n`;
    text += `🚌 *Líneas disponibles:* ${p.lineasAsociadas || 'Microbuses y Colectivos'}\n`;
    text += advertenciaRadio + '\n\n';
    text += `🗺️ *Cómo llegar caminando (Google Maps):*\n${paradaResult.googleMapsDirectionsUrl}`;

    return {
      text,
      parada: p,
      distanciaMetros: paradaResult.distanciaMetros,
      googleMapsUrl: paradaResult.googleMapsUrl,
      googleMapsDirectionsUrl: paradaResult.googleMapsDirectionsUrl,
    };
  }

  /**
   * Tarea 7 (HU #3): Recomendar punto de espera seguro más cercano para Radio Taxi
   */
  formatRadioTaxiWithSafePoint(safePointResult: any, taxis: any[]) {
    const sp = safePointResult.parada;
    let text = `🚖 *Punto seguro de espera recomendado para tu Radio Taxi:*\n\n`;
    text += `🛡️ *${sp.nombre}*\n`;
    text += `📍 *Ubicación:* ${sp.direccion} (a ${safePointResult.distanciaMetros}m de ti)\n`;
    text += `🗺️ *Ver en mapa:* ${safePointResult.googleMapsUrl}\n\n`;
    text += `📞 *Centrales autorizadas listas para llamar:*\n`;

    taxis.slice(0, 3).forEach((t, i) => {
      text += `${i + 1}. *${t.nombre}* - Tel: ${t.telefonoFormateado} (${t.tarifaBaseEstimada})\n`;
    });

    return {
      text,
      safePoint: sp,
      taxis,
      directionsUrl: safePointResult.googleMapsDirectionsUrl,
    };
  }
}
