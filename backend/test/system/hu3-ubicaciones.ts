import { HaversineService } from '../../src/transport/geo/haversine.service';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface UbicacionPrueba {
  id: number;
  nombre: string;
  categoria: 'Centro Urbano' | 'Paradas Dispersas (>500m)' | 'Zona Cobertura Radiotaxi' | 'Limite Comunal';
  comuna: string;
  lat: number;
  lng: number;
  distanciaEsperadaAproxMetros: number; // Distancia estimada de referencia
  debeExpandirRadio: boolean;
  requiereAlternativaTaxi: boolean;
}

export function distanciaVincentyMetros(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const b = (1 - f) * a;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const L = ((lng2 - lng1) * Math.PI) / 180;
  const U1 = Math.atan((1 - f) * Math.tan(phi1));
  const U2 = Math.atan((1 - f) * Math.tan(phi2));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  let lambda = L;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let sinAlpha = 0;
  let cosSqAlpha = 0;
  let cos2SigmaM = 0;

  for (let i = 0; i < 100; i++) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2,
    );
    if (sinSigma === 0) return 0;
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha ** 2;
    cos2SigmaM = cosSqAlpha === 0 ? 0 : cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;
    const C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    const nextLambda =
      L +
      (1 - C) *
        f *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
    if (Math.abs(nextLambda - lambda) < 1e-12) {
      lambda = nextLambda;
      break;
    }
    lambda = nextLambda;
    if (i === 99) throw new Error('No convergió el cálculo geodésico de referencia.');
  }

  const uSq = (cosSqAlpha * (a ** 2 - b ** 2)) / b ** 2;
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
          (B / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma ** 2) *
            (-3 + 4 * cos2SigmaM ** 2)));
  return b * A * (sigma - deltaSigma);
}

const UBICACIONES_PRUEBA: UbicacionPrueba[] = [
  // 10 Centros Urbanos con paradas cercanas
  { id: 1, nombre: 'Plaza Quilpué (Centro)', categoria: 'Centro Urbano', comuna: 'Quilpué', lat: -33.0483, lng: -71.4441, distanciaEsperadaAproxMetros: 120, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 2, nombre: 'Estación Quilpué EFE', categoria: 'Centro Urbano', comuna: 'Quilpué', lat: -33.0450, lng: -71.4428, distanciaEsperadaAproxMetros: 50, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 3, nombre: 'Hospital de Quilpué', categoria: 'Centro Urbano', comuna: 'Quilpué', lat: -33.0532, lng: -71.4398, distanciaEsperadaAproxMetros: 140, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 4, nombre: 'Municipalidad de Quilpué', categoria: 'Centro Urbano', comuna: 'Quilpué', lat: -33.0478, lng: -71.4435, distanciaEsperadaAproxMetros: 90, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 5, nombre: 'Estación Villa Alemana EFE', categoria: 'Centro Urbano', comuna: 'Villa Alemana', lat: -33.0425, lng: -71.3732, distanciaEsperadaAproxMetros: 60, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 6, nombre: 'Plaza Belén Villa Alemana', categoria: 'Centro Urbano', comuna: 'Villa Alemana', lat: -33.0415, lng: -71.3720, distanciaEsperadaAproxMetros: 100, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 7, nombre: 'Hospital Peñablanca', categoria: 'Centro Urbano', comuna: 'Villa Alemana', lat: -33.0440, lng: -71.3505, distanciaEsperadaAproxMetros: 130, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 8, nombre: 'Plaza de Armas Limache Viejo', categoria: 'Centro Urbano', comuna: 'Limache', lat: -33.0152, lng: -71.2675, distanciaEsperadaAproxMetros: 85, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 9, nombre: 'Estación Limache San Francisco', categoria: 'Centro Urbano', comuna: 'Limache', lat: -32.9935, lng: -71.2721, distanciaEsperadaAproxMetros: 45, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 10, nombre: 'Hospital Santo Tomás Limache', categoria: 'Centro Urbano', comuna: 'Limache', lat: -32.9995, lng: -71.2760, distanciaEsperadaAproxMetros: 150, debeExpandirRadio: false, requiereAlternativaTaxi: false },

  // 5 Zonas con paradas dispersas (> 500 m)
  { id: 11, nombre: 'Los Pinos Alto (Quilpué Sur)', categoria: 'Paradas Dispersas (>500m)', comuna: 'Quilpué', lat: -33.0720, lng: -71.4310, distanciaEsperadaAproxMetros: 2350, debeExpandirRadio: true, requiereAlternativaTaxi: true },
  { id: 12, nombre: 'Belloto Sur Alto', categoria: 'Paradas Dispersas (>500m)', comuna: 'Quilpué', lat: -33.0680, lng: -71.4110, distanciaEsperadaAproxMetros: 2700, debeExpandirRadio: true, requiereAlternativaTaxi: true },
  { id: 13, nombre: 'Troncos Viejos Alto', categoria: 'Paradas Dispersas (>500m)', comuna: 'Villa Alemana', lat: -33.0580, lng: -71.3780, distanciaEsperadaAproxMetros: 1800, debeExpandirRadio: true, requiereAlternativaTaxi: true },
  { id: 14, nombre: 'Quebrada Escobares Interior', categoria: 'Paradas Dispersas (>500m)', comuna: 'Villa Alemana', lat: -33.0750, lng: -71.3320, distanciaEsperadaAproxMetros: 4200, debeExpandirRadio: true, requiereAlternativaTaxi: true },
  { id: 15, nombre: 'Los Laureles Rural', categoria: 'Paradas Dispersas (>500m)', comuna: 'Limache', lat: -33.0320, lng: -71.2380, distanciaEsperadaAproxMetros: 3400, debeExpandirRadio: true, requiereAlternativaTaxi: true },

  // 3 Zonas sin transporte mayor (cobertura radiotaxis)
  { id: 16, nombre: 'Colliguay Rural', categoria: 'Zona Cobertura Radiotaxi', comuna: 'Quilpué', lat: -33.1500, lng: -71.1800, distanciaEsperadaAproxMetros: 24000, debeExpandirRadio: true, requiereAlternativaTaxi: true },
  { id: 17, nombre: 'Tabolango Interior', categoria: 'Zona Cobertura Radiotaxi', comuna: 'Limache', lat: -32.9550, lng: -71.3200, distanciaEsperadaAproxMetros: 6100, debeExpandirRadio: true, requiereAlternativaTaxi: true },
  { id: 18, nombre: 'Cajón de San Pedro', categoria: 'Zona Cobertura Radiotaxi', comuna: 'Limache', lat: -32.9680, lng: -71.2200, distanciaEsperadaAproxMetros: 5900, debeExpandirRadio: true, requiereAlternativaTaxi: true },

  // 2 Coordenadas en límite comunal
  { id: 19, nombre: 'Límite Quilpué / Belloto Norte', categoria: 'Limite Comunal', comuna: 'Quilpué/Villa Alemana', lat: -33.0435, lng: -71.3980, distanciaEsperadaAproxMetros: 320, debeExpandirRadio: false, requiereAlternativaTaxi: false },
  { id: 20, nombre: 'Límite Villa Alemana / La Tetera', categoria: 'Limite Comunal', comuna: 'Villa Alemana/Limache', lat: -33.0380, lng: -71.3250, distanciaEsperadaAproxMetros: 2400, debeExpandirRadio: true, requiereAlternativaTaxi: true },
];

