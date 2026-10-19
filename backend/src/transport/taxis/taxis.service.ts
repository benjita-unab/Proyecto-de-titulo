import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RadioTaxiDto {
  id: string;
  nombre: string;
  telefono: string;
  telefonoFormateado: string;
  direccionBase: string;
  tarifaBaseEstimada: string;
  horarioAtencion: string;
  autorizada: boolean;
}

export const RADIOTAXIS_CONTINGENCIA_QUILPUE: RadioTaxiDto[] = [
  {
    id: 'TAXI-QLP-01',
    nombre: 'Taxiexpress Quilpué',
    telefono: '+56989795644',
    telefonoFormateado: '(+56 9) 8979 5644',
    direccionBase: 'Pje Campo Lindo 2695, Quilpué',
    tarifaBaseEstimada: '$2.500 - $3.200',
    horarioAtencion: 'Lun a Dom 24 horas',
    autorizada: true,
  },
  {
    id: 'TAXI-QLP-02',
    nombre: 'Radio Taxi Transporte Privado 24 Horas',
    telefono: '+56997996241',
    telefonoFormateado: '(+56 9) 9799 6241',
    direccionBase: 'Lago Lanalhue 2405, Quilpué',
    tarifaBaseEstimada: '$2.500 - $3.000',
    horarioAtencion: 'Lun a Dom 24 horas',
    autorizada: true,
  },
  {
    id: 'TAXI-QLP-03',
    nombre: 'Radio Taxi Quilpué Centro',
    telefono: '+56977665544',
    telefonoFormateado: '(+56 9) 7766 5544',
    direccionBase: 'Av. Los Carrera 850, Quilpué',
    tarifaBaseEstimada: '$2.500 - $3.200',
    horarioAtencion: 'Lun a Dom 24 horas',
    autorizada: true,
  },
];

export const RADIOTAXIS_CONTINGENCIA_LIMACHE = RADIOTAXIS_CONTINGENCIA_QUILPUE;

@Injectable()
export class TaxisService {
  private readonly logger = new Logger(TaxisService.name);
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
      this.logger.warn(
        'Supabase URL o Key no encontradas para TaxisService. Se usará contingencia predeterminada.',
      );
    }
  }

  /**
   * Recupera las centrales de radiotaxi autorizadas desde la tabla `servicio_radiotaxi` de Supabase.
   * Si la base de datos no está disponible, entrega la lista oficial de contingencia.
   */
  async getCentralesRadioTaxi(comuna?: string): Promise<RadioTaxiDto[]> {
    let resultList: RadioTaxiDto[] = [];

    if (!this.supabase) {
      resultList = RADIOTAXIS_CONTINGENCIA_LIMACHE;
    } else {
      try {
        let timeoutId: NodeJS.Timeout;
        const fetchPromise = this.supabase
          .from('servicio_radiotaxi')
          .select('*')
          .eq('activo', true)
          .order('id_radiotaxi', { ascending: true });

        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
          timeoutId = setTimeout(
            () =>
              resolve({
                data: null,
                error: new Error('Timeout consultando servicio_radiotaxi'),
              }),
            2000,
          );
        });

        const { data, error } = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as any;
        clearTimeout(timeoutId!);

        if (error || !data || data.length === 0) {
          if (error) {
            this.logger.warn(
              `Aviso consultando servicio_radiotaxi en Supabase: ${error.message}`,
            );
          }
          resultList = RADIOTAXIS_CONTINGENCIA_LIMACHE;
        } else {
          resultList = data.map((row: any) => ({
            id: row.id_radiotaxi,
            nombre: row.nombre_central,
            telefono: row.telefono,
            telefonoFormateado: row.telefono_formateado || row.telefono,
            direccionBase: row.direccion_base,
            tarifaBaseEstimada: row.tarifa_base_estimada || '$2.500 - $3.000',
            horarioAtencion: row.horario_atencion || '24 Horas',
            autorizada: row.autorizada ?? true,
          }));
        }
      } catch (err: any) {
        this.logger.error(`Error inesperado al obtener radiotaxis: ${err.message}`);
        resultList = RADIOTAXIS_CONTINGENCIA_LIMACHE;
      }
    }

    // Excluir permanentemente cualquier radiotaxi de Villa Alemana
    resultList = resultList.filter((item) => {
      const corpus = `${item.nombre} ${item.direccionBase}`.toLowerCase();
      return !corpus.includes('villa alemana');
    });

    if (resultList.length === 0) {
      resultList = RADIOTAXIS_CONTINGENCIA_QUILPUE;
    }

    if (comuna && comuna.trim()) {
      const normalizedComuna = comuna.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const filtered = resultList.filter((item) => {
        const text = `${item.nombre} ${item.direccionBase}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return text.includes(normalizedComuna);
      });
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return resultList;
  }
}
