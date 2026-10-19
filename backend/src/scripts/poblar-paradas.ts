import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { CATALOGO_PARADAS_MARGA_MARGA } from '../transport/geo/paradas-catalogo';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function poblarParadas() {
  console.log('Iniciando sincronización de paradas y puntos seguros (HU #3 Tarea 4)...');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Advertencia: Supabase no configurado. Catálogo disponible para contingencia.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const payload = CATALOGO_PARADAS_MARGA_MARGA.map((p) => ({
    id_parada: p.idParada,
    codigo_parada: p.codigoParada,
    nombre: p.nombre,
    direccion: p.direccion,
    latitud: p.latitud,
    longitud: p.longitud,
    comuna: p.comuna,
    es_punto_seguro: p.esPuntoSeguro,
    tipo_parada: p.tipoParada,
    lineas_asociadas: p.lineasAsociadas,
    activo: true,
  }));

  const { data, error } = await supabase
    .from('parada')
    .upsert(payload, { onConflict: 'id_parada' })
    .select();

  if (error) {
    console.error('Error insertando paradas en Supabase:', error.message);
  } else {
    console.log(`✅ ${data?.length || payload.length} paradas sincronizadas exitosamente.`);
  }
}

if (require.main === module) {
  poblarParadas();
}
