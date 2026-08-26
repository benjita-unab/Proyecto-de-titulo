import { Injectable } from '@nestjs/common';

@Injectable()
export class NlpService {
  private destinations = [
    'plaza',
    'hospital',
    'cesfam',
    'mercado',
    'estacion',
    'estadio',
    'centro',
  ];

  processQuery(text: string) {
    const cleanText = this.cleanText(text);
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
    return cleaned;
  }

  extractDestination(cleanText: string): string | null {
    const words = cleanText.split(/\s+/);
    for (const word of words) {
      if (this.destinations.includes(word)) {
        return word;
      }
    }
    return null;
  }
}
