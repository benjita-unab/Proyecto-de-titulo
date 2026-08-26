import { Injectable } from '@nestjs/common';

@Injectable()
export class RutasService {
  getRoutesForDestination(destination: string) {
    const mockDb: Record<string, string[]> = {
      'plaza': ['Línea 7 - Recorrido: Plaza de Armas, Estadio Municipal', 'Colectivo 22 - Recorrido: Centro, Plaza'],
      'hospital': ['Línea 1 - Recorrido: Terminal, Hospital Central'],
      'cesfam': ['Línea 3 - Recorrido: Mercado Central, Cesfam, Villa Norte']
    };

    return mockDb[destination] || [];
  }
}
