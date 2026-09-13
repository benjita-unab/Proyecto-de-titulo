import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan credenciales en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function insertarHorariosVariasLineas() {
  console.log('Poblando horarios para el 100% de las líneas de transporte en Supabase...');

  const lineas = [
    {
      id_transporte: 'TRANS-C02', // Línea C02 (Peumo - Villa Alemana - Belloto Norte - Quilpué)
      prefix: 'HOR-C02',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:00', hora_termino: '22:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:30', hora_termino: '22:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:00', hora_termino: '21:30' },
      ],
    },
    {
      id_transporte: 'TRANS-108', // Línea 108 (Peumo / Peñablanca - Mena - Pompeya)
      prefix: 'HOR-108',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:15', hora_termino: '21:50' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:45', hora_termino: '21:30' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:15', hora_termino: '21:00' },
      ],
    },
    {
      id_transporte: 'TRANS-C03', // Línea C03 (Los Pinos - Estación Quilpué)
      prefix: 'HOR-C03',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '05:45', hora_termino: '23:00' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:15', hora_termino: '22:45' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '06:45', hora_termino: '22:00' },
      ],
    },
    {
      id_transporte: 'TRANS-111', // Línea 111 (Los Pinos - Hospital - Peyronet - Playa Ancha)
      prefix: 'HOR-111',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:00', hora_termino: '22:00' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:30', hora_termino: '21:45' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:00', hora_termino: '21:15' },
      ],
    },
    {
      id_transporte: 'TRANS-Q02', // Línea Q02 (Villa Alemana - Quilpué - Viña del Mar)
      prefix: 'HOR-Q02',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '05:30', hora_termino: '23:15' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:00', hora_termino: '23:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '06:30', hora_termino: '22:30' },
      ],
    },
    {
      id_transporte: 'TRANS-105D', // Línea 105-D (Peñablanca - Troncal Sur - Plaza Victoria)
      prefix: 'HOR-105D',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:00', hora_termino: '22:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:30', hora_termino: '22:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:00', hora_termino: '21:30' },
      ],
    },
  ];

  const rows: any[] = [];
  for (const l of lineas) {
    for (const h of l.horarios) {
      rows.push({
        id_horario: `${l.prefix}-${h.tipo_dia.toUpperCase()}`,
        id_transporte: l.id_transporte,
        tipo_dia: h.tipo_dia,
        dias: h.dias,
        hora_inicio: h.hora_inicio,
        hora_termino: h.hora_termino,
        activo: true,
      });
    }
  }

  const { data, error } = await supabase
    .from('horario_servicio')
    .upsert(rows, { onConflict: 'id_horario' })
    .select();

  if (error) {
    console.error('Error insertando horarios:', error);
  } else {
    console.log(`✅ Horarios insertados/actualizados exitosamente: ${data?.length} registros.`);
  }
}

insertarHorariosVariasLineas();
