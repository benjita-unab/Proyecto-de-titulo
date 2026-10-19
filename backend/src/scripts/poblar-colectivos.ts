import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface ColectivoSeedData {
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
  activo: boolean;
}

export const CATALOGO_COLECTIVOS_QUILPUE: ColectivoSeedData[] = [
  {
    id_colectivo: 'COL-QLP-01',
    id_transporte: 'TRANS-COL-01',
    numero_linea: 'Línea 1',
    nombre_linea: 'Línea 1 Belloto Norte - Quilpué Centro',
    comuna: 'Quilpué',
    origen: 'Belloto Norte (Tierras Rojas / Vía Férrea)',
    destino: 'Plaza de Quilpué / Estación Quilpué',
    trazado_ida: 'Belloto Norte, Av. Industrial, Av. Centenario, Carrera, Los Carrera, Plaza Manuel Blanco Encalada (Centro Quilpué)',
    trazado_regreso: 'Plaza Quilpué, Blanco, Los Carrera, Freire, Av. Industrial hacia Belloto Norte',
    frecuencia_minutos: 4,
    horario_inicio: '06:00',
    horario_termino: '23:00',
    tarifa_diurna: 850,
    tarifa_nocturna: 1100,
    tarifa_adulto_mayor: 600,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Garita Belloto Norte, Estación Belloto, Cruce Industrial, Plaza de Quilpué, Estación Metro Quilpué',
    activo: true,
  },
  {
    id_colectivo: 'COL-QLP-02',
    id_transporte: 'TRANS-COL-02',
    numero_linea: 'Línea 2',
    nombre_linea: 'Línea 2 Belloto Sur - Pompeya - Quilpué Centro',
    comuna: 'Quilpué',
    origen: 'Belloto Sur / Pompeya Sur',
    destino: 'Plaza Municipal de Quilpué',
    trazado_ida: 'Pompeya Sur, Av. El Sol, Baden Powell, Ramón Ángel Jara, Freire, Blanco Encalada',
    trazado_regreso: 'Centro Quilpué, Los Carrera, Freire, Ramón Ángel Jara, Av. El Sol hacia Belloto Sur',
    frecuencia_minutos: 5,
    horario_inicio: '06:15',
    horario_termino: '22:45',
    tarifa_diurna: 850,
    tarifa_nocturna: 1100,
    tarifa_adulto_mayor: 600,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Feria El Belloto, Baden Powell con El Sol, Supermercado Santa Isabel Freire, Plaza Quilpué',
    activo: true,
  },
  {
    id_colectivo: 'COL-QLP-03',
    id_transporte: 'TRANS-COL-03',
    numero_linea: 'Línea 3',
    nombre_linea: 'Línea 3 Los Pinos - Quilpué Centro',
    comuna: 'Quilpué',
    origen: 'Sector Residencial Los Pinos / Marga Marga',
    destino: 'Estación Metro Quilpué / Centro Comercial',
    trazado_ida: 'Los Pinos, Av. Marga Marga, Vicuña Mackenna, Claudio Vicuña, Los Carrera, Estación Quilpué',
    trazado_regreso: 'Estación Quilpué, Diego Portales, Av. Marga Marga hacia Los Pinos',
    frecuencia_minutos: 3,
    horario_inicio: '05:45',
    horario_termino: '23:15',
    tarifa_diurna: 900,
    tarifa_nocturna: 1200,
    tarifa_adulto_mayor: 650,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Plaza Los Pinos, Terminal Los Pinos, Cesfam Marga Marga, Plaza Quilpué, Estación Quilpué',
    activo: true,
  },
  {
    id_colectivo: 'COL-QLP-04',
    id_transporte: 'TRANS-COL-04',
    numero_linea: 'Línea 4',
    nombre_linea: 'Línea 4 Hospital de Quilpué - Valencia',
    comuna: 'Quilpué',
    origen: 'Sector Valencia / Camino Troncal',
    destino: 'Hospital de Quilpué (San Martín)',
    trazado_ida: 'Valencia, Av. Los Carrera, Centro Quilpué, Peyronet, Calle San Martín, Hospital de Quilpué',
    trazado_regreso: 'Hospital de Quilpué, San Martín, Freire, Av. Los Carrera retorno a Valencia',
    frecuencia_minutos: 5,
    horario_inicio: '06:00',
    horario_termino: '22:00',
    tarifa_diurna: 800,
    tarifa_nocturna: 1000,
    tarifa_adulto_mayor: 550,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Garita Valencia, Paradero 28 Troncal, Estación Quilpué, Entrada Principal Hospital de Quilpué',
    activo: true,
  },
  {
    id_colectivo: 'COL-QLP-05',
    id_transporte: 'TRANS-COL-05',
    numero_linea: 'Línea 5',
    nombre_linea: 'Línea 5 El Retiro - Cumming - Centro Quilpué',
    comuna: 'Quilpué',
    origen: 'El Retiro Alto / Cerro La Cruz',
    destino: 'Plaza Municipal de Quilpué',
    trazado_ida: 'El Retiro, Av. Cumming, San Martín, Esmeralda, Los Carrera, Centro',
    trazado_regreso: 'Centro Quilpué, Diego Portales, San Martín, Cumming hacia El Retiro',
    frecuencia_minutos: 6,
    horario_inicio: '06:30',
    horario_termino: '22:00',
    tarifa_diurna: 800,
    tarifa_nocturna: 1000,
    tarifa_adulto_mayor: 550,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Terminal El Retiro, Colegio Cumming, Consultorio Pomar, Plaza de Quilpué',
    activo: true,
  },
  {
    id_colectivo: 'COL-QLP-06',
    id_transporte: 'TRANS-COL-06',
    numero_linea: 'Línea 6',
    nombre_linea: 'Línea 6 Colinas de Oro - Centro Quilpué',
    comuna: 'Quilpué',
    origen: 'Colinas de Oro / Cumbres de Quilpué',
    destino: 'Estación Metro Quilpué',
    trazado_ida: 'Colinas de Oro, Eje Principal Colinas, Los Pinos enlace, Marga Marga, Los Carrera, Centro',
    trazado_regreso: 'Centro Quilpué, Freire, Av. Marga Marga hacia Colinas de Oro',
    frecuencia_minutos: 5,
    horario_inicio: '06:15',
    horario_termino: '22:30',
    tarifa_diurna: 900,
    tarifa_nocturna: 1150,
    tarifa_adulto_mayor: 650,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Rotonda Colinas de Oro, Cruce Los Pinos, Supermercado Lider Quilpué, Estación Quilpué',
    activo: true,
  },
  {
    id_colectivo: 'COL-QLP-08',
    id_transporte: 'TRANS-COL-08',
    numero_linea: 'Línea 8',
    nombre_linea: 'Línea 8 Sol del Pacífico - Paso Hondo - Quilpué',
    comuna: 'Quilpué',
    origen: 'Paso Hondo / Universidad Técnica',
    destino: 'Plaza de Quilpué / Eje Hospital',
    trazado_ida: 'Paso Hondo, Camino Troncal, Valencia, Los Carrera, Peyronet, San Martín',
    trazado_regreso: 'San Martín, Freire, Camino Troncal hacia Paso Hondo',
    frecuencia_minutos: 6,
    horario_inicio: '06:30',
    horario_termino: '22:15',
    tarifa_diurna: 850,
    tarifa_nocturna: 1100,
    tarifa_adulto_mayor: 600,
    accesible_adulto_mayor: true,
    paraderos_principales: 'Sede Universitaria Paso Hondo, Paradero 24 Troncal, Plaza Quilpué, Hospital Quilpué',
    activo: true,
  },
];

