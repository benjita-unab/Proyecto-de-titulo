import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RouteOption {
  linea: string;
  recorrido: string;
  tipo: string;
}

const RUTAS_CONTINGENCIA_LIMACHE: Array<{ linea: string; recorrido: string; tipo: string }> = [
  { linea: 'Línea 01', recorrido: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Ramón de la Cerda, Estación Limache, Av. Eastman, Lo Narváez. Sirve para: Hospital Santo Tomás, Centro comercial Urmeneta, Estación', tipo: 'Microbús' },
  { linea: 'Línea 02', recorrido: 'Terminal Victoria, Palmira Romano Sur, República, San Francisco, Estación Limache, Av. Eastman, Centro de Olmué, Cajón Grande. Sirve para: Hospital Santo Tomás, Eje República, Estación', tipo: 'Microbús' },
  { linea: 'Línea 04', recorrido: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Serrano, Estación Limache, Av. Eastman, Paradero 34 Gabriela Mistral. Sirve para: Hospital Santo Tomás, Centro, Estación', tipo: 'Microbús' },
  { linea: 'Línea 08', recorrido: 'Terminal Victoria, Palmira Romano Sur, República, San Francisco, Limachito, Camino Los Laureles. Sirve para: Limache Viejo, Los Laureles, Plaza 40 Horas', tipo: 'Microbús' },
  { linea: 'Línea 09', recorrido: 'Estación Limache, Ramón de la Cerda, Urmeneta, República, Palmira Romano Sur, Santa Rosa. Sirve para: Estación Limache, Centro, Hospital Santo Tomás, Plaza 40 Horas, Santa Rosa', tipo: 'Microbús' },
  { linea: 'Línea 11', recorrido: 'Estación Limache, Urmeneta, República, Palmira Romano Sur, Camino Lliu Lliu, Tranque Lliu Lliu. Sirve para: Estación Limache, Hospital Santo Tomás, Plaza 40 Horas, Lliu Lliu', tipo: 'Microbús' },
  { linea: 'Línea 12', recorrido: 'Terminal Victoria, Palmira Romano Sur, República, Colón, Cancha Los Maitenes. Sirve para: Limache Viejo, Los Maitenes, Plaza 40 Horas', tipo: 'Microbús' },
  { linea: 'Línea 13', recorrido: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Estación Limache, Camino La Paloma. Sirve para: Hospital Santo Tomás, Centro, Estación Limache, La Paloma', tipo: 'Microbús' },
  { linea: 'Línea 15', recorrido: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Serrano, Ramón de la Cerda, Estación Limache. Sirve para: Conectar directo Limache Viejo, Hospital Santo Tomás, Centro, Estación Limache', tipo: 'Microbús' },
  { linea: 'Línea 21', recorrido: 'Terminal Victoria, Palmira Romano Sur, República, Estación Limache, Av. Eastman, Almendral hacia Cuesta La Dormida. Sirve para: Hospital Santo Tomás, Estación Limache, Olmué', tipo: 'Microbús' },
  { linea: 'Línea 22', recorrido: 'Sale de Estación Limache hacia Av. Eastman, Plaza de Olmué, Camarico, La Dormida. Sirve para: Viajes desde la Estación Limache hacia Olmué', tipo: 'Microbús' },
  { linea: 'Línea 23', recorrido: 'Sale de Estación Limache hacia Av. Eastman, Lo Narváez, La Loma de la Vega. Sirve para: Salir de la Estación Limache hacia Olmué rural', tipo: 'Microbús' },
  { linea: 'Línea 24', recorrido: 'Sale de Estación Limache hacia Av. Eastman, Granizo, Niño Dios de Las Palmas. Sirve para: Salir de la Estación Limache hacia Las Palmas', tipo: 'Microbús' },
  { linea: 'Línea 8Y', recorrido: 'Estación Limache, Urmeneta, Palmira Romano Sur, Ruta 60-CH, Tabolango. Sirve para: Hospital Santo Tomás, Centro, Tabolango', tipo: 'Microbús' },
  { linea: 'Línea 22Y', recorrido: 'Sale de Estación Limache hacia Av. Eastman, Ramayana, Km 22 Cuesta La Dormida. Sirve para: Salir de la Estación Limache hacia Olmué alto', tipo: 'Microbús' },
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

    // Si Supabase no tiene datos o falló, usar contingencia oficial de Limache
    if (allRoutes.length === 0) {
      allRoutes = RUTAS_CONTINGENCIA_LIMACHE;
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
               searchTerms.some((term) => ['hospital', 'plaza', 'estacion', 'centro', '40'].includes(term) && textoCompleto.includes(term));
      }

      return textoCompleto.includes(normalizedDest);
    });

    return filtered;
  }
}

