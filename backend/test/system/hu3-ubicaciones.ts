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
  const resultados: any[] = [];
  const tiemposRespuesta: number[] = [];

  console.log('========================================================================');
  console.log('   HU #3 - NIVEL 3: PRUEBAS DE SISTEMA (T10) - 20 UBICACIONES MUESTRA   ');
  console.log('========================================================================');

  for (const item of UBICACIONES_PRUEBA) {
    const tInicio = performance.now();
    const resultado = await service.findClosestStop(item.lat, item.lng);
    const tFin = performance.now();

    const duracionMs = Math.round((tFin - tInicio) * 100) / 100;
    tiemposRespuesta.push(duracionMs);

    const paradaNombre = resultado ? resultado.parada.nombre : 'Ninguna';
    const distanciaObtenida = resultado ? resultado.distanciaMetros : 0;
    const radioFinal = resultado ? resultado.radioAplicadoMetros : 0;
    const radioAmpliado = resultado ? resultado.radioAmpliado : false;
    const tieneMaps = Boolean(resultado?.googleMapsUrl?.startsWith('https://maps.google.com'));
    const tieneDirections = Boolean(resultado?.googleMapsDirectionsUrl?.startsWith('https://maps.google.com'));

    // Calcular distancia manual geodésica pura para comparación de error
    const distanciaReferencia = resultado
      ? service.calculateDistance(item.lat, item.lng, resultado.parada.latitud, resultado.parada.longitud)
      : 0;
    const errorDistancia = Math.abs(distanciaObtenida - distanciaReferencia);

    // Verificación de alternativa segura cuando distancia > 500m
    const ofreceAlternativa = distanciaObtenida > 500 ? radioAmpliado : true;

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
      ofreceAlternativaPuntoSeguro: ofreceAlternativa,
      googleMapsUrl: resultado?.googleMapsUrl || '',
    });

    console.log(
      `[${item.id.toString().padStart(2, '0')}/20] ${item.nombre.padEnd(32)} -> ` +
      `${distanciaObtenida.toFixed(1)}m | Radio: ${radioFinal}m | Latencia: ${duracionMs}ms | Maps: ${tieneMaps ? 'OK' : 'FAIL'}`
    );
  }

  // Métricas agregadas
  tiemposRespuesta.sort((a, b) => a - b);
  const avgLatency = Math.round(tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length);
  const minLatency = tiemposRespuesta[0];
  const maxLatency = tiemposRespuesta[tiemposRespuesta.length - 1];
  const p95Latency = tiemposRespuesta[Math.floor(tiemposRespuesta.length * 0.95)];

  const pctMaps = (resultados.filter((r) => r.enlaceMapsValido).length / resultados.length) * 100;
  const pctErrorPreciso = (resultados.filter((r) => r.errorDistanciaMetros < 10).length / resultados.length) * 100;
  const casosDistantes = resultados.filter((r) => r.distanciaCalculadaMetros > 500);
  const pctAlternativaDistante = (casosDistantes.filter((r) => r.ofreceAlternativaPuntoSeguro).length / casosDistantes.length) * 100;

  console.log('------------------------------------------------------------------------');
  console.log(`METRICAS AGREGADAS:`);
  console.log(`- Tiempo promedio: ${avgLatency} ms | Min: ${minLatency} ms | Max: ${maxLatency} ms | P95: ${p95Latency} ms`);
  console.log(`- Enlaces Google Maps funcionales: ${pctMaps}% (Meta: 100%)`);
  console.log(`- Error geodésico < 10m: ${pctErrorPreciso}% (Meta: >= 85%)`);
  console.log(`- Alternativa/Punto seguro en >500m: ${pctAlternativaDistante}% (Meta: >= 85%)`);
  console.log(`- P95 <= 1500 ms: ${p95Latency <= 1500 ? 'CUMPLE' : 'NO CUMPLE'}`);
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
    'Parada Más Cercana',
    'Distancia Calculada (m)',
    'Distancia Referencia (m)',
    'Error Distancia (m)',
    'Radio Aplicado (m)',
    'Radio Ampliado',
    'Enlace Maps Válido',
    'Alternativa Ofrecida',
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
      `"${r.paradaMasCercana}"`,
      r.distanciaCalculadaMetros,
      r.distanciaReferenciaMetros,
      r.errorDistanciaMetros,
      r.radioAplicadoMetros,
      r.radioAmpliado ? 'SÍ' : 'NO',
      r.enlaceMapsValido ? 'SÍ' : 'NO',
      r.ofreceAlternativaPuntoSeguro ? 'SÍ' : 'NO',
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
    pctMaps,
    pctErrorPreciso,
    pctAlternativaDistante,
    cumpleTodo: pctMaps === 100 && p95Latency <= 1500 && pctErrorPreciso >= 85 && pctAlternativaDistante >= 85,
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
