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

export const RADIOTAXIS_CONTINGENCIA_LIMACHE: RadioTaxiDto[] = [
  {
    id: 'TAXI-LIM-01',
    nombre: 'Radio Taxi Limache',
    telefono: '+56322626021',
    telefonoFormateado: '32 2626021',
    direccionBase: 'Porvenir 574, Limache',
    tarifaBaseEstimada: '$2.500 - $3.000',
    horarioAtencion: 'Lun a Dom 24 horas',
    autorizada: true,
  },
  {
    id: 'TAXI-LIM-02',
    nombre: 'Radio Taxi SindTrabTaxis Colectivo Ltda',
    telefono: '+5633256654',
    telefonoFormateado: '(33) 256654',
    direccionBase: 'Calle El Roble 1198, Limache',
    tarifaBaseEstimada: '$2.500 - $3.000',
    horarioAtencion: 'Lun a Dom de 08:00 a 20:00 pm',
    autorizada: true,
  },
  {
    id: 'TAXI-LIM-03',
    nombre: 'Taxi Colectivos Juan Egaña – Limache',
    telefono: '+5633414613',
    telefonoFormateado: '(33) 414613',
    direccionBase: 'Calle Los Alamos 816, Limache',
    tarifaBaseEstimada: '$2.500 - $3.000',
    horarioAtencion: 'Lun a Dom de 08:00 a 20:00 pm',
    autorizada: true,
  },
];

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
  async getCentralesRadioTaxi(): Promise<RadioTaxiDto[]> {
    if (!this.supabase) {
      return RADIOTAXIS_CONTINGENCIA_LIMACHE;
    }

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
        return RADIOTAXIS_CONTINGENCIA_LIMACHE;
      }

      return data.map((row: any) => ({
        id: row.id_radiotaxi,
        nombre: row.nombre_central,
        telefono: row.telefono,
        telefonoFormateado: row.telefono_formateado || row.telefono,
        direccionBase: row.direccion_base,
        tarifaBaseEstimada: row.tarifa_base_estimada || '$2.500 - $3.000',
        horarioAtencion: row.horario_atencion || '24 Horas',
        autorizada: row.autorizada ?? true,
      }));
    } catch (err: any) {
      this.logger.error(`Error inesperado al obtener radiotaxis: ${err.message}`);
      return RADIOTAXIS_CONTINGENCIA_LIMACHE;
    }
  }
}
