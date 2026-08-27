import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class RutasService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(RutasService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.error('Las credenciales de Supabase no están configuradas');
    }
  }

  async getRoutesForDestination(destination: string): Promise<string[]> {
    if (!this.supabase) {
      this.logger.error('Cliente Supabase no inicializado');
      return [];
    }

    try {
      // Buscar el destino en la columna calles_principales ignorando mayúsculas/minúsculas
      const { data, error } = await this.supabase
        .from('RECORRIDO_TRANSPORTE')
        .select(`
          nombre_recorrido,
          calles_principales,
          MEDIO_TRANSPORTE (
            nombre_linea,
            tipo_transporte
          )
        `)
        .ilike('calles_principales', `%${destination}%`);

      if (error) {
        this.logger.error(`Error al consultar Supabase: ${error.message}`);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Extraer y formatear la respuesta
      const formattedRoutes = data.map((route: any) => {
        // En Supabase, si la relación es 1 a 1, MEDIO_TRANSPORTE vendrá como objeto, sino como array.
        // Asumiendo que viene como objeto porque RECORRIDO_TRANSPORTE pertenece a un MEDIO_TRANSPORTE
        const medio = Array.isArray(route.MEDIO_TRANSPORTE) ? route.MEDIO_TRANSPORTE[0] : route.MEDIO_TRANSPORTE;
        const nombreLinea = medio?.nombre_linea || route.nombre_recorrido;
        return `${nombreLinea} - Recorrido: ${route.calles_principales}`;
      });

      return formattedRoutes;
    } catch (err) {
      this.logger.error(`Error inesperado al buscar rutas: ${err}`);
      return [];
    }
  }
}
