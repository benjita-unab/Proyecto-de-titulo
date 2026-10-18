import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CATALOGO_COLECTIVOS_QUILPUE, ColectivoSeedData } from '../../scripts/poblar-colectivos';

export interface ColectivoDto {
  id: string;
  numeroLinea: string;
  nombreLinea: string;
  comuna: string;
  origen: string;
  destino: string;
  trazadoIda: string;
  trazadoRegreso: string;
  frecuenciaMinutos: number;
  horarioInicio: string;
  horarioTermino: string;
  tarifaDiurna: number;
  tarifaNocturna: number;
  tarifaAdultoMayor: number;
  accesibleAdultoMayor: boolean;
  paraderosPrincipales: string[];
}

/**
 * Tarea 5 (HU #5): Interfaz preparada para vinculación de paradas y geolocalización Haversine (HU #3)
 */
export interface PuntoEsperaColectivo {
  idParada: string;
  nombre: string;
  latitud: number;
  longitud: number;
  lineaColectivo: string;
  distanciaMetros?: number;
}

@Injectable()
export class ColectivosService {
  private readonly logger = new Logger(ColectivosService.name);
  private supabase: SupabaseClient | null = null;

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
      this.logger.warn('Credenciales de Supabase ausentes en ColectivosService. Se usará contingencia oficial.');
    }
  }

  private mapFromDb(item: any): ColectivoDto {
    return {
      id: item.id_colectivo || item.id,
      numeroLinea: item.numero_linea || item.numeroLinea,
      nombreLinea: item.nombre_linea || item.nombreLinea,
      comuna: item.comuna || 'Quilpué',
      origen: item.origen,
      destino: item.destino,
      trazadoIda: item.trazado_ida || item.trazadoIda,
      trazadoRegreso: item.trazado_regreso || item.trazadoRegreso,
      frecuenciaMinutos: Number(item.frecuencia_minutos ?? item.frecuenciaMinutos ?? 5),
      horarioInicio: item.horario_inicio || item.horarioInicio || '06:00',
      horarioTermino: item.horario_termino || item.horarioTermino || '22:30',
      tarifaDiurna: Number(item.tarifa_diurna ?? item.tarifaDiurna ?? 850),
      tarifaNocturna: Number(item.tarifa_nocturna ?? item.tarifaNocturna ?? 1100),
      tarifaAdultoMayor: Number(item.tarifa_adulto_mayor ?? item.tarifaAdultoMayor ?? 600),
      accesibleAdultoMayor: Boolean(item.accesible_adulto_mayor ?? item.accesibleAdultoMayor ?? true),
      paraderosPrincipales: typeof item.paraderos_principales === 'string'
        ? item.paraderos_principales.split(',').map((p: string) => p.trim())
        : (item.paraderosPrincipales || []),
    };
  }

  /**
   * Obtiene colectivos que cubren un destino o todo el catálogo si no se especifica.
   * Latencia garantizada <= 1.5s mediante timeout a Supabase y fallback inmediato.
   */
  async getColectivos(filtroDestino?: string): Promise<ColectivoDto[]> {
    let rawList: any[] = [];

    if (this.supabase) {
      try {
        let timeoutId: NodeJS.Timeout;
        const queryPromise = this.supabase
          .from('colectivo')
          .select('*')
          .eq('activo', true);

        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
          timeoutId = setTimeout(() => resolve({ data: null, error: new Error('Timeout Supabase') }), 1200);
        });

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;
        clearTimeout(timeoutId!);

        if (!error && Array.isArray(data) && data.length > 0) {
          rawList = data;
        }
      } catch (err) {
        this.logger.warn(`Fallo al consultar colectivos en Supabase: ${err}. Activando contingencia.`);
      }
    }

    if (rawList.length === 0) {
      rawList = CATALOGO_COLECTIVOS_QUILPUE;
    }

    const mapped = rawList.map((item) => this.mapFromDb(item));

    if (!filtroDestino || !filtroDestino.trim()) {
      return mapped;
    }

    const destNorm = filtroDestino.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const terms = destNorm.split(/\s+/).filter((w) => w.length > 3 || /\d/.test(w));

    return mapped.filter((c) => {
      const corpus = `${c.numeroLinea} ${c.nombreLinea} ${c.destino} ${c.origen} ${c.trazadoIda} ${c.trazadoRegreso} ${c.paraderosPrincipales.join(' ')}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (terms.length > 0) {
        return terms.some((t) => corpus.includes(t));
      }
      return corpus.includes(destNorm);
    });
  }

  /**
   * Tarea 5: Devuelve puntos de espera asociados a colectivos para integrar con el cálculo de Haversine.
   */
  getPuntosEsperaColectivo(numeroLinea?: string): PuntoEsperaColectivo[] {
    const paradasBase: PuntoEsperaColectivo[] = [
      { idParada: 'PAR-COL-01', nombre: 'Garita Belloto Norte', latitud: -33.0442, longitud: -71.4285, lineaColectivo: 'Línea 1' },
      { idParada: 'PAR-COL-02', nombre: 'Plaza de Quilpué (Parada Colectivos)', latitud: -33.0483, longitud: -71.4431, lineaColectivo: 'Línea 1, 2, 3, 5' },
      { idParada: 'PAR-COL-03', nombre: 'Feria El Belloto (Parada Colectivos)', latitud: -33.0510, longitud: -71.4330, lineaColectivo: 'Línea 2' },
      { idParada: 'PAR-COL-04', nombre: 'Terminal Los Pinos Quilpué', latitud: -33.0720, longitud: -71.4360, lineaColectivo: 'Línea 3' },
      { idParada: 'PAR-COL-05', nombre: 'Hospital de Quilpué (Acceso Colectivos)', latitud: -33.0520, longitud: -71.4480, lineaColectivo: 'Línea 4' },
      { idParada: 'PAR-COL-06', nombre: 'Terminal El Retiro Quilpué', latitud: -33.0390, longitud: -71.4550, lineaColectivo: 'Línea 5' },
    ];

    if (!numeroLinea) return paradasBase;
    return paradasBase.filter((p) => p.lineaColectivo.includes(numeroLinea));
  }
}
