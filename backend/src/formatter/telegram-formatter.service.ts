import { Injectable } from '@nestjs/common';
import { RadioTaxiDto } from '../transport/taxis/taxis.service';

export interface TelegramRouteDetail {
  linea: string;
  recorrido: string;
  tipo?: string;
  horario?: string;
  frecuencia?: string;
  tarifaAdultoMayor?: string;
  tarifaGeneral?: string;
}

export interface TelegramFormattedResponse {
  text: string;
  parse_mode: 'HTML' | 'Markdown';
}

@Injectable()
export class TelegramFormatterService {
  /**
   * Escapa caracteres especiales para el modo HTML de Telegram.
   * Evita errores de parseo por etiquetas accidentales o caracteres reservados.
   */
  public escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Plantilla 1: Rutas de Transporte Público (Microbuses de Limache)
   * Diseñada con alta legibilidad para adultos mayores:
   * - Emojis institucionales: 🚌, 📍, ⏱️, 💰, 🗺️
   * - Negritas semánticas
   * - Soporte tanto para parse_mode 'HTML' como 'Markdown'
   */
  public formatRouteResponse(
    destination: string,
    routes: TelegramRouteDetail[],
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): TelegramFormattedResponse {
    if (parseMode === 'Markdown') {
      return this.formatRouteResponseMarkdown(destination, routes);
    }

    if (!destination || !routes || routes.length === 0) {
      const fallbackText =
        `🚌 <b>MoviTech - Consulta de Recorridos</b>\n\n` +
        `Disculpa, no encontré recorridos directos para el destino solicitado.\n\n` +
        `📍 <b>Destinos frecuentes sugeridos:</b>\n` +
        `• Hospital de Quilpué\n` +
        `• Estación Metro Quilpué\n` +
        `• Estación Metro Villa Alemana\n` +
        `• Feria El Belloto / Belloto Norte\n` +
        `• Los Pinos / Peumo\n\n` +
        `<i>Escribe el nombre de tu destino para buscar la mejor alternativa.</i>`;

      return {
        text: fallbackText,
        parse_mode: 'HTML',
      };
    }

    const cleanDest = this.escapeHtml(destination);
    const topRoutes = routes.slice(0, 4);

    let message = `🚌 <b>OPCIONES DE TRANSPORTE A: ${cleanDest.toUpperCase()}</b>\n`;
    message += `───────────────────────\n\n`;

    topRoutes.forEach((route, index) => {
      const lineaSafe = this.escapeHtml(route.linea);
      const recorridoSafe = this.escapeHtml(route.recorrido);
      const tipoSafe = this.escapeHtml(route.tipo || 'Microbús');
      const horarioSafe = this.escapeHtml(route.horario || '06:00 - 22:00 hrs');
      const frecuenciaSafe = this.escapeHtml(route.frecuencia || 'Cada 10-15 min');
      const tarifaAdulto = this.escapeHtml(route.tarifaAdultoMayor || '$150 (Con pase adulto mayor)');
      const tarifaGral = this.escapeHtml(route.tarifaGeneral || '$350 - $450');

      message += `<b>Opción ${index + 1}:</b> 🚌 <b>${lineaSafe}</b> (${tipoSafe})\n`;
      message += `📍 <b>Pasa por:</b> ${recorridoSafe}\n`;
      message += `⏱️ <b>Horario y frecuencia:</b> ${horarioSafe} | ${frecuenciaSafe}\n`;
      message += `💰 <b>Tarifa Adulto Mayor:</b> ${tarifaAdulto} | General: ${tarifaGral}\n\n`;
    });

    // Enlaces de asistencia en mapa: Parada más cercana y Destino final
    const encodedDest = encodeURIComponent(`${destination} Quilpue`);
    message += `🚏 <b>Parada recomendada para abordar:</b> Plaza Manuel Blanco Encalada (Centro Quilpué)\n`;
    message += `🚶‍♂️ <b>Caminata estimada:</b> A 85 metros a pie\n`;
    message += `🗺️ <a href="https://maps.google.com/maps?saddr=-33.0480,-71.4425&amp;daddr=-33.0483,-71.4431&amp;dirflg=w">Ver cómo caminar a la parada más cercana</a>\n\n`;
    message += `📍 <a href="https://maps.google.com/?q=${encodedDest}">Ver destino final en Google Maps</a>\n\n`;
    message += `💡 <i>Tip MoviTech: Recuerda tener a mano tu pase de adulto mayor para acceder a la tarifa rebajada.</i>`;

    return {
      text: message,
      parse_mode: 'HTML',
    };
  }

