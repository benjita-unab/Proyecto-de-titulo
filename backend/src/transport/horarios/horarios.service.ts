import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface FranjaHoraria {
  dias: string;
  inicio: string; // Formato "HH:mm" (ej: "06:30")
  termino: string; // Formato "HH:mm" (ej: "21:00")
  tipoDia: 'semana' | 'sabado' | 'domingo';
}

export interface HorarioStatusResult {
  isOutOfService: boolean;
  status: 'EN_SERVICIO' | 'FUERA_DE_HORARIO';
  badgeText: string;
  detail: string;
  currentTime: string;
  franjaActiva: FranjaHoraria | null;
  horarios: FranjaHoraria[];
  linea?: string;
  empresa?: string;
}

@Injectable()
export class HorariosService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(HorariosService.name);

  constructor(@Optional() private configService?: ConfigService) {
    if (this.configService) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey =
        this.configService.get<string>('SUPABASE_KEY') ||
        this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      }
    }
  }

  private readonly defaultHorarios: FranjaHoraria[] = [
    {
      dias: 'Lunes a Viernes',
      inicio: '06:30',
      termino: '21:00',
      tipoDia: 'semana',
    },
    {
      dias: 'Sábados',
      inicio: '07:00',
      termino: '20:30',
      tipoDia: 'sabado',
    },
    {
      dias: 'Domingos y Festivos',
      inicio: '07:30',
      termino: '20:00',
      tipoDia: 'domingo',
    },
  ];

  getHorarios(): FranjaHoraria[] {
    return this.defaultHorarios;
  }

  /**
   * Entrega un resumen estructurado de las líneas y sus horarios habituales,
   * permitiendo filtrar por comuna (Quilpué o Villa Alemana).
   */
  getLineasResumen(comuna?: string): Array<{ linea: string; recorrido: string; horarios: string; comuna: string }> {
    const todas = [
      {
        linea: 'Línea C02',
        recorrido: 'Peumo - Villa Alemana - Belloto Norte - Quilpué',
        horarios: 'Lun a Dom 06:00 - 22:30 hrs (Cada 12-15 min)',
        comuna: 'Quilpué y Villa Alemana',
      },
      {
        linea: 'Línea 108',
        recorrido: 'Peñablanca - Peumo - Centro Villa Alemana - Pompeya',
        horarios: 'Lun a Dom 06:15 - 21:50 hrs (Cada 15 min)',
        comuna: 'Villa Alemana',
      },
      {
        linea: 'Línea C03',
        recorrido: 'Los Pinos - Plaza Quilpué - Estación Quilpué',
        horarios: 'Lun a Dom 06:00 - 22:00 hrs (Cada 10 min)',
        comuna: 'Quilpué',
      },
      {
        linea: 'Línea 111',
        recorrido: 'Los Pinos - Hospital de Quilpué - Camino Troncal - Playa Ancha',
        horarios: 'Lun a Dom 05:30 - 21:30 hrs (Cada 12 min)',
        comuna: 'Quilpué',
      },
      {
        linea: 'Línea Q02',
        recorrido: 'Villa Alemana - El Belloto (Feria) - Centro Quilpué - Viña del Mar',
        horarios: 'Lun a Dom 06:00 - 22:15 hrs (Cada 8-10 min)',
        comuna: 'Quilpué y Villa Alemana',
      },
      {
        linea: 'Línea 105-D',
        recorrido: 'Peñablanca - Villa Alemana - Troncal Sur - Plaza Victoria Valparaíso',
        horarios: 'Lun a Dom 05:45 - 22:00 hrs (Cada 15 min)',
        comuna: 'Villa Alemana',
      },
    ];

    if (!comuna) {
      return todas;
    }

    const norm = comuna.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes('villa') || norm.includes('alemana') || norm.includes('peñablanca') || norm.includes('penablanca')) {
      return todas.filter((l) => l.comuna.includes('Villa Alemana'));
    }
    if (norm.includes('quilpue')) {
      return todas.filter((l) => l.comuna.includes('Quilpué'));
    }
    return todas;
  }

  /**
   * Obtiene los horarios desde Supabase para una línea específica o el general.
   */
  async getHorariosPorLinea(linea?: string): Promise<{ franjas: FranjaHoraria[]; nombreLinea: string; empresa: string }> {
    const defaultRes = {
      franjas: this.defaultHorarios,
      nombreLinea: linea ? `Microbús ${linea} (Quilpué - Villa Alemana)` : 'Servicio de Microbuses en General (Quilpué - Villa Alemana)',
      empresa: linea ? 'Transporte Metropolitano de Valparaíso' : 'Transporte Público Marga Marga',
    };

    if (!this.supabase) {
      return defaultRes;
    }

    try {
      let query = this.supabase
        .from('horario_servicio')
        .select(`
          tipo_dia,
          dias,
          hora_inicio,
          hora_termino,
          id_transporte,
          medio_transporte (
            nombre_linea,
            tipo_transporte,
            empresa_operadora
          )
        `);

      if (linea) {
        // Formatear búsqueda de línea, por ej. 'C02', '108', '111', 'Q02', '105-D'
        const num = parseInt(linea, 10);
        const padded = !isNaN(num) ? String(num).padStart(2, '0') : linea;
        query = query.or(`id_transporte.ilike.%${padded}%,id_transporte.ilike.%${linea}%`);
      }

      let timeoutId: NodeJS.Timeout;
      const fetchPromise = query;
      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
        timeoutId = setTimeout(
          () => resolve({ data: null, error: new Error('Timeout consultando Supabase') }),
          1500,
        );
      });

      const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;
      clearTimeout(timeoutId!);

      if (error || !data || data.length === 0) {
        if (error) this.logger.warn(`Error al consultar horario_servicio: ${error.message}`);
        return defaultRes;
      }

      // Mapear franjas
      const franjasMap = new Map<string, FranjaHoraria>();
      let detectedLinea = linea ? defaultRes.nombreLinea : 'Servicio de Microbuses en General (Quilpué - Villa Alemana)';
      let detectedEmpresa = linea ? defaultRes.empresa : 'Transporte Público Marga Marga';

      for (const row of data as any[]) {
        if (linea && row.medio_transporte) {
          const mt = Array.isArray(row.medio_transporte) ? row.medio_transporte[0] : row.medio_transporte;
          if (mt?.nombre_linea) detectedLinea = `Microbús ${mt.nombre_linea}`;
          if (mt?.empresa_operadora) detectedEmpresa = mt.empresa_operadora;
        }

        if (!franjasMap.has(row.tipo_dia)) {
          franjasMap.set(row.tipo_dia, {
            tipoDia: row.tipo_dia,
            dias: row.dias,
            inicio: row.hora_inicio,
            termino: row.hora_termino,
          });
        }
      }

      const franjas = Array.from(franjasMap.values());
      return {
        franjas: franjas.length >= 3 ? franjas : this.defaultHorarios,
        nombreLinea: detectedLinea,
        empresa: detectedEmpresa,
      };
    } catch (err) {
      this.logger.error(`Error inesperado al consultar horarios de Supabase: ${err}`);
      return defaultRes;
    }
  }

  /**
   * Compara la hora dada (o la hora del celular/servidor) con el itinerario para detectar
   * si el servicio ya terminó o está activo. Permite pasar franjas dinámicas de Supabase.
   */
  checkHorarioStatus(
    currentDate?: Date | string,
    customFranjas?: FranjaHoraria[],
    extraInfo?: { linea?: string; empresa?: string },
  ): HorarioStatusResult {
    const date = currentDate
      ? typeof currentDate === 'string'
        ? new Date(currentDate)
        : currentDate
      : new Date();

    const franjasList = customFranjas && customFranjas.length > 0 ? customFranjas : this.defaultHorarios;

    const dayOfWeek = date.getDay(); // 0: Domingo, 1-5: Lunes a Viernes, 6: Sábado
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    let currentFranja: FranjaHoraria | undefined;
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      currentFranja = franjasList.find((f) => f.tipoDia === 'semana');
    } else if (dayOfWeek === 6) {
      currentFranja = franjasList.find((f) => f.tipoDia === 'sabado');
    } else {
      currentFranja = franjasList.find((f) => f.tipoDia === 'domingo');
    }

    const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;

    if (!currentFranja) {
      return {
        isOutOfService: false,
        status: 'EN_SERVICIO',
        badgeText: 'Horario regular',
        detail: 'Horario habitual de funcionamiento.',
        currentTime,
        franjaActiva: null,
        horarios: franjasList,
        linea: extraInfo?.linea,
        empresa: extraInfo?.empresa,
      };
    }

    const [startH, startM] = currentFranja.inicio.split(':').map(Number);
    const [endH, endM] = currentFranja.termino.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const isPastEndTime = currentMinutes > endMinutes;
    const isBeforeStartTime = currentMinutes < startMinutes;
    const isOutOfService = isPastEndTime || isBeforeStartTime;

    if (isPastEndTime) {
      return {
        isOutOfService: true,
        status: 'FUERA_DE_HORARIO',
        badgeText: 'FUERA DE HORARIO',
        detail: `La última salida de hoy fue a las ${currentFranja.termino} hrs. La hora actual es ${currentTime} hrs.`,
        currentTime,
        franjaActiva: currentFranja,
        horarios: franjasList,
        linea: extraInfo?.linea,
        empresa: extraInfo?.empresa,
      };
    }

    if (isBeforeStartTime) {
      return {
        isOutOfService: true,
        status: 'FUERA_DE_HORARIO',
        badgeText: 'FUERA DE HORARIO',
        detail: `El servicio inicia hoy a las ${currentFranja.inicio} hrs. La hora actual es ${currentTime} hrs.`,
        currentTime,
        franjaActiva: currentFranja,
        horarios: franjasList,
        linea: extraInfo?.linea,
        empresa: extraInfo?.empresa,
      };
    }

    return {
      isOutOfService: false,
      status: 'EN_SERVICIO',
      badgeText: 'EN SERVICIO',
      detail: `Operando hoy con normalidad hasta las ${currentFranja.termino} hrs.`,
      currentTime,
      franjaActiva: currentFranja,
      horarios: franjasList,
      linea: extraInfo?.linea,
      empresa: extraInfo?.empresa,
    };
  }
}
