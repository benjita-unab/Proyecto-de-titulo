import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

export interface RadioTaxiCandidate {
  id_radiotaxi: string;
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
  verificado: boolean;
  fuente_url: string;
  evidencia_fuente: string;
  fecha_verificacion: string | null;
}

const FUENTE_AMARILLAS = 'https://www.amarillas.cl/b/taxis/quilpue';

const CAMPOS_PENDIENTES = {
  comuna: 'Quilpué',
  tarifa_base_estimada: 'No publicada',
  tarifa_minima: 0,
  tarifa_por_km: 0,
  recargo_nocturno: 0,
  maletero_silla_ruedas: false,
  autorizada: false,
  activo: false,
  verificado: false,
  fecha_verificacion: null,
};

export const CANDIDATOS_RADIOTAXI_QUILPUE: RadioTaxiCandidate[] = [
  {
    ...CAMPOS_PENDIENTES,
    id_radiotaxi: 'TAXI-QLP-MERCURIO',
    nombre_central: 'Radio Taxi Mercurio',
    telefono: '+56992266678',
    telefono_formateado: '(+56 9) 9226 6678',
    direccion_base: 'Quilpué (dirección base no publicada)',
    horario_atencion: '24/7 declarado; confirmar',
    fuente_url: 'https://radiotaximercurio.cl/contacto-y-reservas/',
    evidencia_fuente:
      'La web de la empresa publica este teléfono, indica atención 24/7 y cobertura desde Quilpué. No acredita autorización RNSTP ni tarifa.',
  },
  {
    ...CAMPOS_PENDIENTES,
    id_radiotaxi: 'TAXI-QLP-VICENEXPRESS',
    nombre_central: 'Radio Taxi Vicenexpress',
    telefono: '+56322128940',
    telefono_formateado: '(32) 212 8940',
    direccion_base: 'Pje Volcán Pucón 2584, Quilpué',
    horario_atencion: 'No publicada',
    fuente_url: 'https://www.amarillas.cl/fichas/radio-taxi-vicenexpress_15457643/',
    evidencia_fuente:
      'Páginas Amarillas lista el nombre, dirección y sitio web vicenexpress.com; el teléfono aparece en su directorio de taxis de Quilpué. Requiere confirmación directa.',
  },
  {
    ...CAMPOS_PENDIENTES,
    id_radiotaxi: 'TAXI-QLP-TRANSPORTE-PRIVADO',
    nombre_central: 'Radio Taxi Transporte Privado 24 Horas',
    telefono: '+56997996241',
    telefono_formateado: '(+56 9) 9799 6241',
    direccion_base: 'Lago Lanalhue 2405, Quilpué',
    horario_atencion: 'Ficha: L-V 09:00-17:00; confirmar',
    fuente_url: 'https://www.amarillas.cl/fichas/radio-taxi-transporte-privado-24-horas_15670403',
    evidencia_fuente:
      'Páginas Amarillas publica el nombre, teléfono y dirección; la misma ficha muestra atención L-V 09:00-17:00 y cerrado fines de semana, en conflicto con “24 Horas”.',
  },
  {
    ...CAMPOS_PENDIENTES,
    id_radiotaxi: 'TAXI-QLP-RAUL-ESTAY',
    nombre_central: 'Radio Taxis Raul Estay',
    telefono: '+56992571755',
    telefono_formateado: '(+56 9) 9257 1755',
    direccion_base: 'Quilpué (dirección no informada)',
    horario_atencion: 'No publicada',
    fuente_url: FUENTE_AMARILLAS,
    evidencia_fuente:
      'Páginas Amarillas lista este nombre y teléfono en Quilpué; no muestra dirección ni horario en el resultado consultado.',
  },
  {
    ...CAMPOS_PENDIENTES,
    id_radiotaxi: 'TAXI-QLP-CALL-TAXI-EXPRESS',
    nombre_central: 'Call Taxi Express Ejecutivo',
    telefono: '+56989795644',
    telefono_formateado: '(+56 9) 8979 5644',
    direccion_base: 'Quilpué (dirección por confirmar)',
    horario_atencion: 'No publicada',
    fuente_url: 'https://chiletaxis.cl/transporte/call-taxi-express-ejecutivo-vina-del-mar-4486',
    evidencia_fuente:
      'ChileTaxis lo lista con este teléfono y ubicación registrada en Quilpué, pero el nombre de la ficha también menciona Viña del Mar; requiere confirmar comuna y operador.',
  },
];

export async function poblarRadioTaxis() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from('servicio_radiotaxi')
    .upsert(CANDIDATOS_RADIOTAXI_QUILPUE, {
      onConflict: 'id_radiotaxi',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`No se pudieron guardar candidatos de radiotaxi: ${error.message}`);
  }

  console.log(`${CANDIDATOS_RADIOTAXI_QUILPUE.length} candidatos guardados como inactivos y no verificados.`);
}

if (require.main === module) {
  poblarRadioTaxis().catch((error) => {
    console.error('Error poblando candidatos de radiotaxi:', error.message);
    process.exitCode = 1;
  });
}
