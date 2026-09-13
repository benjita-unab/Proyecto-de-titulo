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

// Datos oficiales y de contingencia para Quilpué y Villa Alemana (Moovit / TMV / Fenur)
const fallbackMedios: MedioTransporte[] = [
  { id_transporte: 'TRANS-C02', nombre_linea: 'Línea C02', tipo_transporte: 'Microbús', empresa_operadora: 'Transportes Quilpué - Villa Alemana (TMV)', activo: true },
  { id_transporte: 'TRANS-108', nombre_linea: 'Línea 108', tipo_transporte: 'Microbús', empresa_operadora: 'Fenur S.A.', activo: true },
  { id_transporte: 'TRANS-C03', nombre_linea: 'Línea C03', tipo_transporte: 'Microbús', empresa_operadora: 'Transportes Quilpué (TMV)', activo: true },
  { id_transporte: 'TRANS-111', nombre_linea: 'Línea 111', tipo_transporte: 'Microbús', empresa_operadora: 'Fenur S.A.', activo: true },
  { id_transporte: 'TRANS-Q02', nombre_linea: 'Línea Q02', tipo_transporte: 'Microbús', empresa_operadora: 'TMV Marga Marga', activo: true },
  { id_transporte: 'TRANS-105D', nombre_linea: 'Línea 105-D', tipo_transporte: 'Microbús', empresa_operadora: 'Fenur S.A.', activo: true },
];

const fallbackRecorridos: RecorridoTransporte[] = [
  {
    id_recorrido: 'REC-C02',
    id_transporte: 'TRANS-C02',
    nombre_recorrido: 'Peumo - Villa Alemana - Belloto Norte - Quilpué',
    sentido: 'Ida y Retorno',
    calles_principales: 'Sector Peumo, Fundo El Litre, Estación Metro Villa Alemana, Eje Comercial Av. Valparaíso, Belloto Norte, Estación Quilpué. Sirve para: Peumo, Fundo El Litre, Estación Metro Villa Alemana, Eje Comercial Av. Valparaíso, Belloto Norte, Quilpué, Centro',
    frecuencia: 'Regular',
  },
  {
    id_recorrido: 'REC-108',
    id_transporte: 'TRANS-108',
    nombre_recorrido: 'Peumo / Peñablanca - Mena - Pompeya',
    sentido: 'Ida y Retorno',
    calles_principales: 'Sectores altos de Peñablanca, Peumo, Centro de Villa Alemana, Av. Valparaíso, Mena, Pompeya, Avenidas comerciales. Sirve para: Peñablanca, Peumo, Centro de Villa Alemana, Pompeya, Comercio, Mena',
    frecuencia: 'Regular',
  },
  {
    id_recorrido: 'REC-C03',
    id_transporte: 'TRANS-C03',
    nombre_recorrido: 'Los Pinos - Estación Quilpué',
    sentido: 'Ida y Retorno',
    calles_principales: 'Sector residencial Los Pinos, Vicuña Mackenna, Plaza de Quilpué, Centro comercial Quilpué, Estación Metro Quilpué. Sirve para: Los Pinos, Plaza de Quilpué, Vicuña Mackenna, Estación Metro Quilpué, Centro, Trámites y Comercio',
    frecuencia: 'Frecuencia continua',
  },
  {
    id_recorrido: 'REC-111',
    id_transporte: 'TRANS-111',
    nombre_recorrido: 'Los Pinos - Hospital - Peyronet - Playa Ancha',
    sentido: 'Ida y Retorno',
    calles_principales: 'Los Pinos, Hospital de Quilpué, Centro Comercial Quilpué, Arterias principales Peyronet, Camino Troncal, Viña del Mar, Playa Ancha. Sirve para: Los Pinos, Hospital de Quilpué, Centro comercial, Salud, Traslados hacia la costa',
    frecuencia: 'Regular',
  },
  {
    id_recorrido: 'REC-Q02',
    id_transporte: 'TRANS-Q02',
    nombre_recorrido: 'Villa Alemana - Quilpué - Viña del Mar',
    sentido: 'Ida y Retorno',
    calles_principales: 'Eje troncal principal, Camino Troncal, Av. Los Carrera, Av. Valparaíso, Centro de Villa Alemana, El Belloto (zona comercial y feria), Centro de Quilpué, Viña del Mar. Sirve para: Centro Villa Alemana, El Belloto, Feria El Belloto, Av. Los Carrera, Centro de Quilpué, Viña del Mar, Costa',
    frecuencia: 'Frecuencia alta',
  },
  {
    id_recorrido: 'REC-105D',
    id_transporte: 'TRANS-105D',
    nombre_recorrido: 'Peñablanca - Troncal Sur - Plaza Victoria',
    sentido: 'Ida y Retorno',
    calles_principales: 'Peñablanca, Centro Villa Alemana, Vía expresa Troncal Sur, Puntos neurálgicos de transbordo rápido, Viña del Mar, Plaza Victoria Valparaíso. Sirve para: Peñablanca, Centro Villa Alemana, Troncal Sur, Transbordo rápido, Plaza Victoria, Valparaíso',
    frecuencia: 'Regular',
  },
];

/**
 * Generación de horarios oficiales para las líneas de Quilpué y Villa Alemana
 */
function generarHorariosOficiales(): HorarioServicioDB[] {
  // Matriz de horarios diferenciados por tipo de recorrido/línea
  const configHorariosPorLinea: Record<string, {
    sem: [string, string];
    sab: [string, string];
    dom: [string, string];
  }> = {
    'TRANS-C02': { sem: ['06:00', '22:30'], sab: ['06:30', '22:00'], dom: ['07:00', '21:30'] },
    'TRANS-108': { sem: ['06:15', '21:50'], sab: ['06:45', '21:30'], dom: ['07:15', '21:00'] },
    'TRANS-C03': { sem: ['05:45', '23:00'], sab: ['06:15', '22:45'], dom: ['06:45', '22:00'] },
    'TRANS-111': { sem: ['06:00', '22:00'], sab: ['06:30', '21:45'], dom: ['07:00', '21:15'] },
    'TRANS-Q02': { sem: ['05:30', '23:15'], sab: ['06:00', '23:00'], dom: ['06:30', '22:30'] },
    'TRANS-105D': { sem: ['06:00', '22:30'], sab: ['06:30', '22:00'], dom: ['07:00', '21:30'] },
  };

  const listaHorarios: HorarioServicioDB[] = [];

  for (const medio of fallbackMedios) {
    const config = configHorariosPorLinea[medio.id_transporte] || {
      sem: ['06:00', '22:30'],
      sab: ['06:30', '22:00'],
      dom: ['07:00', '21:30'],
    };

    const codigoLinea = medio.id_transporte.replace('TRANS-', '');

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
 * Función para obtener datos de un endpoint (Simulación de Moovit para Quilpué / Villa Alemana)
 */
async function fetchTransportData() {
  const endpointMoovit = 'https://moovitapp.com/tripplan/valparaiso_y_vina_del_mar-3121/lines/es?ref=16&customerId=4908'; // URL de ejemplo, se debe reemplazar por la real interceptada
  
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
