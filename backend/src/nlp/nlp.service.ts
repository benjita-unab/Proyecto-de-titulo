import { Injectable } from '@nestjs/common';

@Injectable()
export class NlpService {
  processQuery(text: string) {
    const cleanText = this.cleanText(text);

    // Detectar consulta de radio taxi
    const isTaxiQuery =
      /taxi|radiotaxi|radio taxi|colectivo|central de taxi|centrales de taxi|pedir un taxi|llamar a un taxi|numero de taxi|número de taxi|numeros de radio taxi|números de radio taxi/i.test(
        text,
      );

    if (isTaxiQuery) {
      return {
        intent: 'Consultar RadioTaxi',
        destination: null,
      };
    }

    // Detectar consulta de horarios
    const isScheduleQuery =
      /horario|horarios|primera salida|primer bus|ultima salida|última salida|ultimo bus|último bus|a que hora|a qué hora|hasta que hora|hasta qué hora|frecuencia/i.test(
        text,
      );

    if (isScheduleQuery) {
      // Verificar si especifica una línea particular (ej. "línea 22", "linea 2", "linea 01", "22")
      const lineaMatch = text.match(/\b(?:linea|línea|micro)\s*(\d+[a-zA-Z]?)\b/i);
      const linea = lineaMatch ? lineaMatch[1] : null;

      return {
        intent: 'Consultar Horario',
        destination: null,
        linea,
      };
    }

    const destination = this.extractDestination(cleanText);

    if (!destination) {
      return {
        intent: 'unknown',
        destination: null,
      };
    }

    return {
      intent: 'Buscar Ruta',
      destination,
    };
  }

  cleanText(text: string): string {
    // Convert to lowercase and remove accents
    let cleaned = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Remove punctuation
    cleaned = cleaned.replace(/[.,;!?¿¡]/g, '');
    
    // Remover palabras de cortesía y relleno comunes
    cleaned = cleaned.replace(/\b(por favor|gracias|hola|como estas|buenos dias|buenas tardes|buenas noches|mira|necesito que me entregues directamente una linea de bus que|necesito que me des|me gustaria|quisiera|quiero|necesito)\b/g, '');
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  extractDestination(cleanText: string): string | null {
    // Expresiones regulares para detectar la intención y extraer el destino
    // El .* antes de la preposición permite palabras intermedias.
    const patterns = [
      /como llego .*(?:a|al) (.*)/,
      /como llegar .*(?:a|al) (.*)/,
      /como ir .*(?:a|al) (.*)/,
      /quiero ir .*(?:a|al) (.*)/,
      /quiero llegar .*(?:a|al) (.*)/,
      /necesito llegar .*(?:a|al) (.*)/,
      /necesito ir .*(?:a|al) (.*)/,
      /pase .*por (.*)/,
      /pasar .*por (.*)/,
      /pasando por (.*)/,
      /lleve .*a (.*)/,
      /lleve .*al (.*)/,
      /deje .*en (.*)/,
      /voy .*a (.*)/,
      /voy .*al (.*)/,
      /voy para (.*)/,
      /micro para (.*)/,
      /micro al (.*)/,
      /micro a (.*)/,
      /colectivo para (.*)/,
      /colectivo al (.*)/,
      /colectivo a (.*)/,
      /llegar .*a (.*)/,
      /ruta hacia (.*)/,
      /ruta para (.*)/,
      /hacia (.*)/,
      /para llegar a (.*)/,
      /para llegar al (.*)/,
      /para (.*)/,
      /ir .*a (.*)/,
      /busco (.*)/,
      /a la (.*)/,
      /por la (.*)/,
      /por el (.*)/,
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        let dest = match[1].trim();
        if (dest.length > 0) {
          // Remover artículos iniciales comunes
          dest = dest.replace(/^(el|la|los|las|un|una)\s+/i, '');
          return dest;
        }
      }
    }
    
    // Fallback: Si el texto es relativamente corto (hasta 8 palabras), asumimos que el usuario
    // escribió directamente el destino (ej: "a la plaza de las 40 horas")
    const words = cleanText.split(/\s+/);
    if (words.length > 0 && words.length <= 8) {
      // También limpiamos palabras iniciales como 'a la ' si quedaron
      let dest = cleanText.replace(/^(a la |al |a |hacia |para |por )/i, '');
      return dest;
    }

    return null;
  }
}