  /**
   * Versión en formato Markdown de Rutas de Transporte Público
   */
  public formatRouteResponseMarkdown(
    destination: string,
    routes: TelegramRouteDetail[],
  ): TelegramFormattedResponse {
    if (!destination || !routes || routes.length === 0) {
      const fallbackText =
        `🚌 *MoviTech - Consulta de Recorridos*\n\n` +
        `Disculpa, no encontré recorridos directos para el destino solicitado.\n\n` +
        `📍 *Destinos frecuentes sugeridos:*\n` +
        `• Hospital de Quilpué\n` +
        `• Estación Metro Quilpué\n` +
        `• Estación Metro Villa Alemana\n` +
        `• Feria El Belloto / Belloto Norte\n` +
        `• Los Pinos / Peumo\n\n` +
        `_Escribe el nombre de tu destino para buscar la mejor alternativa._`;

      return {
        text: fallbackText,
        parse_mode: 'Markdown',
      };
    }

    const topRoutes = routes.slice(0, 4);
    let message = `🚌 *OPCIONES DE TRANSPORTE A: ${destination.toUpperCase()}*\n`;
    message += `───────────────────────\n\n`;

    topRoutes.forEach((route, index) => {
      const lineaSafe = route.linea;
      const recorridoSafe = route.recorrido;
      const tipoSafe = route.tipo || 'Microbús';
      const horarioSafe = route.horario || '06:00 - 22:00 hrs';
      const frecuenciaSafe = route.frecuencia || 'Cada 10-15 min';
      const tarifaAdulto = route.tarifaAdultoMayor || '$150 (Con pase adulto mayor)';
      const tarifaGral = route.tarifaGeneral || '$350 - $450';

      message += `*Opción ${index + 1}:* 🚌 *${lineaSafe}* (${tipoSafe})\n`;
      message += `📍 *Pasa por:* ${recorridoSafe}\n`;
      message += `⏱️ *Horario y frecuencia:* ${horarioSafe} | ${frecuenciaSafe}\n`;
      message += `💰 *Tarifa Adulto Mayor:* ${tarifaAdulto} | General: ${tarifaGral}\n\n`;
    });

    const encodedDest = encodeURIComponent(`${destination} Quilpue`);
    message += `🗺️ [Ver ruta completa en Google Maps](https://maps.google.com/?q=${encodedDest})\n\n`;
    message += `💡 _Tip MoviTech: Recuerda tener a mano tu pase de adulto mayor para acceder a la tarifa rebajada._`;

    return {
      text: message,
      parse_mode: 'Markdown',
    };
  }

