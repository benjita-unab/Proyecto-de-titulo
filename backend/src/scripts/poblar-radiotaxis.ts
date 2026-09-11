import axios from 'axios';
import * as cheerio from 'cheerio';
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

export interface RadioTaxiScraped {
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

const URL_TODORADIOTAXI_LIMACHE = 'https://todoradiotaxi.cl/limache/';

// Contingencia local de alta fidelidad basada en datos de todoradiotaxi.cl/limache
const CONTINGENCIA_LIMACHE: RadioTaxiScraped[] = [
  {
    id_radiotaxi: 'TAXI-LIM-01',
    nombre_central: 'Radio Taxi Limache',
    telefono: '+56322626021',
    telefono_formateado: '(32) 262 6021',
    direccion_base: 'Porvenir 574, Limache',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: 'Lun a Dom 24 horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-LIM-02',
    nombre_central: 'Radio Taxi SindTrabTaxis Colectivo Ltda',
    telefono: '+56332256654',
    telefono_formateado: '(33) 256 654',
    direccion_base: 'Calle El Roble 1198, Limache',
    tarifa_base_estimada: '$2.500 - $3.200',
    horario_atencion: 'Lun a Dom de 08:00 a 20:00 hrs',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-LIM-03',
    nombre_central: 'Taxi Colectivos Juan Egaña – Limache',
    telefono: '+56332414613',
    telefono_formateado: '(33) 241 4613',
    direccion_base: 'Calle Los Álamos 816, Limache',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: 'Lun a Dom de 08:00 a 20:00 hrs',
    autorizada: true,
    activo: true,
  },
];

export async function extraerRadioTaxisWeb(): Promise<RadioTaxiScraped[]> {
  console.log(`📡 Conectando y extrayendo datos desde ${URL_TODORADIOTAXI_LIMACHE}...`);
  try {
    const response = await axios.get(URL_TODORADIOTAXI_LIMACHE, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const listaExtraida: RadioTaxiScraped[] = [];

    // todoradiotaxi.cl organiza cada central en un encabezado h2 seguido por una lista <ul> con items <li>
    $('h2').each((i, el) => {
      const rawTitulo = $(el).text().trim();
      if (
        !rawTitulo ||
        rawTitulo.toLowerCase().includes('todos los') ||
        rawTitulo.toLowerCase().includes('comunas cerca') ||
        rawTitulo.toLowerCase().includes('alrrededores')
      ) {
        return;
      }

      // Normalizar nombre de la central
      const nombreCentral = rawTitulo
        .replace(/–\s*Teléfono.*$/i, '')
        .replace(/–\s*Teléfonos.*$/i, '')
        .trim();

      let telefonoRaw = '';
      let direccion = '';
      let horario = '';
      let telHref = '';

      // Obtener el bloque siguiente hasta el próximo h2
      const nextElements = $(el).nextUntil('h2');

      nextElements.find('li').each((_, li) => {
        const text = $(li).text().trim();
        if (/Número de Teléfono:/i.test(text)) {
          telefonoRaw = text.replace(/Número de Teléfono:\s*/i, '').trim();
        } else if (/Dirección:/i.test(text)) {
          direccion = text.replace(/Dirección:\s*/i, '').trim();
        } else if (/Horario:/i.test(text)) {
          horario = text.replace(/Horario:\s*/i, '').trim();
        }
      });

      // Si no encontró por li, buscar en texto directo de los elementos
      if (!telefonoRaw || !direccion) {
        nextElements.each((_, elem) => {
          const lines = $(elem).text().split('\n').map((l) => l.trim());
          for (const line of lines) {
            if (/Número de Teléfono:/i.test(line) && !telefonoRaw) {
              telefonoRaw = line.replace(/.*Número de Teléfono:\s*/i, '').trim();
            }
            if (/Dirección:/i.test(line) && !direccion) {
              direccion = line.replace(/.*Dirección:\s*/i, '').trim();
            }
            if (/Horario:/i.test(line) && !horario) {
              horario = line.replace(/.*Horario:\s*/i, '').trim();
            }
          }
        });
      }

      const telLink = nextElements.find('a[href^="tel:"]').first();
      if (telLink.length > 0) {
        telHref = telLink.attr('href') || '';
      }

      if (nombreCentral && (telefonoRaw || telHref)) {
        // Limpiar número al formato E.164 directo para discado celular (+56...)
        let rawDigits = (telHref ? telHref.replace('tel:', '') : telefonoRaw).replace(/[^0-9]/g, '');
        
        let e164 = '';
        if (rawDigits.startsWith('56')) {
          e164 = `+${rawDigits}`;
        } else if (rawDigits.length === 8 || rawDigits.length === 9) {
          e164 = `+56${rawDigits}`;
        } else {
          e164 = `+56${rawDigits}`;
        }

        // Formato visual legible para el adulto mayor
        let telVisual = telefonoRaw;
        if (!telVisual) {
          telVisual = e164;
        }

        listaExtraida.push({
          id_radiotaxi: `TAXI-LIM-${String(listaExtraida.length + 1).padStart(2, '0')}`,
          nombre_central: nombreCentral,
          telefono: e164,
          telefono_formateado: telVisual.substring(0, 48),
          direccion_base: (direccion || 'Limache, Región de Valparaíso').substring(0, 250),
          tarifa_base_estimada: '$2.500 - $3.000',
          horario_atencion: (horario || '24 Horas').substring(0, 48),
          autorizada: true,
          activo: true,
        });
      }
    });

    if (listaExtraida.length >= 2) {
      console.log(`✅ Extracción web exitosa: se encontraron ${listaExtraida.length} centrales.`);
      return listaExtraida;
    }

    console.warn('⚠️ Pocos resultados desde la web. Usando contingencia oficial predeterminada.');
    return CONTINGENCIA_LIMACHE;
  } catch (error: any) {
    console.warn(`⚠️ Error al conectarse a la web (${error.message}). Aplicando contingencia de datos oficiales.`);
    return CONTINGENCIA_LIMACHE;
  }
}

export async function guardarRadioTaxisEnSupabase(datos: RadioTaxiScraped[]) {
  console.log(`💾 Guardando ${datos.length} centrales de radiotaxi en la tabla servicio_radiotaxi de Supabase...`);
  try {
    const { data, error } = await supabase
      .from('servicio_radiotaxi')
      .upsert(datos, { onConflict: 'id_radiotaxi' })
      .select();

    if (error) {
      console.error('❌ Error de Supabase al guardar servicio_radiotaxi:', error.message);
      return false;
    }

    console.log(`🎉 ¡Poblamiento completado! ${data?.length || 0} registros activos en Supabase.`);
    return true;
  } catch (err) {
    console.error('❌ Error inesperado guardando en Supabase:', err);
    return false;
  }
}

async function main() {
  console.log('=== EXTRACTOR AUTOMÁTICO DE INFORMACIÓN OFICIAL DE RADIOTAXIS (LIMACHE) ===');
  const datos = await extraerRadioTaxisWeb();
  await guardarRadioTaxisEnSupabase(datos);
}

if (require.main === module) {
  main();
}
