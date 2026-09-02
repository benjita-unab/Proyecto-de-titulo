import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class RutasService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(RutasService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY') || this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.error('Las credenciales de Supabase no están configuradas');
    }
  }

  async getRoutesForDestination(destination: string): Promise<any[]> {
    if (!this.supabase) {
      this.logger.error('Cliente Supabase no inicializado');
      return [];
    }

    try {
      // Buscar el destino en la columna calles_principales ignorando mayúsculas y acentos
      const { data, error } = await this.supabase
        .from('recorrido_transporte')
        .select(`
          nombre_recorrido,
          calles_principales,
          medio_transporte (
            nombre_linea,
            tipo_transporte
          )
        `);

      if (error) {
        this.logger.error(`Error al consultar Supabase: ${error.message}`);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Filtrar localmente quitando acentos para asegurar coincidencia exacta
      const normalizedDest = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Separar el destino en palabras clave para hacer una búsqueda más flexible
      // Ignoramos palabras de 3 letras o menos ("de", "la", "las", "el", "un"), excepto si contienen números (como "40")
      const searchTerms = normalizedDest.split(/\s+/).filter(w => w.length > 3 || /\d/.test(w));

      const filteredData = data.filter((route: any) => {
        const callesNormalizadas = (route.calles_principales || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (searchTerms.length > 0) {
          // El recorrido debe contener TODAS las palabras clave significativas
          return searchTerms.every(term => callesNormalizadas.includes(term));
        } else {
          return callesNormalizadas.includes(normalizedDest);
        }
      });

      if (filteredData.length === 0) {
        return [];
      }

      // Extraer y formatear la respuesta
      const structuredRoutes = filteredData.map((route: any) => {
        // En Supabase, si la relación es 1 a 1, medio_transporte vendrá como objeto, sino como array.
        const medio = Array.isArray(route.medio_transporte) ? route.medio_transporte[0] : route.medio_transporte;
        const nombreLinea = medio?.nombre_linea || route.nombre_recorrido;
        const tipoTransporte = medio?.tipo_transporte || 'Desconocido';
        
        return {
          linea: nombreLinea,
          recorrido: route.calles_principales,
          tipo: tipoTransporte,
        };
      });

      return structuredRoutes;
    } catch (err) {
      this.logger.error(`Error inesperado al buscar rutas: ${err}`);
      return [];
    }
  }
}
