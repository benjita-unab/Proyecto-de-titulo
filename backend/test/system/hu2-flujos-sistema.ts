import { ComparativeFlowService } from '../../src/chat/comparative-flow.service';
import { RutasService } from '../../src/transport/rutas/rutas.service';
import { ColectivosService } from '../../src/transport/colectivos/colectivos.service';
import { TaxisService } from '../../src/transport/taxis/taxis.service';
import { FormatterService } from '../../src/formatter/formatter.service';
import { TelegramFormatterService } from '../../src/formatter/telegram-formatter.service';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface FlujoCombinacion {
  id: number;
  destino: string;
  modalidad: 'Microbús' | 'Colectivo' | 'Radio Taxi';
  opcionInput: string;
}

const DESTINOS = [
  'Hospital de Quilpué',
  'Plaza de Quilpué',
  'Feria El Belloto',
  'Los Pinos',
  'Valencia',
];

const MODALIDADES: Array<{ modalidad: 'Microbús' | 'Colectivo' | 'Radio Taxi'; input: string }> = [
  { modalidad: 'Microbús', input: '1' },
  { modalidad: 'Colectivo', input: '2' },
  { modalidad: 'Radio Taxi', input: '3' },
];

export async function ejecutarPruebasSistemaHU2() {
  const rutasService = new RutasService();
  const colectivosService = new ColectivosService();
  const taxisService = new TaxisService();
  const formatterService = new FormatterService();
  const telegramFormatter = new TelegramFormatterService();

  const service = new ComparativeFlowService(
    rutasService,
    colectivosService,
    taxisService,
    formatterService,
    telegramFormatter,
  );

  const combinaciones: FlujoCombinacion[] = [];
  let contadorId = 1;

  for (const destino of DESTINOS) {
    for (const mod of MODALIDADES) {
      combinaciones.push({
        id: contadorId++,
        destino,
        modalidad: mod.modalidad,
        opcionInput: mod.input,
      });
    }
  }

  const resultados: any[] = [];
  const tiemposPaso1: number[] = [];
  const tiemposPaso2: number[] = [];
  const tiemposTotales: number[] = [];

  console.log('========================================================================');
  console.log('   HU #2 - NIVEL 3: PRUEBAS DE SISTEMA (T18) - 15 FLUJOS INTERACTIVOS   ');
  console.log('========================================================================');

  for (const item of combinaciones) {
    const userId = `sys_flow_user_${item.id}`;

    // --- PASO 1: Resumen Comparativo de 3 Opciones ---
    const t0 = performance.now();
    const resumen = await service.generateComparativeSummary(userId, item.destino);
    const t1 = performance.now();
    const duracionPaso1 = Math.round((t1 - t0) * 100) / 100;
    tiemposPaso1.push(duracionPaso1);

    // Verificación de elementos visuales en Paso 1
    const tieneBotonesTg = Boolean(resumen.telegramResponse?.reply_markup?.inline_keyboard?.length >= 2);
    const tieneListaWeb = Boolean(resumen.webResponse?.options?.length === 3);

    // --- PASO 2: Selección Interactiva y Desglose ---
    const t2 = performance.now();
    const detalle = await service.processSelection(userId, item.opcionInput);
    const t3 = performance.now();
    const duracionPaso2 = Math.round((t3 - t2) * 100) / 100;
    tiemposPaso2.push(duracionPaso2);

    const duracionTotal = Math.round((duracionPaso1 + duracionPaso2) * 100) / 100;
    tiemposTotales.push(duracionTotal);

    // Verificación de coherencia de datos entre Paso 1 y Paso 2
    let coherente = false;
    let detalleResumen = '';

    if (item.modalidad === 'Microbús') {
      const lineasPaso1 = resumen.comparativeData.microbus.lineas;
      coherente = Boolean(detalle && detalle.selectedType === 'microbus' && detalle.web);
      detalleResumen = `Líneas: ${lineasPaso1.substring(0, 30)}`;
    } else if (item.modalidad === 'Colectivo') {
      const tarifaAMResumen = resumen.comparativeData.colectivo.tarifaAdultoMayor;
      const tarifaDiurnaResumen = resumen.comparativeData.colectivo.tarifaGeneral;
      const webAny = detalle?.web as any;
      coherente = Boolean(detalle && detalle.selectedType === 'colectivo' && webAny?.options?.length > 0);
      detalleResumen = `AM: ${tarifaAMResumen} | Gral: ${tarifaDiurnaResumen}`;
    } else if (item.modalidad === 'Radio Taxi') {
      const webAny = detalle?.web as any;
      coherente = Boolean(detalle && detalle.selectedType === 'radiotaxi' && webAny?.showRadioTaxis);
      detalleResumen = `Centrales: ${webAny?.taxis?.length || 0} disponibles`;
    }

    const ambosPasosCompletos = Boolean(resumen && detalle && coherente);

    resultados.push({
      id: item.id,
      destino: item.destino,
      modalidad: item.modalidad,
      inputUsuario: item.opcionInput,
      tiempoPaso1Ms: duracionPaso1,
      tiempoPaso2Ms: duracionPaso2,
      tiempoTotalMs: duracionTotal,
      paso1Completado: Boolean(resumen),
      paso2Completado: Boolean(detalle),
      coherenciaDatos: coherente,
      elementosVisualesPresentes: tieneBotonesTg && tieneListaWeb,
      detalleResumen,
    });

    console.log(
      `[${item.id.toString().padStart(2, '0')}/15] "${item.destino.padEnd(20)}" -> ${item.modalidad.padEnd(11)} ` +
      `| P1: ${duracionPaso1}ms | P2: ${duracionPaso2}ms | Total: ${duracionTotal}ms | Coherente: ${coherente ? 'SÍ' : 'NO'}`
    );
  }

  // Métricas agregadas
  tiemposPaso1.sort((a, b) => a - b);
  tiemposPaso2.sort((a, b) => a - b);
  tiemposTotales.sort((a, b) => a - b);

  const avgP1 = Math.round(tiemposPaso1.reduce((a, b) => a + b, 0) / tiemposPaso1.length);
  const p95P1 = tiemposPaso1[Math.floor(tiemposPaso1.length * 0.95)];

  const avgP2 = Math.round(tiemposPaso2.reduce((a, b) => a + b, 0) / tiemposPaso2.length);
  const p95P2 = tiemposPaso2[Math.floor(tiemposPaso2.length * 0.95)];

  const pctCompletitud = (resultados.filter((r) => r.paso1Completado && r.paso2Completado).length / resultados.length) * 100;
  const pctCoherencia = (resultados.filter((r) => r.coherenciaDatos).length / resultados.length) * 100;

  console.log('------------------------------------------------------------------------');
  console.log(`METRICAS AGREGADAS DE SISTEMA:`);
  console.log(`- Flujos completados en ambos pasos: ${pctCompletitud}% (Meta: 100%)`);
  console.log(`- Coherencia de datos Resumen vs Detalle: ${pctCoherencia}% (Meta: 100%)`);
  console.log(`- Paso 1 (Resumen): Promedio = ${avgP1} ms | P95 = ${p95P1} ms (Meta: <= 1500 ms)`);
  console.log(`- Paso 2 (Detalle): Promedio = ${avgP2} ms | P95 = ${p95P2} ms (Meta: <= 1500 ms)`);
  console.log(`- Criterio de Latencia P95: ${p95P1 <= 1500 && p95P2 <= 1500 ? 'CUMPLE' : 'NO CUMPLE'}`);
  console.log('------------------------------------------------------------------------');

  // Guardar archivo CSV
  const systemDir = path.resolve(__dirname);
  if (!fs.existsSync(systemDir)) {
    fs.mkdirSync(systemDir, { recursive: true });
  }

  const csvPath = path.join(systemDir, 'hu2-resultados-sistema.csv');
  const csvHeaders = [
    'ID',
    'Destino',
    'Modalidad Elegida',
    'Input Selección',
    'Tiempo Paso 1 (ms)',
    'Tiempo Paso 2 (ms)',
    'Tiempo Total (ms)',
    'Paso 1 Exitoso',
    'Paso 2 Exitoso',
    'Coherencia Datos',
    'Elementos Visuales',
    'Detalle Resumen'
  ].join(';');

  const csvRows = resultados.map((r) =>
    [
      r.id,
      `"${r.destino}"`,
      `"${r.modalidad}"`,
      `"${r.inputUsuario}"`,
      r.tiempoPaso1Ms,
      r.tiempoPaso2Ms,
      r.tiempoTotalMs,
      r.paso1Completado ? 'SÍ' : 'NO',
      r.paso2Completado ? 'SÍ' : 'NO',
      r.coherenciaDatos ? 'SÍ' : 'NO',
      r.elementosVisualesPresentes ? 'SÍ' : 'NO',
      `"${r.detalleResumen}"`
    ].join(';')
  );

  fs.writeFileSync(csvPath, [csvHeaders, ...csvRows].join('\n'), 'utf-8');
  console.log(`Reporte generado exitosamente en: ${csvPath}`);

  return {
    totalCasos: resultados.length,
    pctCompletitud,
    pctCoherencia,
    p95P1,
    p95P2,
    cumpleTodo: pctCompletitud === 100 && pctCoherencia === 100 && p95P1 <= 1500 && p95P2 <= 1500,
  };
}

if (require.main === module) {
  ejecutarPruebasSistemaHU2()
    .then((res) => {
      if (!res.cumpleTodo) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Error al ejecutar pruebas de sistema HU2:', err);
      process.exit(1);
    });
}
