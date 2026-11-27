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
      this.logger.warn('Supabase URL o Key no encontradas para TaxisService.');
    }
  }

  /**
   * Devuelve solo centrales activas cuya autorización y fuente hayan sido verificadas.
   */
  async getCentralesRadioTaxi(comuna?: string): Promise<RadioTaxiDto[]> {
    if (!this.supabase) {
      return [];
    }

    let timeoutId: NodeJS.Timeout | undefined;
    const fetchPromise = this.supabase
      .from('servicio_radiotaxi')
      .select('*')
      .eq('activo', true)
      .eq('autorizada', true)
      .eq('verificado', true)
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

    let data: any;
    let error: any;
    try {
      ({ data, error } = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any);
    } catch (queryError) {
      const message = queryError instanceof Error ? queryError.message : String(queryError);
      this.logger.error(
        `Falló la consulta de centrales de radiotaxi: ${message}. No se mostrarán contactos sin confirmar.`,
      );
      return [];
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    if (error) {
      this.logger.error(
        `No se pudieron consultar centrales de radiotaxi verificadas: ${error.message}. No se mostrarán contactos sin confirmar.`,
      );
      return [];
    }

    const verifiedRows = (data || []).filter(
      (row: any) =>
        typeof row.fuente_url === 'string' &&
        row.fuente_url.startsWith('https://') &&
        typeof row.evidencia_fuente === 'string' &&
        row.evidencia_fuente.trim().length > 0 &&
        Boolean(row.fecha_verificacion),
    );

    const resultList: RadioTaxiDto[] = verifiedRows.map((row: any) => ({
      id: row.id_radiotaxi,
      nombre: row.nombre_central,
      telefono: row.telefono,
      telefonoFormateado: row.telefono_formateado || row.telefono,
      direccionBase: row.direccion_base,
      tarifaBaseEstimada: row.tarifa_base_estimada || 'Consultar con la central',
      horarioAtencion: row.horario_atencion || 'Confirmar disponibilidad',
      autorizada: row.autorizada === true,
    }));

    if (comuna && comuna.trim()) {
      const normalizedComuna = comuna.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return resultList.filter((item) => {
        const text = `${item.nombre} ${item.direccionBase}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return text.includes(normalizedComuna);
      });
    }

    return resultList;
  }
}
