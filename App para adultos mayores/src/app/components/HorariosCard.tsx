import React, { useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle, Calendar, Bus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export interface FranjaHoraria {
  dias: string;
  inicio: string; // Formato "HH:mm" (ej. "06:30")
  termino: string; // Formato "HH:mm" (ej. "21:00")
  tipoDia: 'semana' | 'sabado' | 'domingo';
}

export interface HorarioTransporteData {
  linea?: string;
  empresa?: string;
  franjas: FranjaHoraria[];
}

// Datos predeterminados oficiales de microbuses (Limache - Olmué)
export const HORARIOS_DEFAULT_AGDABUS: HorarioTransporteData = {
  linea: 'Servicio de Microbuses en General (Limache)',
  empresa: 'Transporte Público Urbano y Rural',
  franjas: [
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
  ],
};

interface HorariosCardProps {
  data?: HorarioTransporteData;
  customCurrentDate?: Date; // Para pruebas o validación de hora
}

export const HorariosCard: React.FC<HorariosCardProps> = ({
  data,
  customCurrentDate,
}) => {
  // Extraer franjas de forma segura tanto si vienen como `franjas` o como `horarios`
  const franjas: FranjaHoraria[] = useMemo(() => {
    if (data?.franjas && Array.isArray(data.franjas) && data.franjas.length > 0) {
      return data.franjas;
    }
    const anyData = data as any;
    if (anyData?.horarios && Array.isArray(anyData.horarios) && anyData.horarios.length > 0) {
      return anyData.horarios;
    }
    return HORARIOS_DEFAULT_AGDABUS.franjas;
  }, [data]);

  const linea = data?.linea || (data as any)?.linea || HORARIOS_DEFAULT_AGDABUS.linea;
  const empresa = data?.empresa || (data as any)?.empresa || HORARIOS_DEFAULT_AGDABUS.empresa;

  // Evaluación del estado: usar el del backend si viene, o calcularlo localmente
  const statusInfo = useMemo(() => {
    const anyData = data as any;
    if (anyData && anyData.badgeText && anyData.detail) {
      return {
        isOutOfService: Boolean(anyData.isOutOfService),
        badgeText: anyData.badgeText,
        detail: anyData.detail,
        franjaActiva: anyData.franjaActiva || null,
      };
    }

    const now = customCurrentDate || new Date();
    const dayOfWeek = now.getDay(); // 0: Domingo, 1-5: Lunes a Viernes, 6: Sábado
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentFranja: FranjaHoraria | undefined;
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      currentFranja = franjas.find((f) => f.tipoDia === 'semana');
    } else if (dayOfWeek === 6) {
      currentFranja = franjas.find((f) => f.tipoDia === 'sabado');
    } else {
      currentFranja = franjas.find((f) => f.tipoDia === 'domingo');
    }

    if (!currentFranja) {
      return {
        isOutOfService: false,
        badgeText: 'Horario regular',
        detail: '',
        franjaActiva: null,
      };
    }

    const [startH, startM] = currentFranja.inicio.split(':').map(Number);
    const [endH, endM] = currentFranja.termino.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // CA-2.2: Si la hora del teléfono supera la última salida de la micro
    const isPastEndTime = currentMinutes > endMinutes;
    const isBeforeStartTime = currentMinutes < startMinutes;
    const isOutOfService = isPastEndTime || isBeforeStartTime;

    const currentTimeFormatted = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isPastEndTime) {
      return {
        isOutOfService: true,
        badgeText: 'FUERA DE HORARIO',
        detail: `La última salida de hoy fue a las ${currentFranja.termino} hrs. La hora actual es ${currentTimeFormatted} hrs.`,
        franjaActiva: currentFranja,
      };
    } else if (isBeforeStartTime) {
      return {
        isOutOfService: true,
        badgeText: 'FUERA DE HORARIO',
        detail: `El servicio inicia hoy a las ${currentFranja.inicio} hrs. La hora actual es ${currentTimeFormatted} hrs.`,
        franjaActiva: currentFranja,
      };
    } else {
      return {
        isOutOfService: false,
        badgeText: 'EN SERVICIO',
        detail: `Operando hoy con normalidad hasta las ${currentFranja.termino} hrs.`,
        franjaActiva: currentFranja,
      };
    }
  }, [data, franjas, customCurrentDate]);

  return (
    <Card
      className={`my-3 overflow-hidden shadow-lg border-2 text-left w-full transition-all ${
        statusInfo.isOutOfService
          ? 'border-red-500 bg-white ring-2 ring-red-300'
          : 'border-teal-700 bg-white ring-1 ring-teal-200'
      }`}
      aria-label="Tarjeta de límites de horario de operación de transporte"
    >
      {/* Cabecera adaptada con tokens de Figma */}
      <CardHeader
        className="px-5 py-3.5 flex flex-row items-center justify-between text-white border-b"
        style={{
          backgroundColor: statusInfo.isOutOfService ? '#991B1B' : '#075E54',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Bus size={26} className="text-white flex-shrink-0" />
          <CardTitle
            className="font-extrabold text-white tracking-wide"
            style={{ fontSize: '21px', lineHeight: '1.2' }}
          >
            Horarios de Salida
          </CardTitle>
        </div>
        <Clock size={24} className="text-white opacity-95 flex-shrink-0" />
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
        {/* CA-2.2: Advertencia visual inmediata de 'Fuera de Horario' */}
        {statusInfo.isOutOfService ? (
          <div
            className="p-3.5 rounded-xl flex items-start gap-3.5 border-2 border-red-500"
            style={{ backgroundColor: '#FEF2F2' }}
            role="alert"
          >
            <AlertTriangle
              size={32}
              className="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="destructive"
                  className="font-black px-3 py-1 text-white tracking-wider"
                  style={{ fontSize: '18px' }}
                >
                  ⚠️ {statusInfo.badgeText}
                </Badge>
              </div>
              <p
                className="font-bold text-red-950 mt-1.5"
                style={{ fontSize: '18px', lineHeight: '1.4' }}
              >
                {statusInfo.detail}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="p-3.5 rounded-xl flex items-center gap-3.5 border-2 border-green-500"
            style={{ backgroundColor: '#F0FDF4' }}
          >
            <CheckCircle
              size={30}
              className="text-green-600 flex-shrink-0"
            />
            <div className="flex-1">
              <Badge
                className="bg-green-700 hover:bg-green-800 text-white font-black px-3 py-1 tracking-wider"
                style={{ fontSize: '18px' }}
              >
                🟢 {statusInfo.badgeText}
              </Badge>
              <p
                className="font-bold text-green-950 mt-1"
                style={{ fontSize: '18px', lineHeight: '1.35' }}
              >
                {statusInfo.detail}
              </p>
            </div>
          </div>
        )}

        {/* Identificación de Línea con mínimo 18px */}
        <div className="border-b pb-2">
          <p
            className="font-extrabold text-gray-900 leading-snug"
            style={{ fontSize: '19px' }}
          >
            🚌 {linea}
          </p>
          {empresa && (
            <p className="text-gray-600 font-medium" style={{ fontSize: '16px' }}>
              {empresa}
            </p>
          )}
        </div>

        {/* CA-2.1: Mostrar el 100% de los horarios de inicio y término para días de semana, sábados y domingos */}
        {/* CA-2.3: El texto del horario debe tener un tamaño mínimo de 18 píxeles */}
        <div className="flex flex-col gap-3">
          {franjas.map((franja) => {
            const isToday = statusInfo.franjaActiva?.tipoDia === franja.tipoDia;
            return (
              <div
                key={franja.tipoDia}
                className={`p-3.5 rounded-xl border-2 transition-all ${
                  isToday
                    ? 'border-teal-600 bg-teal-50/70 shadow-sm'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar
                      size={22}
                      className={isToday ? 'text-teal-700' : 'text-gray-600'}
                    />
                    <span
                      className="font-black text-gray-900"
                      style={{ fontSize: '19px' }}
                    >
                      {franja.dias}
                    </span>
                  </div>
                  {isToday && (
                    <span
                      className="px-2.5 py-0.5 rounded-full font-bold text-white uppercase tracking-wider"
                      style={{
                        backgroundColor: '#128C7E',
                        fontSize: '14px',
                      }}
                    >
                      Hoy
                    </span>
                  )}
                </div>

                {/* Horarios de inicio y término con tamaño mínimo 18px garantizado (CA-2.3) */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  {/* Primera salida */}
                  <div
                    className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs"
                    style={{ fontSize: '18px' }}
                  >
                    <span
                      className="block text-gray-600 font-bold"
                      style={{ fontSize: '16px' }}
                    >
                      🌅 Primera salida:
                    </span>
                    <span
                      className="block font-black text-gray-900 mt-0.5"
                      style={{ fontSize: '21px' }}
                    >
                      {franja.inicio} hrs
                    </span>
                  </div>

                  {/* Última salida */}
                  <div
                    className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs"
                    style={{ fontSize: '18px' }}
                  >
                    <span
                      className="block text-gray-600 font-bold"
                      style={{ fontSize: '16px' }}
                    >
                      🌙 Última salida:
                    </span>
                    <span
                      className="block font-black text-gray-900 mt-0.5"
                      style={{ fontSize: '21px' }}
                    >
                      {franja.termino} hrs
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Consejo para el adulto mayor con tamaño de 18px */}
        <p
          className="text-gray-700 font-semibold italic bg-amber-50 p-3 rounded-lg border border-amber-200"
          style={{ fontSize: '18px', lineHeight: '1.4' }}
        >
          💡 <strong>Recomendación:</strong> Esté en el paradero unos 10 minutos antes de la hora indicada para esperar con calma y seguridad.
        </p>
      </CardContent>
    </Card>
  );
};

export default HorariosCard;
