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
interface MedioTransporte {
  id_transporte: string;
  nombre_linea: string;
  tipo_transporte: string;
  empresa_operadora: string;
  activo: boolean;
}

interface RecorridoTransporte {
  id_recorrido: string;
  id_transporte: string;
  nombre_recorrido: string;
  sentido: string;
  calles_principales: string;
  frecuencia: string;
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
  { id_recorrido: 'REC-01', id_transporte: 'TRANS-AGDA-01', nombre_recorrido: 'Lo Narváez (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Paradero 45', frecuencia: 'Regular' },
  { id_recorrido: 'REC-02', id_transporte: 'TRANS-AGDA-02', nombre_recorrido: 'Cajón Grande (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Cajón Grande', frecuencia: 'Regular' },
  { id_recorrido: 'REC-04', id_transporte: 'TRANS-AGDA-04', nombre_recorrido: 'Gabriela (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Paradero 34', frecuencia: 'Regular' },
  { id_recorrido: 'REC-08', id_transporte: 'TRANS-AGDA-08', nombre_recorrido: 'Los Laureles (Limachito)', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Los Laureles', frecuencia: 'Regular' },
  { id_recorrido: 'REC-09', id_transporte: 'TRANS-AGDA-09', nombre_recorrido: 'Santa Rosa (República)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia Santa Rosa', frecuencia: 'Regular' },
  { id_recorrido: 'REC-11', id_transporte: 'TRANS-AGDA-11', nombre_recorrido: 'LliuLliu (República)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia Tranque Lliu Lliu', frecuencia: 'Regular' },
  { id_recorrido: 'REC-12', id_transporte: 'TRANS-AGDA-12', nombre_recorrido: 'Los Maitenes', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Cancha Maitenes', frecuencia: 'Regular' },
  { id_recorrido: 'REC-13', id_transporte: 'TRANS-AGDA-13', nombre_recorrido: 'La Paloma', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Paradero 8 Alto', frecuencia: 'Regular' },
  { id_recorrido: 'REC-15', id_transporte: 'TRANS-AGDA-15', nombre_recorrido: 'Limache', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Estación Limache', frecuencia: 'Regular' },
  { id_recorrido: 'REC-21', id_transporte: 'TRANS-AGDA-21', nombre_recorrido: 'El Almendral (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Terminal Victoria hacia Almendral La Dormida', frecuencia: 'Regular' },
  { id_recorrido: 'REC-22', id_transporte: 'TRANS-AGDA-22', nombre_recorrido: 'Camarico (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia La Dormida', frecuencia: 'Regular' },
  { id_recorrido: 'REC-23', id_transporte: 'TRANS-AGDA-23', nombre_recorrido: 'La Vega (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia La Loma de la Vega', frecuencia: 'Regular' },
  { id_recorrido: 'REC-24', id_transporte: 'TRANS-AGDA-24', nombre_recorrido: 'Las Palmas (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia Niño Dios Las Palmas', frecuencia: 'Regular' },
  { id_recorrido: 'REC-8Y', id_transporte: 'TRANS-AGDA-8Y', nombre_recorrido: 'Tabolango (Los Laureles)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia Tabolango', frecuencia: 'Regular' },
  { id_recorrido: 'REC-22Y', id_transporte: 'TRANS-AGDA-22Y', nombre_recorrido: 'Ramayana (Olmué)', sentido: 'Ida y Retorno', calles_principales: 'Desde Estación Limache hacia Kilómetro 22 Cuesta La Dormida', frecuencia: 'Regular' },
];

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
    // Aquí iría la lógica real de transformación de response.data
    // Para efectos del script, simulamos que transformamos los datos a nuestras interfaces
    
    // Si la API respondiera correctamente, devolveríamos los datos transformados.
    // Como es un endpoint simulado que probablemente falle o no devuelva el formato exacto, lanzamos un error para usar fallback en este ejemplo,
    // o puedes implementar el mapeo real aquí.
    throw new Error("Lógica de mapeo real no implementada aún, usando fallback.");

  } catch (error) {
    console.warn('Advertencia: No se pudieron obtener los datos de la API externa. Usando datos de contingencia.');
    if (axios.isAxiosError(error)) {
       console.warn(`Detalle del error: ${error.message}`);
    }
    return {
      medios: fallbackMedios,
      recorridos: fallbackRecorridos
    };
  }
}

/**
 * Función principal para poblar la base de datos
 */
async function poblarBaseDeDatos() {
  console.log('Iniciando script de población de datos de transporte...');

  const { medios, recorridos } = await fetchTransportData();

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

  console.log('\nProceso finalizado.');
}

// Ejecutar el script
poblarBaseDeDatos();
