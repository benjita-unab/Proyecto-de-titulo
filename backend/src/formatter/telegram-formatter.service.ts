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
        `🚌 <b>Movitech Limache - Consulta de Recorridos</b>\n\n` +
        `Disculpa, no encontré recorridos directos para el destino solicitado.\n\n` +
        `📍 <b>Destinos frecuentes sugeridos:</b>\n` +
        `• Hospital Santo Tomás\n` +
        `• Estación Limache (Metro Valparaíso)\n` +
        `• Plaza de las 40 Horas / Centro\n` +
        `• Cesfam Limache Viejo\n\n` +
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
      const tipoSafe = this.escapeHtml(route.tipo || 'Microbús Agdabus');
      const horarioSafe = this.escapeHtml(route.horario || '06:30 - 21:00 hrs');
      const frecuenciaSafe = this.escapeHtml(route.frecuencia || 'Cada 10-15 min');
      const tarifaAdulto = this.escapeHtml(route.tarifaAdultoMayor || '$150 (Con pase adulto mayor)');
      const tarifaGral = this.escapeHtml(route.tarifaGeneral || '$350 - $450');

      message += `<b>Opción ${index + 1}:</b> 🚌 <b>${lineaSafe}</b> (${tipoSafe})\n`;
      message += `📍 <b>Pasa por:</b> ${recorridoSafe}\n`;
      message += `⏱️ <b>Horario y frecuencia:</b> ${horarioSafe} | ${frecuenciaSafe}\n`;
      message += `💰 <b>Tarifa Adulto Mayor:</b> ${tarifaAdulto} | General: ${tarifaGral}\n\n`;
    });

    // Enlace de asistencia en mapa
    const encodedDest = encodeURIComponent(`${destination} Limache`);
    message += `🗺️ <a href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodedDest}&amp;travelmode=transit">Ver ruta completa en Google Maps</a>\n\n`;
    message += `💡 <i>Tip Movitech: Recuerda tener a mano tu pase de adulto mayor para acceder a la tarifa rebajada.</i>`;

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
        `🚌 *Movitech Limache - Consulta de Recorridos*\n\n` +
        `Disculpa, no encontré recorridos directos para el destino solicitado.\n\n` +
        `📍 *Destinos frecuentes sugeridos:*\n` +
        `• Hospital Santo Tomás\n` +
        `• Estación Limache (Metro Valparaíso)\n` +
        `• Plaza de las 40 Horas / Centro\n` +
        `• Cesfam Limache Viejo\n\n` +
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
      const tipoSafe = route.tipo || 'Microbús Agdabus';
      const horarioSafe = route.horario || '06:30 - 21:00 hrs';
      const frecuenciaSafe = route.frecuencia || 'Cada 10-15 min';
      const tarifaAdulto = route.tarifaAdultoMayor || '$150 (Con pase adulto mayor)';
      const tarifaGral = route.tarifaGeneral || '$350 - $450';

      message += `*Opción ${index + 1}:* 🚌 *${lineaSafe}* (${tipoSafe})\n`;
      message += `📍 *Pasa por:* ${recorridoSafe}\n`;
      message += `⏱️ *Horario y frecuencia:* ${horarioSafe} | ${frecuenciaSafe}\n`;
      message += `💰 *Tarifa Adulto Mayor:* ${tarifaAdulto} | General: ${tarifaGral}\n\n`;
    });

    const encodedDest = encodeURIComponent(`${destination} Limache`);
    message += `🗺️ [Ver ruta completa en Google Maps](https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=transit)\n\n`;
    message += `💡 _Tip Movitech: Recuerda tener a mano tu pase de adulto mayor para acceder a la tarifa rebajada._`;

    return {
      text: message,
      parse_mode: 'Markdown',
    };
  }

  /**
   * Plantilla 2: Directorio de Radio Taxis Autorizados de Limache
   * Diseñada con botones telefónicos directos y tarifas transparentes.
   * - Emojis institucionales: 🚕, 📍, 📞, ⏱️, 💰, 🛡️
   */
  public formatRadioTaxisResponse(
    taxis: RadioTaxiDto[],
  ): TelegramFormattedResponse {
    if (!taxis || taxis.length === 0) {
      return {
        text:
          `🚕 <b>Movitech Limache - Radio Taxis</b>\n\n` +
          `En este momento no hay información de bases disponibles en el directorio.\n` +
          `Por favor, intenta nuevamente en unos minutos.`,
        parse_mode: 'HTML',
      };
    }

    let message = `🚕 <b>DIRECTORIO OFICIAL DE RADIO TAXIS - LIMACHE</b>\n`;
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
      `👋 ¡Hola${nombre}! Te damos la bienvenida a <b>Movitech Limache</b>.\n\n` +
      `Tu asistente de movilidad diseñado especialmente para acompañarte y facilitarte tus viajes en la comuna.\n\n` +
      `¿En qué te puedo ayudar hoy?\n` +
      `• 🚌 <b>Recorridos y micros:</b> "¿Cómo llego al Hospital?"\n` +
      `• ⏱️ <b>Horarios:</b> "¿A qué hora pasa la Línea 01?"\n` +
      `• 🚕 <b>Radio Taxis:</b> "¿Cuáles son los taxis de Limache?"\n\n` +
      `<i>Escribe tu consulta con tranquilidad y te responderé de inmediato.</i>`;

    return {
      text,
      parse_mode: 'HTML',
    };
  }

  /**
   * Plantilla 3: Horarios de Operación y Salidas
   */
  public formatHorarioResponse(statusResult: any): TelegramFormattedResponse {
    let message = `⏱️ <b>HORARIOS DE OPERACIÓN - MICROBUSES LIMACHE</b>\n`;
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

    const nombreLinea = statusResult.linea || 'Microbuses Agdabus (Limache - Olmué)';
    message += `\n🚌 <i>Servicio: ${this.escapeHtml(nombreLinea)}</i>`;

    return {
      text: message,
      parse_mode: 'HTML',
    };
  }
}