  /**
   * Plantilla 2: Directorio de Radio Taxis Autorizados
   * Diseñada con botones telefónicos directos y tarifas transparentes.
   * Filtra y adapta título según la comuna solicitada (Quilpué, Villa Alemana o ambas).
   */
  public formatRadioTaxisResponse(
    taxis: RadioTaxiDto[],
    comuna?: string,
  ): TelegramFormattedResponse {
    const tituloComuna = comuna ? comuna.toUpperCase() : 'QUILPUÉ';

    if (!taxis || taxis.length === 0) {
      return {
        text:
          `🚕 <b>MoviTech - Radio Taxis (${tituloComuna})</b>\n\n` +
          `No hay centrales con contacto y autorización verificados disponibles en este momento.\n` +
          `Por seguridad, no mostraremos números sin confirmar.`,
        parse_mode: 'HTML',
      };
    }

    let message = `🚕 <b>DIRECTORIO OFICIAL DE RADIO TAXIS - ${tituloComuna}</b>\n`;
    message += `🛡️ <i>Bases autorizadas y recomendadas para traslados seguros</i>\n`;
    message += `───────────────────────\n\n`;

    taxis.forEach((taxi, idx) => {
      const nombreSafe = this.escapeHtml(taxi.nombre);
      const baseSafe = this.escapeHtml(taxi.direccionBase);
      const telFormatSafe = this.escapeHtml(taxi.telefonoFormateado);
      const tarifaSafe = this.escapeHtml(taxi.tarifaBaseEstimada);
      const horarioSafe = this.escapeHtml(taxi.horarioAtencion);
      const telClean = taxi.telefono.replace(/[^\d+]/g, '');

      message += `<b>${idx + 1}. ${nombreSafe}</b>\n`;
      message += `   📍 <b>Base:</b> ${baseSafe}\n`;
      message += `   📞 <b>Llamar:</b> ${telClean}\n`;
      message += `   📲 <b>Llamada directa:</b> <a href="tel:${telClean}">${telFormatSafe}</a> (<code>${telFormatSafe}</code>)\n`;
      message += `   ⏱️ <b>Atención:</b> ${horarioSafe}\n`;
      message += `   💰 <b>Tarifa estimada:</b> ${tarifaSafe}\n\n`;
    });

    message += `📌 <i>Toca directamente el número <b>+56...</b> para llamar desde tu celular, o el código para copiarlo.</i>`;

    return {
      text: message,
      parse_mode: 'HTML',
    };
  }

  /**
   * Plantilla auxiliar: Saludo y Bienvenida amigable para adultos mayores
   */
  public formatWelcomeMessage(userName?: string): TelegramFormattedResponse {
    const nombre = userName ? ` <b>${this.escapeHtml(userName)}</b>` : '';
    const text =
      `👋 ¡Hola${nombre}! Te damos la bienvenida a <b>MoviTech</b>.\n\n` +
      `Tu asistente de movilidad diseñado especialmente para acompañarte y facilitarte tus viajes en Quilpué.\n\n` +
      `¿En qué te puedo ayudar hoy?\n` +
      `Toca uno de los destinos o comparte tu ubicación con el botón de abajo.`;

    return {
      text,
      parse_mode: 'HTML',
    };
  }

  /**
   * Plantilla 3: Horarios de Operación y Salidas de una Línea específica
   */
  public formatHorarioResponse(statusResult: any, comuna?: string): TelegramFormattedResponse {
    const headerLinea = statusResult.linea
      ? ` - ${statusResult.linea.toUpperCase()}`
      : comuna
      ? ` - ${comuna.toUpperCase()}`
      : ' - QUILPUÉ Y VILLA ALEMANA';

    let message = `⏱️ <b>HORARIOS DE OPERACIÓN${headerLinea}</b>\n`;
    message += `───────────────────────\n\n`;

    if (statusResult.isOutOfService) {
      message += `⚠️ <b>Estado:</b> ${this.escapeHtml(statusResult.badgeText || 'FUERA DE SERVICIO')}\n`;
      if (statusResult.detail) {
        message += `${this.escapeHtml(statusResult.detail)}\n\n`;
      }
    } else {
      message += `🟢 <b>Estado:</b> ${this.escapeHtml(statusResult.badgeText || 'EN SERVICIO')}\n`;
      if (statusResult.detail) {
        message += `${this.escapeHtml(statusResult.detail)}\n\n`;
      }
    }

    message += `📋 <b>Itinerario oficial de salidas:</b>\n`;
    if (statusResult.horarios && Array.isArray(statusResult.horarios)) {
      statusResult.horarios.forEach((f: any) => {
        message += `• <b>${this.escapeHtml(f.dias)}:</b> ${this.escapeHtml(f.inicio)} hrs a ${this.escapeHtml(f.termino)} hrs\n`;
      });
    }

    const nombreLinea = statusResult.linea || 'Transporte Metropolitano de Valparaíso (TMV)';
    message += `\n🚌 <i>Servicio: ${this.escapeHtml(nombreLinea)}</i>`;

    return {
      text: message,
      parse_mode: 'HTML',
    };
  }

