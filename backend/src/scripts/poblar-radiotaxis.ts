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

const URL_TODORADIOTAXI_VILLA_ALEMANA = 'https://todoradiotaxi.cl/villa-alemana/';
const URL_AMARILLAS_QUILPUE = 'https://www.amarillas.cl/b/radio-taxi-las-24-horas/quilpue';

// Contingencia local de alta fidelidad basada en datos de TodoRadioTaxi Villa Alemana y Páginas Amarillas Quilpué
const CONTINGENCIA_MARGA_MARGA: RadioTaxiScraped[] = [
  {
    id_radiotaxi: 'TAXI-VLM-01',
    nombre_central: 'Radio Taxi Aracis Vía',
    telefono: '+56989005971',
    telefono_formateado: '(+56 9) 8900 5971',
    direccion_base: 'Madrid 2594, Villa Alemana',
    tarifa_base_estimada: '$2.500 - $3.200',
    horario_atencion: 'Lun a Dom 24 horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-VLM-02',
    nombre_central: 'Radio Taxi Cartagena',
    telefono: '+56956327251',
    telefono_formateado: '(+56 9) 5632 7251',
    direccion_base: 'Covadonga 246, Villa Alemana',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: 'Lun a Dom 24 horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-VLM-03',
    nombre_central: 'Radio Taxi Villa Alemana C & B',
    telefono: '+56323176457',
    telefono_formateado: '(32) 317 6457',
    direccion_base: 'Los Peumos 2140, Villa Alemana',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: 'Lun a Dom 24 horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-QLP-01',
    nombre_central: 'Taxiexpress Quilpué',
    telefono: '+56989795644',
    telefono_formateado: '(+56 9) 8979 5644',
    direccion_base: 'Pje Campo Lindo 2695, Quilpué',
    tarifa_base_estimada: '$2.500 - $3.200',
    horario_atencion: 'Lun a Dom 24 horas',
    autorizada: true,
    activo: true,
  },
  {
    id_radiotaxi: 'TAXI-QLP-02',
    nombre_central: 'Radio Taxi Transporte Privado 24 Horas',
    telefono: '+56997996241',
    telefono_formateado: '(+56 9) 9799 6241',
    direccion_base: 'Lago Lanalhue 2405, Quilpué',
    tarifa_base_estimada: '$2.500 - $3.000',
    horario_atencion: 'Lun a Dom 24 horas',
    autorizada: true,
    activo: true,
  },
];

export async function extraerRadioTaxisWeb(): Promise<RadioTaxiScraped[]> {
  const listaExtraida: RadioTaxiScraped[] = [];

  // 1. Extraer desde TodoRadioTaxi Villa Alemana
  console.log(`📡 Conectando y extrayendo datos desde ${URL_TODORADIOTAXI_VILLA_ALEMANA}...`);
  try {
    const response = await axios.get(URL_TODORADIOTAXI_VILLA_ALEMANA, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);

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

      const nombreCentral = rawTitulo
        .replace(/–\s*Teléfono.*$/i, '')
        .replace(/–\s*Teléfonos.*$/i, '')
        .trim();

      let telefonoRaw = '';
      let direccion = '';
      let horario = '';
      let telHref = '';

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

      const telLink = nextElements.find('a[href^="tel:"]').first();
      if (telLink.length > 0) {
        telHref = telLink.attr('href') || '';
      }

      if (nombreCentral && (telefonoRaw || telHref)) {
        let rawDigits = (telHref ? telHref.replace('tel:', '') : telefonoRaw).replace(/[^0-9]/g, '');
        let e164 = rawDigits.startsWith('56') ? `+${rawDigits}` : `+56${rawDigits}`;
        let telVisual = telefonoRaw || e164;

        listaExtraida.push({
          id_radiotaxi: `TAXI-VLM-${String(listaExtraida.length + 1).padStart(2, '0')}`,
          nombre_central: nombreCentral,
          telefono: e164,
          telefono_formateado: telVisual.substring(0, 48),
          direccion_base: (direccion || 'Villa Alemana, Región de Valparaíso').substring(0, 250),
          tarifa_base_estimada: '$2.500 - $3.200',
          horario_atencion: (horario || '24 Horas').substring(0, 48),
          autorizada: true,
          activo: true,
        });
      }
    });

    console.log(`✅ TodoRadioTaxi Villa Alemana: se encontraron ${listaExtraida.length} centrales.`);
  } catch (error: any) {
    console.warn(`⚠️ Error al conectarse a TodoRadioTaxi Villa Alemana (${error.message}).`);
  }

  // 2. Extraer desde Páginas Amarillas Quilpué
  console.log(`📡 Conectando y extrayendo datos desde ${URL_AMARILLAS_QUILPUE}...`);
  try {
    const responseQuilpue = await axios.get(URL_AMARILLAS_QUILPUE, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const $q = cheerio.load(responseQuilpue.data);
    const nextDataScript = $q('#__NEXT_DATA__').html();

    if (nextDataScript) {
      const parsed = JSON.parse(nextDataScript);
      const results = parsed?.props?.pageProps?.results || [];
      for (const item of results) {
        const nombre = item.name;
        const phone = item.mainPhone?.number || item.allPhones?.[0]?.number;
        const phoneFormatted = item.mainPhone?.phoneToShow || item.allPhones?.[0]?.phoneToShow || phone;
        const address = item.mainAddress?.streetName
          ? `${item.mainAddress.streetName} ${item.mainAddress.streetNumber || ''}, Quilpué`.trim()
          : 'Quilpué, Región de Valparaíso';

        if (nombre && phone) {
          let rawDigits = phone.replace(/[^0-9]/g, '');
          let e164 = rawDigits.startsWith('56') ? `+${rawDigits}` : `+56${rawDigits}`;

          listaExtraida.push({
            id_radiotaxi: `TAXI-QLP-${String(listaExtraida.length + 1).padStart(2, '0')}`,
            nombre_central: nombre,
            telefono: e164,
            telefono_formateado: phoneFormatted,
            direccion_base: address,
            tarifa_base_estimada: '$2.500 - $3.200',
            horario_atencion: 'Lun a Dom 24 horas',
            autorizada: true,
            activo: true,
          });
        }
      }
    }
    console.log(`✅ Páginas Amarillas Quilpué procesado. Total acumulado: ${listaExtraida.length} centrales.`);
  } catch (error: any) {
    console.warn(`⚠️ Error al conectarse a Páginas Amarillas Quilpué (${error.message}).`);
  }

  if (listaExtraida.length >= 2) {
    return listaExtraida;
  }

  console.warn('⚠️ Pocos resultados desde la web. Usando contingencia oficial predeterminada de Marga Marga.');
  return CONTINGENCIA_MARGA_MARGA;
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
  console.log('=== EXTRACTOR AUTOMÁTICO DE INFORMACIÓN OFICIAL DE RADIOTAXIS (VILLA ALEMANA Y QUILPUÉ) ===');
  const datos = await extraerRadioTaxisWeb();
  await guardarRadioTaxisEnSupabase(datos);
}

if (require.main === module) {
  main();
}

