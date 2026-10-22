import { Test, TestingModule } from '@nestjs/testing';
import { ComparativeFlowService } from '../../src/chat/comparative-flow.service';
import { RutasService } from '../../src/transport/rutas/rutas.service';
import { ColectivosService } from '../../src/transport/colectivos/colectivos.service';
import { TaxisService } from '../../src/transport/taxis/taxis.service';
import { FormatterService } from '../../src/formatter/formatter.service';
import { TelegramFormatterService } from '../../src/formatter/telegram-formatter.service';
import { performance } from 'perf_hooks';

describe('HU #2 - Nivel 1: Pruebas Unitarias de ComparativeFlowService y Formateadores (T16)', () => {
  let service: ComparativeFlowService;
  let formatterService: FormatterService;
  let telegramFormatter: TelegramFormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComparativeFlowService,
        RutasService,
        ColectivosService,
        TaxisService,
        FormatterService,
        TelegramFormatterService,
      ],
    }).compile();

    service = module.get<ComparativeFlowService>(ComparativeFlowService);
    formatterService = module.get<FormatterService>(FormatterService);
    telegramFormatter = module.get<TelegramFormatterService>(TelegramFormatterService);
  });

  describe('1. Estructura Comparativa de 3 Modalidades (Micro, Colectivo, Radio Taxi)', () => {
    it('debe generar el resumen comparativo con las 3 modalidades completas', async () => {
      const summary = await service.generateComparativeSummary('user_hu2_01', 'Hospital de Quilpué');

      expect(summary).toBeDefined();
      expect(summary.destination).toBe('Hospital de Quilpué');
      expect(summary.comparativeData).toBeDefined();

      // Modalidad 1: Microbús
      expect(summary.comparativeData.microbus).toBeDefined();
      expect(summary.comparativeData.microbus.lineas).toBeTruthy();
      expect(summary.comparativeData.microbus.tarifaAdultoMayor).toContain('$150');
      expect(summary.comparativeData.microbus.tarifaGeneral).toContain('$450');
      expect(summary.comparativeData.microbus.frecuencia).toBeTruthy();

      // Modalidad 2: Colectivo
      expect(summary.comparativeData.colectivo).toBeDefined();
      expect(summary.comparativeData.colectivo.lineas).toBeTruthy();
      expect(summary.comparativeData.colectivo.tarifaAdultoMayor).toContain('$600');
      expect(summary.comparativeData.colectivo.tarifaGeneral).toContain('$850');
      expect(summary.comparativeData.colectivo.frecuencia).toBeTruthy();

      // Modalidad 3: Radio Taxi
      expect(summary.comparativeData.radiotaxi).toBeDefined();
      expect(summary.comparativeData.radiotaxi.centrales).toBeTruthy();
      expect(summary.comparativeData.radiotaxi.tarifaBase).toBeTruthy();
      expect(summary.comparativeData.radiotaxi.tiempoEspera).toBeTruthy();
    });
  });

  describe('2. Formateo de Respuesta para Telegram y Web/WhatsApp', () => {
    it('TelegramFormatter debe generar Inline Keyboard con 3 botones y callback_data asociado', () => {
      const formatted = telegramFormatter.formatComparativeResponse('Plaza Quilpué', {
        microbus: { lineas: 'C02, 108', tarifaGeneral: '$450', tarifaAdultoMayor: '$150', frecuencia: '10 min' },
        colectivo: { lineas: 'Línea 1, 2', tarifaGeneral: '$850', tarifaAdultoMayor: '$600', frecuencia: '5 min' },
        radiotaxi: { centrales: 'Taxiexpress', tarifaBase: '$2.500', tiempoEspera: 'Inmediato' },
      });

      expect(formatted).toBeDefined();
      expect(formatted.parse_mode).toBe('HTML');
      expect(formatted.text).toContain('OPCIONES DE TRANSPORTE A: PLAZA QUILPUÉ');
      expect(formatted.reply_markup).toBeDefined();
      expect(formatted.reply_markup.inline_keyboard).toHaveLength(2);

      const fila1 = formatted.reply_markup.inline_keyboard[0];
      const fila2 = formatted.reply_markup.inline_keyboard[1];

      expect(fila1[0].text).toContain('1. Ver Micros');
      expect(fila1[0].callback_data).toContain('sel_micro');
      expect(fila1[1].text).toContain('2. Ver Colectivos');
      expect(fila1[1].callback_data).toContain('sel_col');
      expect(fila2[0].text).toContain('3. Ver Radio Taxis');
      expect(fila2[0].callback_data).toContain('sel_taxi');
    });

    it('FormatterService (Web/WhatsApp) debe estructurar texto numerado y legible para adulto mayor', () => {
      const formatted = formatterService.formatComparativeResponse('Feria El Belloto', {
        microbus: { lineas: '108, 111', tarifaGeneral: '$450', tarifaAdultoMayor: '$150', frecuencia: '12 min' },
        colectivo: { lineas: 'Línea 2', tarifaGeneral: '$850', tarifaAdultoMayor: '$600', frecuencia: '4 min' },
        radiotaxi: { centrales: 'Radio Taxi Belloto', tarifaBase: '$2.800', tiempoEspera: '5 min' },
      });

      expect(formatted.text).toContain('*1. Microbús');
      expect(formatted.text).toContain('*2. Colectivo');
      expect(formatted.text).toContain('*3. Radio Taxi');
      expect(formatted.text).toContain('Feria El Belloto');
      expect(formatted.options).toBeDefined();
      expect(formatted.options.length).toBe(3);
    });
  });

  describe('3. Procesamiento de Selección Interactiva (Número vs Texto Libre)', () => {
    beforeEach(() => {
      service.setSessionDestination('user_test_select', 'Los Pinos');
    });

    it('debe procesar selección por número ("1", "2", "3")', async () => {
      const sel1 = await service.processSelection('user_test_select', '1');
      expect(sel1?.selectedType).toBe('microbus');
      expect(sel1?.destination).toBe('Los Pinos');

      const sel2 = await service.processSelection('user_test_select', '2');
      expect(sel2?.selectedType).toBe('colectivo');

      const sel3 = await service.processSelection('user_test_select', '3');
      expect(sel3?.selectedType).toBe('radiotaxi');
    });

    it('debe procesar selección por texto libre ("micro", "colectivo", "taxi", "quiero ir en colectivo")', async () => {
      const selMicro = await service.processSelection('user_test_select', 'micro');
      expect(selMicro?.selectedType).toBe('microbus');

      const selCol = await service.processSelection('user_test_select', 'quiero ir en colectivo');
      expect(selCol?.selectedType).toBe('colectivo');

      const selTaxi = await service.processSelection('user_test_select', 'radiotaxi por favor');
      expect(selTaxi?.selectedType).toBe('radiotaxi');
    });

    it('debe manejar callback_data interactivo directo ("sel_col_Los Pinos")', async () => {
      const selCallback = await service.processSelection('user_test_select', 'sel_col_Los Pinos');
      expect(selCallback?.selectedType).toBe('colectivo');
      expect(selCallback?.destination).toBe('Los Pinos');
    });

    it('debe retornar null para selecciones inválidas ("4", "metro", "avión")', async () => {
      const selInvalida4 = await service.processSelection('user_test_select', '4');
      expect(selInvalida4).toBeNull();

      const selAvion = await service.processSelection('user_test_select', 'avión');
      expect(selAvion).toBeNull();
    });
  });

  describe('4. Gestión y Persistencia de Sesión con TTL', () => {
    it('debe registrar y recuperar el destino del usuario', () => {
      service.setSessionDestination('user_ses_01', 'Valencia');
      expect(service.getSessionDestination('user_ses_01')).toBe('Valencia');
    });

    it('debe limpiar la sesión explícitamente', () => {
      service.setSessionDestination('user_ses_02', 'Centro Quilpué');
      service.clearSession('user_ses_02');
      expect(service.getSessionDestination('user_ses_02')).toBeNull();
    });

    it('debe expirar la sesión si el timestamp supera el TTL de 15 minutos', () => {
      service.setSessionDestination('user_ses_expirada', 'Belloto 2000');
      // Forzar timestamp en el pasado (> 15 min)
      const session = (service as any).userSessions.get('user_ses_expirada');
      session.lastComparativeTimestamp = Date.now() - (16 * 60 * 1000);

      expect(service.getSessionDestination('user_ses_expirada')).toBeNull();
    });
  });

  describe('5. Rendimiento en Generación y Selección (< 50 ms)', () => {
    it('la generación del resumen comparativo y la selección deben ejecutarse en menos de 50 ms en memoria', async () => {
      // Usar contingencia local en memoria para medir rendimiento puro sin red externa
      (service as any).colectivosService.supabase = null;
      (service as any).rutasService.supabase = null;
      (service as any).taxisService.supabase = null;

      const t0 = performance.now();
      await service.generateComparativeSummary('user_perf', 'Plaza Quilpué');
      const t1 = performance.now();
      await service.processSelection('user_perf', '2');
      const t2 = performance.now();

      expect(t1 - t0).toBeLessThan(50);
      expect(t2 - t1).toBeLessThan(50);
    });
  });
});
