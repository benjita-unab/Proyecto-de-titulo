import { createClient } from '@supabase/supabase-js';
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

async function limpiarBaseDeDatos() {
  console.log('Iniciando script de limpieza de datos de transporte...');

  try {
    // 1. Eliminar Horarios de Servicio primero (por la llave foránea con medio_transporte)
    console.log('Eliminando registros de horario_servicio...');
    const { error: horariosError } = await supabase
      .from('horario_servicio')
      .delete()
      .neq('id_horario', '0');

    if (horariosError) {
      console.warn('Advertencia al limpiar horario_servicio:', horariosError.message);
    } else {
      console.log('✅ Registros de horario_servicio eliminados.');
    }

    // 2. Eliminar Recorridos de Transporte (por la llave foránea con medio_transporte)
    console.log('Eliminando registros de recorrido_transporte...');
    const { error: recorridosError } = await supabase
      .from('recorrido_transporte')
      .delete()
      .neq('id_recorrido', '0'); // Condición dummy para eliminar todos

    if (recorridosError) throw recorridosError;
    console.log('✅ Registros de recorrido_transporte eliminados.');

    // 3. Eliminar Medios de Transporte
    console.log('Eliminando registros de medio_transporte...');
    const { error: mediosError } = await supabase
      .from('medio_transporte')
      .delete()
      .neq('id_transporte', '0'); // Condición dummy para eliminar todos

    if (mediosError) throw mediosError;
    console.log('✅ Registros de medio_transporte eliminados.');

    // 4. Eliminar Centrales de Radio Taxi
    console.log('Eliminando registros de servicio_radiotaxi...');
    const { error: taxisError } = await supabase
      .from('servicio_radiotaxi')
      .delete()
      .neq('id_radiotaxi', '0');

    if (taxisError) {
      console.warn('Advertencia al limpiar servicio_radiotaxi:', taxisError.message);
    } else {
      console.log('✅ Registros de servicio_radiotaxi eliminados.');
    }

    console.log('\n¡Limpieza finalizada exitosamente! La base de datos está vacía y lista para probar el script de poblamiento.');
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
  }
}

// Ejecutar el script
limpiarBaseDeDatos();
