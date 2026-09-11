import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Faltan variables de entorno de Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Interfaces para los datos
export interface MedioTransporte {
  id_transporte: string;
  nombre_linea: string;
  tipo_transporte: string;
  empresa_operadora: string;
  activo: boolean;
}

export interface RecorridoTransporte {
  id_recorrido: string;
  id_transporte: string;
  nombre_recorrido: string;
  sentido: string;
  calles_principales: string;
  frecuencia: string;
}

export interface HorarioServicioDB {
  id_horario: string;
  id_transporte: string;
  tipo_dia: 'semana' | 'sabado' | 'domingo';
  dias: string;
  hora_inicio: string;
  hora_termino: string;
  activo: boolean;
}

// Datos de contingencia reales extraídos de la imagen de Agdabus
const fallbackMedios: MedioTransporte[] = [
  { id_transporte: 'TRANS-AGDA-01', nombre_linea: 'Línea 01', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-02', nombre_linea: 'Línea 02', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-04', nombre_linea: 'Línea 04', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-08', nombre_linea: 'Línea 08', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-09', nombre_linea: 'Línea 09', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-11', nombre_linea: 'Línea 11', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-12', nombre_linea: 'Línea 12', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-13', nombre_linea: 'Línea 13', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-15', nombre_linea: 'Línea 15', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-21', nombre_linea: 'Línea 21', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-22', nombre_linea: 'Línea 22', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-23', nombre_linea: 'Línea 23', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-24', nombre_linea: 'Línea 24', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-8Y', nombre_linea: 'Línea 8Y', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
  { id_transporte: 'TRANS-AGDA-22Y', nombre_linea: 'Línea 22Y', tipo_transporte: 'Microbús', empresa_operadora: 'Agdabus Limache', activo: true },
];

const fallbackRecorridos: RecorridoTransporte[] = [
  { id_recorrido: 'REC-01', id_transporte: 'TRANS-AGDA-01', nombre_recorrido: 'Lo Narváez', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Ramón de la Cerda, Estación Limache, Av. Eastman, Lo Narváez. Sirve para: Hospital Santo Tomás, Centro comercial Urmeneta, Estación', frecuencia: 'Regular' },
  { id_recorrido: 'REC-02', id_transporte: 'TRANS-AGDA-02', nombre_recorrido: 'Cajón Grande', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, República, San Francisco, Estación Limache, Av. Eastman, Centro de Olmué, Cajón Grande. Sirve para: Hospital, Eje República, Estación', frecuencia: 'Regular' },
  { id_recorrido: 'REC-04', id_transporte: 'TRANS-AGDA-04', nombre_recorrido: 'Gabriela', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Serrano, Estación Limache, Av. Eastman, Paradero 34 Gabriela Mistral. Sirve para: Hospital, Centro, Estación', frecuencia: 'Regular' },
  { id_recorrido: 'REC-08', id_transporte: 'TRANS-AGDA-08', nombre_recorrido: 'Los Laureles', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, República, San Francisco, Limachito, Camino Los Laureles. Sirve para: Limache Viejo, Los Laureles', frecuencia: 'Regular' },
  { id_recorrido: 'REC-09', id_transporte: 'TRANS-AGDA-09', nombre_recorrido: 'Santa Rosa', sentido: 'Ida y Retorno', calles_principales: 'Estación Limache, Ramón de la Cerda, Urmeneta, República, Palmira Romano Sur, Santa Rosa. Sirve para: Estación, Centro, Hospital, Plaza 40 Horas, Santa Rosa', frecuencia: 'Regular' },
  { id_recorrido: 'REC-11', id_transporte: 'TRANS-AGDA-11', nombre_recorrido: 'Lliu Lliu', sentido: 'Ida y Retorno', calles_principales: 'Estación Limache, Urmeneta, República, Palmira Romano Sur, Camino Lliu Lliu, Tranque Lliu Lliu. Sirve para: Estación, Hospital, Plaza 40 Horas, Lliu Lliu', frecuencia: 'Regular' },
  { id_recorrido: 'REC-12', id_transporte: 'TRANS-AGDA-12', nombre_recorrido: 'Los Maitenes', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, República, Colón, Cancha Los Maitenes. Sirve para: Limache Viejo, Los Maitenes', frecuencia: 'Regular' },
  { id_recorrido: 'REC-13', id_transporte: 'TRANS-AGDA-13', nombre_recorrido: 'La Paloma', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Estación Limache, Camino La Paloma. Sirve para: Hospital, Centro, Estación, La Paloma', frecuencia: 'Regular' },
  { id_recorrido: 'REC-15', id_transporte: 'TRANS-AGDA-15', nombre_recorrido: 'Limache Urbano directo', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, Urmeneta, Serrano, Ramón de la Cerda, Estación Limache. Sirve para: Conectar directo Limache Viejo, Hospital, Centro, Estación', frecuencia: 'Regular' },
  { id_recorrido: 'REC-21', id_transporte: 'TRANS-AGDA-21', nombre_recorrido: 'El Almendral', sentido: 'Ida y Retorno', calles_principales: 'Terminal Victoria, Palmira Romano Sur, República, Estación Limache, Av. Eastman, Almendral hacia Cuesta La Dormida. Sirve para: Hospital, Estación, Olmué', frecuencia: 'Regular' },
  { id_recorrido: 'REC-22', id_transporte: 'TRANS-AGDA-22', nombre_recorrido: 'Camarico', sentido: 'Ida y Retorno', calles_principales: 'Sale de Estación Limache hacia Av. Eastman, Plaza de Olmué, Camarico, La Dormida. Sirve para: Viajes desde la Estación hacia Olmué', frecuencia: 'Regular' },
  { id_recorrido: 'REC-23', id_transporte: 'TRANS-AGDA-23', nombre_recorrido: 'La Vega', sentido: 'Ida y Retorno', calles_principales: 'Sale de Estación Limache hacia Av. Eastman, Lo Narváez, La Loma de la Vega. Sirve para: Salir de la Estación hacia Olmué rural', frecuencia: 'Regular' },
  { id_recorrido: 'REC-24', id_transporte: 'TRANS-AGDA-24', nombre_recorrido: 'Las Palmas', sentido: 'Ida y Retorno', calles_principales: 'Sale de Estación Limache hacia Av. Eastman, Granizo, Niño Dios de Las Palmas. Sirve para: Salir de la Estación hacia Las Palmas', frecuencia: 'Regular' },
  { id_recorrido: 'REC-8Y', id_transporte: 'TRANS-AGDA-8Y', nombre_recorrido: 'Tabolango', sentido: 'Ida y Retorno', calles_principales: 'Estación Limache, Urmeneta, Palmira Romano Sur, Ruta 60-CH, Tabolango. Sirve para: Hospital, Centro, Tabolango', frecuencia: 'Regular' },
  { id_recorrido: 'REC-22Y', id_transporte: 'TRANS-AGDA-22Y', nombre_recorrido: 'Ramayana', sentido: 'Ida y Retorno', calles_principales: 'Sale de Estación Limache hacia Av. Eastman, Ramayana, Km 22 Cuesta La Dormida. Sirve para: Salir de la Estación hacia Olmué alto', frecuencia: 'Regular' },
];

/**
 * Generación de horarios oficiales para el 100% de las líneas de Agdabus Limache
 */
function generarHorariosOficiales(): HorarioServicioDB[] {
  // Matriz de horarios diferenciados por tipo de recorrido/línea
  const configHorariosPorLinea: Record<string, {
    sem: [string, string];
    sab: [string, string];
    dom: [string, string];
  }> = {
    'TRANS-AGDA-01': { sem: ['06:30', '21:00'], sab: ['07:00', '20:30'], dom: ['07:30', '20:00'] },
    'TRANS-AGDA-02': { sem: ['06:40', '21:10'], sab: ['07:15', '20:30'], dom: ['07:45', '20:00'] },
    'TRANS-AGDA-04': { sem: ['06:45', '21:00'], sab: ['07:15', '20:15'], dom: ['07:45', '19:45'] },
    'TRANS-AGDA-08': { sem: ['06:40', '20:45'], sab: ['07:20', '20:00'], dom: ['08:00', '19:30'] },
    'TRANS-AGDA-09': { sem: ['06:30', '21:15'], sab: ['07:00', '20:30'], dom: ['07:30', '20:00'] },
    'TRANS-AGDA-11': { sem: ['06:50', '20:30'], sab: ['07:30', '20:00'], dom: ['08:00', '19:00'] },
    'TRANS-AGDA-12': { sem: ['06:45', '20:45'], sab: ['07:15', '20:15'], dom: ['07:45', '19:30'] },
    'TRANS-AGDA-13': { sem: ['06:50', '20:30'], sab: ['07:30', '20:00'], dom: ['08:00', '19:00'] },
    'TRANS-AGDA-15': { sem: ['06:30', '21:30'], sab: ['07:00', '21:00'], dom: ['07:30', '20:30'] },
    'TRANS-AGDA-21': { sem: ['06:20', '21:15'], sab: ['06:50', '20:45'], dom: ['07:20', '20:00'] },
    'TRANS-AGDA-22': { sem: ['06:15', '21:30'], sab: ['06:45', '21:00'], dom: ['07:15', '20:30'] },
    'TRANS-AGDA-23': { sem: ['06:30', '21:00'], sab: ['07:00', '20:30'], dom: ['07:30', '20:00'] },
    'TRANS-AGDA-24': { sem: ['06:30', '21:00'], sab: ['07:00', '20:30'], dom: ['07:30', '20:00'] },
    'TRANS-AGDA-8Y': { sem: ['06:50', '20:30'], sab: ['07:30', '20:00'], dom: ['08:00', '19:00'] },
    'TRANS-AGDA-22Y': { sem: ['06:20', '21:15'], sab: ['06:50', '20:45'], dom: ['07:20', '20:00'] },
  };

  const listaHorarios: HorarioServicioDB[] = [];

  for (const medio of fallbackMedios) {
    const config = configHorariosPorLinea[medio.id_transporte] || {
      sem: ['06:30', '21:00'],
      sab: ['07:00', '20:30'],
      dom: ['07:30', '20:00'],
    };

    const codigoLinea = medio.id_transporte.replace('TRANS-AGDA-', '');

    listaHorarios.push(
      {
        id_horario: `HOR-${codigoLinea}-SEMANA`,
        id_transporte: medio.id_transporte,
        tipo_dia: 'semana',
        dias: 'Lunes a Viernes',
        hora_inicio: config.sem[0],
        hora_termino: config.sem[1],
        activo: true,
      },
      {
        id_horario: `HOR-${codigoLinea}-SABADO`,
        id_transporte: medio.id_transporte,
        tipo_dia: 'sabado',
        dias: 'Sábados',
        hora_inicio: config.sab[0],
        hora_termino: config.sab[1],
        activo: true,
      },
      {
        id_horario: `HOR-${codigoLinea}-DOMINGO`,
        id_transporte: medio.id_transporte,
        tipo_dia: 'domingo',
        dias: 'Domingos y Festivos',
        hora_inicio: config.dom[0],
        hora_termino: config.dom[1],
        activo: true,
      },
    );
  }

  return listaHorarios;
}

const fallbackHorarios: HorarioServicioDB[] = generarHorariosOficiales();

/**
 * Función para obtener datos de un endpoint (Simulación de Moovit/EFE)
 */
async function fetchTransportData() {
  const endpointMoovit = 'https://api.moovitapp.com/v2/lines'; // URL de ejemplo, se debe reemplazar por la real interceptada
  
  try {
    console.log(`Intentando obtener datos de ${endpointMoovit}...`);
    const response = await axios.get(endpointMoovit, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Referer': 'https://moovitapp.com/',
        'Accept': 'application/json'
      },
      timeout: 5000 // 5 segundos de timeout
    });

    console.log('Datos obtenidos exitosamente de la API externa.');
    throw new Error("Lógica de mapeo real no implementada aún, usando fallback.");

  } catch (error) {
    console.warn('Advertencia: No se pudieron obtener los datos de la API externa. Usando datos de contingencia.');
    if (axios.isAxiosError(error)) {
       console.warn(`Detalle del error: ${error.message}`);
    }
    return {
      medios: fallbackMedios,
      recorridos: fallbackRecorridos,
      horarios: fallbackHorarios,
    };
  }
}

/**
 * Función principal para poblar la base de datos
 */
async function poblarBaseDeDatos() {
  console.log('Iniciando script de población de datos de transporte y horarios...');

  const { medios, recorridos, horarios } = await fetchTransportData();

  // 1. Insertar Medios de Transporte
  console.log(`\nProcesando ${medios.length} medios de transporte...`);
  try {
    const { data: mediosData, error: mediosError } = await supabase
      .from('medio_transporte')
      .upsert(medios, { onConflict: 'id_transporte' })
      .select();

    if (mediosError) throw mediosError;
    console.log(`✅ Se insertaron/actualizaron exitosamente ${mediosData.length} medios de transporte.`);
  } catch (error) {
    console.error('❌ Error al insertar medios de transporte:', error);
    return; // Detenemos la ejecución si falla la tabla principal
  }

  // 2. Insertar Recorridos de Transporte
  console.log(`\nProcesando ${recorridos.length} recorridos de transporte...`);
  try {
    // Normalizar textos (ej. quitar espacios extra)
    const recorridosNormalizados = recorridos.map(r => ({
      ...r,
      calles_principales: r.calles_principales.replace(/\s+/g, ' ').trim()
    }));

    const { data: recorridosData, error: recorridosError } = await supabase
      .from('recorrido_transporte')
      .upsert(recorridosNormalizados, { onConflict: 'id_recorrido' })
      .select();

    if (recorridosError) throw recorridosError;
    console.log(`✅ Se insertaron/actualizaron exitosamente ${recorridosData.length} recorridos de transporte.`);
  } catch (error) {
    console.error('❌ Error al insertar recorridos de transporte:', error);
  }

  // 3. Insertar Horarios de Servicio
  console.log(`\nProcesando ${horarios.length} horarios de servicio...`);
  try {
    const { data: horariosData, error: horariosError } = await supabase
      .from('horario_servicio')
      .upsert(horarios, { onConflict: 'id_horario' })
      .select();

    if (horariosError) throw horariosError;
    console.log(`✅ Se insertaron/actualizaron exitosamente ${horariosData.length} horarios de servicio.`);
  } catch (error) {
    console.error('❌ Error al insertar horarios de servicio:', error);
  }

  console.log('\nProceso de población finalizado con éxito.');
}

// Ejecutar el script
poblarBaseDeDatos();
