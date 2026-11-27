/**
 * Modelo Único Unificado de MoviTech (TypeScript <-> Supabase PostgreSQL <-> SQLite)
 * Define el contrato canónico de datos para evitar divergencias entre scripts,
 * servicios de dominio y réplica local de contingencia.
 */

export type TipoTransporte = 'Microbús' | 'Colectivo' | 'Radio Taxi';
export type TipoDiaHorario = 'semana' | 'sabado' | 'domingo';

export interface MedioTransporteModel {
  id_transporte: string;
  nombre_linea: string;
  tipo_transporte: TipoTransporte;
  empresa_operadora: string;
  tarifa_general: number;
  tarifa_adulto_mayor: number;
  tarifa_escolar: number;
  accesible_silla_ruedas: boolean;
  tipo_prestacion: string;
  frecuencia_estimada: string;
  pasa_hospital_quilpue: boolean;
  activo: boolean;
}

export interface RecorridoTransporteModel {
  id_recorrido: string;
  id_transporte: string;
  nombre_recorrido: string;
  sentido: string;
  calles_principales: string;
  frecuencia: string;
  pasa_hospital_quilpue: boolean;
  activo: boolean;
  verificado?: boolean;
  fuente_url?: string | null;
  evidencia_fuente?: string | null;
  fecha_verificacion?: string | null;
}

export interface ColectivoModel {
  id_colectivo: string;
  id_transporte: string;
  numero_linea: string;
  nombre_linea: string;
  comuna: string;
  origen: string;
  destino: string;
  trazado_ida: string;
  trazado_regreso: string;
  frecuencia_minutos: number;
  horario_inicio: string;
  horario_termino: string;
  tarifa_diurna: number;
  tarifa_nocturna: number;
  tarifa_adulto_mayor: number;
  accesible_adulto_mayor: boolean;
  paraderos_principales: string;
  pasa_hospital_quilpue: boolean;
  activo: boolean;
  verificado?: boolean;
  fuente_url?: string | null;
  evidencia_fuente?: string | null;
  fecha_verificacion?: string | null;
}

export interface HorarioServicioModel {
  id_horario: string;
  id_transporte: string;
  tipo_dia: TipoDiaHorario;
  dias: string;
  hora_inicio: string;
  hora_termino: string;
  activo: boolean;
}

export interface ParadaModel {
  id_parada: string;
  codigo_parada: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  comuna: string;
  es_punto_seguro: boolean;
  tipo_parada: string;
  lineas_asociadas: string;
  activo: boolean;
  verificado?: boolean;
  fuente_url?: string | null;
  evidencia_fuente?: string | null;
  fecha_verificacion?: string | null;
}

export interface RecorridoParadaModel {
  id_recorrido_parada: string;
  id_recorrido: string;
  id_parada: string;
  orden: number;
}

export interface ServicioRadioTaxiModel {
  id_radiotaxi: string;
  id_transporte?: string | null;
  nombre_central: string;
  telefono: string;
  telefono_formateado: string;
  direccion_base: string;
  comuna: string;
  tarifa_base_estimada: string;
  tarifa_minima: number;
  tarifa_por_km: number;
  recargo_nocturno: number;
  maletero_silla_ruedas: boolean;
  horario_atencion: string;
  autorizada: boolean;
  activo: boolean;
  verificado?: boolean;
  fuente_url?: string | null;
  evidencia_fuente?: string | null;
  fecha_verificacion?: string | null;
}

export interface UnifiedSqliteSnapshot {
  rutas: RecorridoTransporteModel[];
  paradas: ParadaModel[];
  colectivos: ColectivoModel[];
  radiotaxis: ServicioRadioTaxiModel[];
  horarios: HorarioServicioModel[];
  medios?: MedioTransporteModel[];
  recorrido_parada?: RecorridoParadaModel[];
}
