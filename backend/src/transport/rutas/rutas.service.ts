import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RouteOption {
  linea: string;
  recorrido: string;
  tipo: string;
}

const RUTAS_CONTINGENCIA_MARGA_MARGA: Array<{ linea: string; recorrido: string; tipo: string }> = [
  {
    linea: 'Línea C02',
    recorrido: 'Sector Peumo, Fundo El Litre, Estación Metro Villa Alemana, Eje Comercial Av. Valparaíso, Belloto Norte, Estación Quilpué. Sirve para: Peumo, Fundo El Litre, Estación Metro Villa Alemana, Eje Comercial Av. Valparaíso, Belloto Norte, Quilpué, Centro',
    tipo: 'Microbús',
  },
  {
    linea: 'Línea 108',
    recorrido: 'Sectores altos de Peñablanca, Peumo, Centro de Villa Alemana, Av. Valparaíso, Mena, Pompeya, Avenidas comerciales. Sirve para: Peñablanca, Peumo, Centro de Villa Alemana, Pompeya, Comercio, Mena',
    tipo: 'Microbús',
  },
  {
    linea: 'Línea C03',
    recorrido: 'Sector residencial Los Pinos, Vicuña Mackenna, Plaza de Quilpué, Centro comercial Quilpué, Estación Metro Quilpué. Sirve para: Los Pinos, Plaza de Quilpué, Vicuña Mackenna, Estación Metro Quilpué, Centro, Trámites y Comercio',
    tipo: 'Microbús',
  },
  {
    linea: 'Línea 111',
    recorrido: 'Los Pinos, Hospital de Quilpué, Centro Comercial Quilpué, Arterias principales Peyronet, Camino Troncal, Viña del Mar, Playa Ancha. Sirve para: Los Pinos, Hospital de Quilpué, Centro comercial, Salud, Traslados hacia la costa',
    tipo: 'Microbús',
  },
  {
    linea: 'Línea Q02',
    recorrido: 'Eje troncal principal, Camino Troncal, Av. Los Carrera, Av. Valparaíso, Centro de Villa Alemana, El Belloto (zona comercial y feria), Centro de Quilpué, Viña del Mar. Sirve para: Centro Villa Alemana, El Belloto, Feria El Belloto, Av. Los Carrera, Centro de Quilpué, Viña del Mar, Costa',
    tipo: 'Microbús',
  },
  {
    linea: 'Línea 105-D',
    recorrido: 'Peñablanca, Centro Villa Alemana, Vía expresa Troncal Sur, Puntos neurálgicos de transbordo rápido, Viña del Mar, Plaza Victoria Valparaíso. Sirve para: Peñablanca, Centro Villa Alemana, Troncal Sur, Transbordo rápido, Plaza Victoria, Valparaíso',
    tipo: 'Microbús',
  },
];

@Injectable()
export class RutasService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(RutasService.name);

  constructor(@Optional() private readonly configService?: ConfigService) {
    const supabaseUrl =
      this.configService?.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService?.get<string>('SUPABASE_KEY') ||
      this.configService?.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn('Las credenciales de Supabase no están configuradas para RutasService. Se usará contingencia local.');
    }
  }

  async getRoutesForDestination(destination: string): Promise<RouteOption[]> {
    if (!destination || !destination.trim()) {
      return [];
    }

    let allRoutes: RouteOption[] = [];

    // Intentar consultar Supabase si el cliente está disponible
    if (this.supabase) {
      try {
        let timeoutId: NodeJS.Timeout;
        const fetchPromise = this.supabase
          .from('recorrido_transporte')
          .select(`
            nombre_recorrido,
            calles_principales,
            medio_transporte (
              nombre_linea,
              tipo_transporte
            )
          `);

        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
          timeoutId = setTimeout(() => resolve({ data: null, error: new Error('Timeout Supabase') }), 2000);
        });

        const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        clearTimeout(timeoutId!);

        if (!error && data && data.length > 0) {
          allRoutes = data.map((route: any) => {
            const medio = Array.isArray(route.medio_transporte) ? route.medio_transporte[0] : route.medio_transporte;
            return {
              linea: medio?.nombre_linea || route.nombre_recorrido,
              recorrido: route.calles_principales,
              tipo: medio?.tipo_transporte || 'Microbús',
            };
          });
        }
      } catch (err) {
        this.logger.warn(`Aviso consultando Supabase para rutas: ${err}`);
      }
    }

    // Si Supabase no tiene datos o falló, usar contingencia oficial de Marga Marga (Quilpué / Villa Alemana)
    if (allRoutes.length === 0) {
      allRoutes = RUTAS_CONTINGENCIA_MARGA_MARGA;
    }

    // Filtrado inteligente tolerante a acentos, mayúsculas y variaciones
    const normalizedDest = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Palabras significativas ignorando preposiciones
    const searchTerms = normalizedDest.split(/\s+/).filter((w) => w.length > 3 || /\d/.test(w));

    const filtered = allRoutes.filter((route) => {
      const textoCompleto = `${route.linea} ${route.recorrido}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (searchTerms.length > 0) {
        // Coincidir si contiene al menos uno de los términos significativos o todos
        return searchTerms.every((term) => textoCompleto.includes(term)) ||
               searchTerms.some((term) => ['hospital', 'plaza', 'estacion', 'centro', 'quilpue', 'alemana', 'belloto', 'pinos', '40'].includes(term) && textoCompleto.includes(term));
      }

      return textoCompleto.includes(normalizedDest);
    });

    return filtered;
  }
}

