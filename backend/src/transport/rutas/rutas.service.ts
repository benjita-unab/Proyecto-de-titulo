import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RouteOption {
  linea: string;
  recorrido: string;
  tipo: string;
  fuenteUrl?: string;
}

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
        let fetchPromise = this.supabase
          .from('recorrido_transporte')
          .select(`
            nombre_recorrido,
            calles_principales,
            fuente_url,
            evidencia_fuente,
            medio_transporte (
              nombre_linea,
              tipo_transporte
            )
          `)
          .eq('activo', true)
          .eq('verificado', true)
          .not('fuente_url', 'is', null)
          .not('evidencia_fuente', 'is', null);
        const destinationNorm = destination
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (destinationNorm.includes('hospital')) {
          fetchPromise = fetchPromise.eq('pasa_hospital_quilpue', true);
        }

        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
          timeoutId = setTimeout(() => resolve({ data: null, error: new Error('Timeout Supabase') }), 2000);
        });

        const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        clearTimeout(timeoutId!);

        if (!error && data && data.length > 0) {
          allRoutes = data.filter((route: any) =>
            route.fuente_url?.startsWith('https://')
            && typeof route.evidencia_fuente === 'string'
            && route.evidencia_fuente.trim().length > 0,
          ).map((route: any) => {
            const medio = Array.isArray(route.medio_transporte) ? route.medio_transporte[0] : route.medio_transporte;
            return {
              linea: medio?.nombre_linea || route.nombre_recorrido,
              recorrido: route.calles_principales,
              tipo: medio?.tipo_transporte || 'Microbús',
              fuenteUrl: route.fuente_url,
            };
          });
        }
      } catch (err) {
        this.logger.warn(`Aviso consultando Supabase para rutas: ${err}`);
      }
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