async function poblarColectivos() {
  console.log('Iniciando seed de colectivos de Quilpué (HU #5)...');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Advertencia: Sin credenciales Supabase. Catálogo validado para contingencia offline.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Asegurar medios de transporte correspondientes (idempotente)
  const mediosColectivo = CATALOGO_COLECTIVOS_QUILPUE.map((c) => ({
    id_transporte: c.id_transporte,
    nombre_linea: c.numero_linea + ' (Colectivo)',
    tipo_transporte: 'Colectivo',
    empresa_operadora: `Asociación Gremial Colectivos Quilpué - ${c.numero_linea}`,
    activo: true,
  }));

  const { error: errorMedios } = await supabase
    .from('medio_transporte')
    .upsert(mediosColectivo, { onConflict: 'id_transporte' });

  if (errorMedios) {
    console.error('Error insertando medios_transporte para colectivos:', errorMedios.message);
  } else {
    console.log(`✅ ${mediosColectivo.length} medios de transporte (Colectivo) sincronizados.`);
  }

  // 2. Insertar/actualizar catálogo en tabla colectivo
  const { data, error } = await supabase
    .from('colectivo')
    .upsert(CATALOGO_COLECTIVOS_QUILPUE, { onConflict: 'id_colectivo' })
    .select();

  if (error) {
    console.error('Error poblando tabla colectivo en Supabase:', error.message);
  } else {
    console.log(`✅ ${data?.length || CATALOGO_COLECTIVOS_QUILPUE.length} colectivos sincronizados exitosamente.`);
  }
}

if (require.main === module) {
  poblarColectivos();
}
