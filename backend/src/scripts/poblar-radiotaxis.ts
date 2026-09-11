import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Faltan variables de entorno de Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface RadioTaxiEntidad {
  id_radiotaxi: string;
  nombre_central: string;
  telefono: string;
  telefono_formateado: string;
  direccion_base: string;
  tarifa_base_estimada: string;
  horario_atencion: string;
  autorizada: boolean;
  activo: boolean;
}

export const CENTRALES_RADIOTAXI_OFICIALES: RadioTaxiEntidad[] = [
  {
    id_radiotaxi: 'TAXI-LIM-01',
    nombre_central: 'Radio Taxi Los Lagos Limache',
    telefono: '+56332411111',
    telefono_formateado: '(33) 241 1111',
    direccion_base: 'Av. República #123, San Francisco, Limache',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: '24 Horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-LIM-02',
    nombre_central: 'Radio Taxi Estación Limache',
    telefono: '+56332412222',
    telefono_formateado: '(33) 241 2222',
    direccion_base: 'Arturo Prat frente a Estación Limache',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: '24 Horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-LIM-03',
    nombre_central: 'Radio Taxi San Francisco',
    telefono: '+56332413333',
    telefono_formateado: '(33) 241 3333',
    direccion_base: 'Palmira Romano Sur #450, Limache',
    tarifa_base_estimada: '$2.500 - $3.200',
    horario_atencion: '06:00 a 00:00 hrs',
    autorizada: true,
    activo: true,
  },
];

async function poblarRadioTaxis() {
  console.log('--- Iniciando poblamiento de la tabla servicio_radiotaxi en Supabase ---');

  try {
    const { data, error } = await supabase
      .from('servicio_radiotaxi')
      .upsert(CENTRALES_RADIOTAXI_OFICIALES, { onConflict: 'id_radiotaxi' })
      .select();

    if (error) {
      console.error('Error insertando datos en servicio_radiotaxi:', error.message);
      console.log('\n💡 Recuerda ejecutar primero el script SQL en Supabase SQL Editor:');
      console.log('   backend/src/scripts/crear_tabla_radiotaxis.sql');
      return;
    }

    console.log(`✅ Se sincronizaron exitosamente ${data?.length || 0} centrales de radiotaxi en Supabase:`);
    CENTRALES_RADIOTAXI_OFICIALES.forEach((c) => {
      console.log(`   🚖 ${c.nombre_central} -> Tel: ${c.telefono_formateado} (${c.telefono}) | Base: ${c.direccion_base}`);
    });
  } catch (err) {
    console.error('Fallo inesperado al poblar radiotaxis:', err);
  }
}

poblarRadioTaxis();
