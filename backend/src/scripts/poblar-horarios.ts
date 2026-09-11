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
      id_transporte: 'TRANS-AGDA-01', // Línea 01 (Lo Narváez / Hospital)
      prefix: 'HOR-01',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:30', hora_termino: '21:00' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:00', hora_termino: '20:30' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:30', hora_termino: '20:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-02', // Línea 02 (Cajón Grande / Olmué)
      prefix: 'HOR-02',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:40', hora_termino: '21:10' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:15', hora_termino: '20:30' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:45', hora_termino: '20:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-04', // Línea 04 (Gabriela Mistral)
      prefix: 'HOR-04',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:45', hora_termino: '21:00' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:15', hora_termino: '20:15' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:45', hora_termino: '19:45' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-08', // Línea 08 (Los Laureles)
      prefix: 'HOR-08',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:40', hora_termino: '20:45' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:20', hora_termino: '20:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '08:00', hora_termino: '19:30' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-09', // Línea 09 (Santa Rosa)
      prefix: 'HOR-09',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:30', hora_termino: '21:15' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:00', hora_termino: '20:30' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:30', hora_termino: '20:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-11', // Línea 11 (Lliu Lliu)
      prefix: 'HOR-11',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:50', hora_termino: '20:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:30', hora_termino: '20:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '08:00', hora_termino: '19:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-12', // Línea 12 (Los Maitenes)
      prefix: 'HOR-12',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:45', hora_termino: '20:45' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:15', hora_termino: '20:15' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:45', hora_termino: '19:30' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-13', // Línea 13 (La Paloma)
      prefix: 'HOR-13',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:50', hora_termino: '20:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:30', hora_termino: '20:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '08:00', hora_termino: '19:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-15', // Línea 15 (Limache Urbano Directo)
      prefix: 'HOR-15',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:30', hora_termino: '21:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:00', hora_termino: '21:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:30', hora_termino: '20:30' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-21', // Línea 21 (El Almendral)
      prefix: 'HOR-21',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:20', hora_termino: '21:15' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:50', hora_termino: '20:45' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:20', hora_termino: '20:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-22', // Línea 22 (Camarico / La Dormida)
      prefix: 'HOR-22',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:15', hora_termino: '21:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:45', hora_termino: '21:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:15', hora_termino: '20:30' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-23', // Línea 23 (La Vega)
      prefix: 'HOR-23',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:30', hora_termino: '21:00' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:00', hora_termino: '20:30' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:30', hora_termino: '20:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-24', // Línea 24 (Las Palmas)
      prefix: 'HOR-24',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:30', hora_termino: '21:00' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:00', hora_termino: '20:30' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:30', hora_termino: '20:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-8Y', // Línea 8Y (Tabolango)
      prefix: 'HOR-8Y',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:50', hora_termino: '20:30' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '07:30', hora_termino: '20:00' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '08:00', hora_termino: '19:00' },
      ],
    },
    {
      id_transporte: 'TRANS-AGDA-22Y', // Línea 22Y (Ramayana)
      prefix: 'HOR-22Y',
      horarios: [
        { tipo_dia: 'semana', dias: 'Lunes a Viernes', hora_inicio: '06:20', hora_termino: '21:15' },
        { tipo_dia: 'sabado', dias: 'Sábados', hora_inicio: '06:50', hora_termino: '20:45' },
        { tipo_dia: 'domingo', dias: 'Domingos y Festivos', hora_inicio: '07:20', hora_termino: '20:00' },
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