  /**
   * Plantilla 4: Resumen de Horarios Generales por Comuna (todas las líneas)
   */
  public formatHorariosGeneralesResponse(
    lineas: Array<{ linea: string; recorrido: string; horarios: string; comuna: string }>,
    comuna?: string,
  ): TelegramFormattedResponse {
    const titulo = comuna ? comuna.toUpperCase() : 'QUILPUÉ Y VILLA ALEMANA';
    let message = `⏱️ <b>HORARIOS GENERALES DE LÍNEAS - ${titulo}</b>\n`;
    message += `───────────────────────\n\n`;

    lineas.forEach((item, idx) => {
      message += `<b>${idx + 1}. 🚌 ${this.escapeHtml(item.linea)}</b> (${this.escapeHtml(item.comuna)})\n`;
      message += `   📍 <b>Recorrido:</b> ${this.escapeHtml(item.recorrido)}\n`;
      message += `   ⏱️ <b>Horario habitual:</b> ${this.escapeHtml(item.horarios)}\n\n`;
    });

    message += `💡 <i>Escribe el número de una micro (ej: "Horario Línea 111") para consultar si está en servicio en este momento.</i>`;

    return {
      text: message,
      parse_mode: 'HTML',
    };
  }

  /**
   * Tarea 4 (HU #5) y Tarea 1 (HU #2): Formato comparativo de 3 modalidades para Telegram
   * Respeta límites para adultos mayores: bloques de máx 3 líneas, emojis, tarifas y teclado de botones.
   */
  public formatComparativeResponse(
    destination: string,
    data?: {
      microbus?: { lineas: string; tarifaGeneral: string; tarifaAdultoMayor: string; frecuencia: string };
      colectivo?: { lineas: string; tarifaGeneral: string; tarifaAdultoMayor: string; frecuencia: string };
      radiotaxi?: { centrales: string; tarifaBase: string; tiempoEspera: string };
    },
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): TelegramFormattedResponse & { reply_markup?: any } {
    const destClean = this.escapeHtml(destination);
    const mb = data?.microbus || {
      lineas: 'No verificado',
      tarifaGeneral: 'No verificada',
      tarifaAdultoMayor: 'No verificada',
      frecuencia: 'No verificada',
    };
    const col = data?.colectivo || {
      lineas: 'Sin datos verificados',
      tarifaGeneral: 'No verificada',
      tarifaAdultoMayor: 'No verificada',
      frecuencia: 'No verificada',
    };
    const tx = data?.radiotaxi || {
      centrales: 'Consultar directorio oficial',
      tarifaBase: 'Consultar con la central',
      tiempoEspera: 'No verificado',
    };

    let text = `🧭 <b>OPCIONES DE TRANSPORTE A: ${destClean.toUpperCase()}</b>\n`;
    text += `───────────────────────\n\n`;

    text += `🚌 <b>1. MICROBÚS (${this.escapeHtml(mb.lineas)})</b>\n`;
    text += `💰 Adulto Mayor: <b>${this.escapeHtml(mb.tarifaAdultoMayor)}</b> | Gral: ${this.escapeHtml(mb.tarifaGeneral)}\n`;
    text += `⏱️ Frecuencia: ${this.escapeHtml(mb.frecuencia)}\n\n`;

    text += `🚕 <b>2. COLECTIVO (${this.escapeHtml(col.lineas)})</b>\n`;
    text += `💰 General: <b>${this.escapeHtml(col.tarifaGeneral)}</b>\n`;
    text += `⏱️ Frecuencia: ${this.escapeHtml(col.frecuencia)}\n\n`;

    text += `🚖 <b>3. RADIO TAXI (${this.escapeHtml(tx.centrales)})</b>\n`;
    text += `💰 Tarifa estimada: <b>${this.escapeHtml(tx.tarifaBase)}</b>\n`;
    text += `📞 Contacta directamente a la central para confirmar disponibilidad.\n\n`;

    text += `👇 <b>Toca una opción para ver detalles. ¿Necesitas algo más?</b>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🚌 1. Ver Micros', callback_data: `sel_micro_${destination.substring(0, 20)}` },
          { text: '🚕 2. Ver Colectivos', callback_data: `sel_col_${destination.substring(0, 20)}` },
        ],
        [
          { text: '🚖 3. Ver Radio Taxis', callback_data: `sel_taxi_${destination.substring(0, 20)}` },
        ],
        [
          { text: '🔄 Otra consulta', callback_data: 'flow_restart' },
          { text: '✅ Finalizar', callback_data: 'flow_done' },
        ],
      ],
    };

    return {
      text,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    };
  }

  /**
   * Formatea la respuesta de detalle para la modalidad Colectivo (HU #5)
   */
  public formatColectivosResponse(
    destination: string,
    colectivos: any[],
  ): TelegramFormattedResponse {
    const destClean = this.escapeHtml(destination);
    if (!colectivos || colectivos.length === 0) {
      return {
        text:
          `🚕 <b>Colectivos hacia ${destClean.toUpperCase()}</b>\n\n` +
          `Aún no tenemos líneas de colectivos verificadas para este destino. ` +
          `No mostraremos recorridos, tarifas ni horarios sin una fuente comprobable.`,
        parse_mode: 'HTML',
      };
    }

    let text = `🚕 <b>LÍNEAS DE COLECTIVOS A: ${destClean.toUpperCase()}</b>\n`;
    text += `───────────────────────\n\n`;

    colectivos.slice(0, 3).forEach((col, idx) => {
      const nombre = this.escapeHtml(col.numeroLinea || col.nombreLinea);
      const recorrido = this.escapeHtml(col.trazadoIda || col.destino);
      const freq = col.frecuenciaMinutos ? `Cada ${col.frecuenciaMinutos} min` : 'No verificada';
      const tarifaGral = col.tarifaDiurna ? `$${col.tarifaDiurna}` : 'No verificada';

      text += `<b>${idx + 1}. 🚕 ${nombre}</b>\n`;
      text += `   📍 <b>Recorrido:</b> ${recorrido}\n`;
      text += `   ⏱️ <b>Frecuencia:</b> ${freq} (${this.escapeHtml(col.horarioInicio || 'horario no verificado')} a ${this.escapeHtml(col.horarioTermino || 'horario no verificado')})\n`;
      text += `   💰 <b>Tarifa General:</b> ${tarifaGral}\n`;
      if (col.fuenteUrl) {
        text += `   🔎 <a href="${this.escapeHtml(col.fuenteUrl)}">Fuente consultada</a>\n`;
      }
      text += '\n';
    });

    return {
      text,
      parse_mode: 'HTML',
    };
  }

  /**
   * Tarea 1 (HU #3): Tarjeta enriquecida para Telegram de parada más cercana
   */
  public formatNearbyStopResponse(
    paradaResult: any,
    destination?: string,
  ): TelegramFormattedResponse {
    const p = paradaResult.parada;
    const destSafe = destination ? ` hacia ${this.escapeHtml(destination)}` : '';
    const avisoAmpliado = paradaResult.radioAmpliado
      ? `\nℹ️ <i>Ampliamos la búsqueda a ${paradaResult.distanciaMetros}m para encontrar la opción más accesible.</i>\n`
      : '';

    let text = `📍 <b>PARADA MÁS CERCANA${destSafe.toUpperCase()}</b>\n`;
    text += `───────────────────────\n\n`;
    text += `🚏 <b>${this.escapeHtml(p.nombre)}</b>\n`;
    text += `🚶‍♂️ <b>Distancia:</b> A ${paradaResult.distanciaMetros} metros de tu ubicación\n`;
    text += `🏠 <b>Dirección:</b> ${this.escapeHtml(p.direccion)}\n`;
    text += `🚌 <b>Servicios que pasan por aquí:</b> ${this.escapeHtml(p.lineasAsociadas || 'Microbuses y Colectivos')}\n`;
    text += avisoAmpliado + '\n';
    text += `🗺️ <a href="${paradaResult.googleMapsDirectionsUrl}">Abrir ruta a pie en Google Maps</a>\n\n`;
    text += `💡 <i>Tip: Toca el enlace para abrir directamente tu app de mapas con la ruta caminable paso a paso.</i>`;

    return {
      text,
      parse_mode: 'HTML',
    };
  }

  /**
   * Tarea 7 (HU #3): Punto seguro de espera para Radiotaxis en Telegram
   */
  public formatRadioTaxiWithSafePoint(
    safePointResult: any,
    taxis: any[],
  ): TelegramFormattedResponse {
    const sp = safePointResult.parada;
    let text = `🚖 <b>PUNTO SEGURO DE ESPERA RECOMENDADO</b>\n`;
    text += `───────────────────────\n\n`;
    text += `🛡️ <b>${this.escapeHtml(sp.nombre)}</b>\n`;
    text += `📍 <b>Ubicación:</b> ${this.escapeHtml(sp.direccion)} (a ${safePointResult.distanciaMetros}m de ti)\n`;
    text += `🗺️ <a href="${safePointResult.googleMapsUrl}">Ver punto de encuentro en Google Maps</a>\n\n`;
    if (taxis.length === 0) {
      text += `Aún no tenemos centrales de radiotaxi con contacto y autorización verificados.\n`;
      return {
        text,
        parse_mode: 'HTML',
      };
    }

    text += `📞 <b>Centrales oficiales autorizadas para solicitar tu móvil:</b>\n`;

    taxis.slice(0, 3).forEach((t, i) => {
      const telClean = t.telefono.replace(/[^\d+]/g, '');
      text += `<b>${i + 1}. ${this.escapeHtml(t.nombre)}</b>\n`;
      text += `   📲 <a href="tel:${telClean}">${this.escapeHtml(t.telefonoFormateado)}</a> (Tarifa: ${this.escapeHtml(t.tarifaBaseEstimada)})\n`;
    });

    return {
      text,
      parse_mode: 'HTML',
    };
  }

  public formatNearbyStopsResponse(
    results: Array<{
      parada: { nombre: string; direccion: string; lineasAsociadas: string; fuenteUrl?: string | null };
      distanciaMetros: number;
      radioAmpliado: boolean;
      googleMapsDirectionsUrl: string;
    }>,
    destination: string,
  ): TelegramFormattedResponse {
    const destSafe = this.escapeHtml(destination);
    if (results.length === 0) {
      return {
        text:
          `📍 <b>Paraderos hacia ${destSafe}</b>\n\n` +
          `Aún no tenemos paraderos y recorridos verificados para este destino. ` +
          `No estimaremos una línea ni cambiaremos tu ubicación.`,
        parse_mode: 'HTML',
      };
    }

    let text = `📍 <b>PARADEROS HACIA ${destSafe.toUpperCase()}</b>\n\n`;
    results.slice(0, 3).forEach((result, index) => {
      const label = index === 0 ? '⭐ Más conveniente' : `Opción ${index + 1}`;
      text += `<b>${label}: ${this.escapeHtml(result.parada.lineasAsociadas)}</b>\n`;
      text += `🚏 ${this.escapeHtml(result.parada.nombre)}\n`;
      text += `📍 ${this.escapeHtml(result.parada.direccion)}\n`;
      text += `🚶 Distancia aproximada: ${result.distanciaMetros} m`;
      if (result.radioAmpliado) {
        text += ` (búsqueda ampliada a ${result.distanciaMetros} m)`;
      }
      text += `\n🗺️ <a href="${result.googleMapsDirectionsUrl}">Ver ruta a pie</a>\n`;
      if (result.parada.fuenteUrl) {
        text += `🔎 <a href="${this.escapeHtml(result.parada.fuenteUrl)}">Fuente consultada</a>\n`;
      }
      text += '\n';
    });

    return { text, parse_mode: 'HTML' };
  }
}