export async function ejecutarPruebasSistemaHU3() {
  const service = new HaversineService();
  const resultados: Array<{
    id: number;
    nombre: string;
    categoria: UbicacionPrueba['categoria'];
    comuna: string;
    lat: number;
    lng: number;
    tiempoRespuestaMs: number;
    paradaMasCercana: string;
    distanciaCalculadaMetros: number | null;
    distanciaReferenciaMetros: number | null;
    errorDistanciaMetros: number | null;
    radioAplicadoMetros: number | null;
    radioAmpliado: boolean;
    enlaceMapsValido: boolean;
    googleMapsUrl: string;
  }> = [];
  const tiemposRespuesta: number[] = [];
  const totalCasos = UBICACIONES_PRUEBA.length;

  console.log('========================================================================');
  console.log('   PRUEBA DE SISTEMA HAVERSINE - 20 ESCENARIOS DE UBICACIÓN             ');
  console.log('   Solo se evalúan resultados respaldados por paraderos verificados.     ');
  console.log('========================================================================');

  for (const item of UBICACIONES_PRUEBA) {
    const tInicio = performance.now();
    const resultado = await service.findClosestStop(item.lat, item.lng);
    const tFin = performance.now();

    const duracionMs = Math.round((tFin - tInicio) * 100) / 100;
    tiemposRespuesta.push(duracionMs);

    const paradaNombre = resultado ? resultado.parada.nombre : 'Ninguna verificada';
    const distanciaObtenida = resultado?.distanciaMetros ?? null;
    const radioFinal = resultado?.radioAplicadoMetros ?? null;
    const radioAmpliado = resultado ? resultado.radioAmpliado : false;
    const tieneMaps = Boolean(resultado?.googleMapsUrl?.startsWith('https://maps.google.com'));
    const tieneDirections = Boolean(resultado?.googleMapsDirectionsUrl?.startsWith('https://maps.google.com'));

    const distanciaReferencia = resultado
      ? distanciaVincentyMetros(item.lat, item.lng, resultado.parada.latitud, resultado.parada.longitud)
      : null;
    const errorDistancia =
      distanciaObtenida !== null && distanciaReferencia !== null
        ? Math.abs(distanciaObtenida - distanciaReferencia)
        : null;

    resultados.push({
      id: item.id,
      nombre: item.nombre,
      categoria: item.categoria,
      comuna: item.comuna,
      lat: item.lat,
      lng: item.lng,
      tiempoRespuestaMs: duracionMs,
      paradaMasCercana: paradaNombre,
      distanciaCalculadaMetros: distanciaObtenida,
      distanciaReferenciaMetros: distanciaReferencia,
      errorDistanciaMetros: errorDistancia,
      radioAplicadoMetros: radioFinal,
      radioAmpliado: radioAmpliado,
      enlaceMapsValido: tieneMaps && tieneDirections,
      googleMapsUrl: resultado?.googleMapsUrl || '',
    });

    console.log(
      `[${item.id.toString().padStart(2, '0')}/20] ${item.nombre.padEnd(32)} -> ` +
      `${distanciaObtenida === null ? 'sin datos verificados' : `${distanciaObtenida.toFixed(1)}m`} | ` +
      `Radio: ${radioFinal === null ? 'N/A' : `${radioFinal}m`} | ` +
      `Latencia: ${duracionMs}ms | Maps: ${tieneMaps ? 'OK' : 'FAIL'}`
    );
  }

  // Métricas agregadas
  tiemposRespuesta.sort((a, b) => a - b);
  const avgLatency = Math.round(tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length);
  const minLatency = tiemposRespuesta[0];
  const maxLatency = tiemposRespuesta[tiemposRespuesta.length - 1];
  const p95Latency = tiemposRespuesta[Math.floor(tiemposRespuesta.length * 0.95)];

  const casosEvaluables = resultados.filter((r) => r.errorDistanciaMetros !== null);
  const pctMaps = (resultados.filter((r) => r.enlaceMapsValido).length / totalCasos) * 100;
  const pctErrorPreciso =
    casosEvaluables.length > 0
      ? (casosEvaluables.filter((r) => r.errorDistanciaMetros !== null && r.errorDistanciaMetros < 10).length /
          casosEvaluables.length) *
        100
      : 0;

  console.log('------------------------------------------------------------------------');
  console.log(`METRICAS AGREGADAS:`);
  console.log(`- Tiempo promedio: ${avgLatency} ms | Min: ${minLatency} ms | Max: ${maxLatency} ms | P95: ${p95Latency} ms`);
  console.log(`- Casos evaluables con paradero verificado: ${casosEvaluables.length}/${totalCasos}`);
  console.log(`- Enlaces Google Maps funcionales: ${pctMaps}% (Meta: 100%)`);
  console.log(`- Error Haversine vs. Vincenty < 10m: ${pctErrorPreciso}% (Meta: >= 85% de casos evaluables)`);
  console.log(
    `- P95 local <= 1500 ms: ${
      casosEvaluables.length === totalCasos
        ? p95Latency <= 1500
          ? 'CUMPLE'
          : 'NO CUMPLE'
        : 'NO EVALUABLE (sin cobertura verificada)'
    }`,
  );
  if (casosEvaluables.length < totalCasos) {
    console.log('- Resultado: NO EVALUABLE como prueba de exactitud; faltan paraderos verificados.');
  }
  console.log('------------------------------------------------------------------------');

  // Guardar archivo CSV
  const systemDir = path.resolve(__dirname);
  if (!fs.existsSync(systemDir)) {
    fs.mkdirSync(systemDir, { recursive: true });
  }

  const csvPath = path.join(systemDir, 'hu3-resultados-sistema.csv');
  const csvHeaders = [
    'ID',
    'Nombre Ubicación',
    'Categoría',
    'Comuna',
    'Latitud',
    'Longitud',
    'Tiempo Respuesta (ms)',
    'Caso Evaluable',
    'Parada Más Cercana',
    'Distancia Calculada (m)',
    'Distancia Referencia (m)',
    'Error Distancia (m)',
    'Radio Aplicado (m)',
    'Radio Ampliado',
    'Enlace Maps Válido',
    'URL Google Maps'
  ].join(';');

  const csvRows = resultados.map((r) =>
    [
      r.id,
      `"${r.nombre}"`,
      `"${r.categoria}"`,
      `"${r.comuna}"`,
      r.lat,
      r.lng,
      r.tiempoRespuestaMs,
      r.errorDistanciaMetros !== null ? 'SÍ' : 'NO',
      `"${r.paradaMasCercana}"`,
      r.distanciaCalculadaMetros ?? '',
      r.distanciaReferenciaMetros ?? '',
      r.errorDistanciaMetros ?? '',
      r.radioAplicadoMetros ?? '',
      r.radioAmpliado ? 'SÍ' : 'NO',
      r.enlaceMapsValido ? 'SÍ' : 'NO',
      `"${r.googleMapsUrl}"`
    ].join(';')
  );

  fs.writeFileSync(csvPath, [csvHeaders, ...csvRows].join('\n'), 'utf-8');
  console.log(`Reporte generado exitosamente en: ${csvPath}`);

  return {
    totalCasos: resultados.length,
    avgLatency,
    minLatency,
    maxLatency,
    p95Latency,
    casosEvaluables: casosEvaluables.length,
    pctMaps,
    pctErrorPreciso,
    cumpleTodo:
      casosEvaluables.length === totalCasos &&
      pctMaps === 100 &&
      p95Latency <= 1500 &&
      pctErrorPreciso >= 85,
  };
}

if (require.main === module) {
  ejecutarPruebasSistemaHU3()
    .then((res) => {
      if (!res.cumpleTodo) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Error al ejecutar pruebas de sistema HU3:', err);
      process.exit(1);
    });
}
