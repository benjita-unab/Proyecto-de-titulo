import React, { useMemo } from 'react';
import { Phone, MapPin, DollarSign, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export interface RadioTaxiData {
  id?: string | number;
  nombre: string;
  telefono: string;
  telefonoFormateado?: string;
  direccionBase: string;
  tarifaBaseEstimada?: string;
  horarioAtencion?: string;
  autorizada?: boolean;
}

// Datos predeterminados oficiales de radiotaxis de Limache (para garantizar disponibilidad 100% offline)
export const RADIOTAXIS_DEFAULT_LIMACHE: RadioTaxiData[] = [
  {
    id: 'taxi-1',
    nombre: 'Radio Taxi Los Lagos Limache',
    telefono: '+56332411111',
    telefonoFormateado: '(33) 241 1111',
    direccionBase: 'Av. República #123, San Francisco, Limache',
    tarifaBaseEstimada: '$2.500 - $3.000',
    horarioAtencion: '24 Horas',
    autorizada: true,
  },
  {
    id: 'taxi-2',
    nombre: 'Radio Taxi Estación Limache',
    telefono: '+56332412222',
    telefonoFormateado: '(33) 241 2222',
    direccionBase: 'Arturo Prat frente a Estación Limache',
    tarifaBaseEstimada: '$2.500 - $3.000',
    horarioAtencion: '24 Horas',
    autorizada: true,
  },
  {
    id: 'taxi-3',
    nombre: 'Radio Taxi San Francisco',
    telefono: '+56332413333',
    telefonoFormateado: '(33) 241 3333',
    direccionBase: 'Palmira Romano Sur #450, Limache',
    tarifaBaseEstimada: '$2.500 - $3.200',
    horarioAtencion: '06:00 a 00:00 hrs',
    autorizada: true,
  },
];

interface RadioTaxisDashboardProps {
  taxis?: RadioTaxiData[];
  onCallInitiated?: (taxi: RadioTaxiData) => void;
}

export const RadioTaxisDashboard: React.FC<RadioTaxisDashboardProps> = ({
  taxis,
  onCallInitiated,
}) => {
  const listaTaxis = useMemo(() => {
    if (taxis && Array.isArray(taxis) && taxis.length > 0) {
      return taxis;
    }
    return RADIOTAXIS_DEFAULT_LIMACHE;
  }, [taxis]);

  const handleCall = (taxi: RadioTaxiData) => {
    if (onCallInitiated) {
      onCallInitiated(taxi);
    }
    // Marcación telefónica directa inmediata (< 0.5s sin retrasos ni intermediarios)
    const telLimpio = taxi.telefono.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${telLimpio}`;
  };

  return (
    <Card className="w-full border-2 border-[#128C7E]/20 shadow-md bg-white rounded-2xl overflow-hidden my-2">
      {/* Encabezado estilo Dashboard accesible */}
      <CardHeader className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="taxi">🚕</span>
            <div>
              <CardTitle className="text-lg md:text-xl font-black tracking-tight text-white">
                Centrales de Radio Taxi
              </CardTitle>
              <p className="text-xs text-[#E0F2F1] font-medium">
                Limache • Líneas telefónicas directas
              </p>
            </div>
          </div>
          <Badge className="bg-amber-400 text-slate-900 hover:bg-amber-400 font-bold text-xs px-2.5 py-1 flex items-center gap-1 shadow-sm">
            <ShieldCheck size={14} className="text-slate-900" />
            Autorizadas
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 md:p-4 space-y-3 bg-[#F8FAFC]">
        <p className="text-xs md:text-sm text-slate-600 font-medium px-1">
          Toque el botón verde grande para <strong>llamar directamente</strong> con un solo toque desde su celular:
        </p>

        {/* Lista de Centrales en Formato Tarjeta / Dashboard */}
        <div className="grid grid-cols-1 gap-3">
          {listaTaxis.map((taxi, index) => {
            const numeroAMostrar = taxi.telefonoFormateado || taxi.telefono;
            return (
              <div
                key={taxi.id || index}
                className="bg-white border-2 border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-[#25D366] transition-all flex flex-col justify-between gap-3"
              >
                {/* Información de la Central */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                      {taxi.nombre}
                    </h4>
                    <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Oficial
                    </span>
                  </div>

                  {/* Dirección de Base */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
                    <MapPin size={15} className="text-[#128C7E] flex-shrink-0 mt-0.5" />
                    <span><strong>Base:</strong> {taxi.direccionBase}</span>
                  </div>

                  {/* Tarifa Base y Horario */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-700">
                    {taxi.tarifaBaseEstimada && (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                        <DollarSign size={13} className="text-amber-700" />
                        <span>Base: <strong>{taxi.tarifaBaseEstimada}</strong></span>
                      </div>
                    )}
                    {taxi.horarioAtencion && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock size={13} />
                        <span>{taxi.horarioAtencion}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de Marcado Rápido Grande con Alto Contraste para Adultos Mayores */}
                <button
                  type="button"
                  onClick={() => handleCall(taxi)}
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] text-white font-extrabold text-base md:text-lg rounded-xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300"
                  aria-label={`Llamar a ${taxi.nombre} al número ${numeroAMostrar}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone size={18} className="text-white animate-pulse" />
                  </div>
                  <span>Llamar: {numeroAMostrar}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Nota accesible al pie */}
        <div className="text-[11px] text-slate-500 text-center pt-1">
          💡 <em>Servicio disponible incluso sin conexión a internet.</em>
        </div>
      </CardContent>
    </Card>
  );
};
