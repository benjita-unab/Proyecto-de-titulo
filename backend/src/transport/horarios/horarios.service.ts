import { Injectable } from '@nestjs/common';

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
}

@Injectable()
export class HorariosService {
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
   * Compara la hora dada (o la hora del celular/servidor) con el itinerario para detectar
   * si el servicio ya terminó o está activo.
   */
  checkHorarioStatus(currentDate?: Date | string): HorarioStatusResult {
    const date = currentDate
      ? typeof currentDate === 'string'
        ? new Date(currentDate)
        : currentDate
      : new Date();

    const dayOfWeek = date.getDay(); // 0: Domingo, 1-5: Lunes a Viernes, 6: Sábado
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    let currentFranja: FranjaHoraria | undefined;
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      currentFranja = this.defaultHorarios.find((f) => f.tipoDia === 'semana');
    } else if (dayOfWeek === 6) {
      currentFranja = this.defaultHorarios.find((f) => f.tipoDia === 'sabado');
    } else {
      currentFranja = this.defaultHorarios.find((f) => f.tipoDia === 'domingo');
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
        horarios: this.defaultHorarios,
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
        horarios: this.defaultHorarios,
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
        horarios: this.defaultHorarios,
      };
    }

    return {
      isOutOfService: false,
      status: 'EN_SERVICIO',
      badgeText: 'EN SERVICIO',
      detail: `Operando hoy con normalidad hasta las ${currentFranja.termino} hrs.`,
      currentTime,
      franjaActiva: currentFranja,
      horarios: this.defaultHorarios,
    };
  }
}
