import { Test, TestingModule } from '@nestjs/testing';
import { ComparativeFlowService } from './comparative-flow.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { ColectivosService } from '../transport/colectivos/colectivos.service';
import { TaxisService } from '../transport/taxis/taxis.service';
import { FormatterService } from '../formatter/formatter.service';
import { TelegramFormatterService } from '../formatter/telegram-formatter.service';

describe('ComparativeFlowService', () => {
  let service: ComparativeFlowService;
  let rutasService: RutasService;
  let colectivosService: ColectivosService;
  let taxisService: TaxisService;

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
    rutasService = module.get<RutasService>(RutasService);
    colectivosService = module.get<ColectivosService>(ColectivosService);
    taxisService = module.get<TaxisService>(TaxisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Gestion de sesiones de usuario', () => {
    it('debe registrar y recuperar el destino consultado por un usuario', () => {
      service.setSessionDestination('user123', 'Hospital de Quilpue');
      expect(service.getSessionDestination('user123')).toBe('Hospital de Quilpue');
    });

    it('debe limpiar la sesion cuando se solicita', () => {
      service.setSessionDestination('user123', 'Plaza de Quilpue');
      service.clearSession('user123');
      expect(service.getSessionDestination('user123')).toBeNull();
    });
  });

  describe('generateComparativeSummary', () => {
    it('debe generar el resumen comparativo de los 3 medios de transporte', async () => {
      const summary = await service.generateComparativeSummary('user123', 'Hospital de Quilpue');

      expect(summary).toBeDefined();
      expect(summary.destination).toBe('Hospital de Quilpue');
      expect(summary.comparativeData).toBeDefined();
      expect(summary.comparativeData.microbus).toBeDefined();
      expect(summary.comparativeData.colectivo).toBeDefined();
      expect(summary.comparativeData.radiotaxi).toBeDefined();

      expect(summary.comparativeData.microbus.tarifaAdultoMayor).toContain('$150');
      expect(summary.comparativeData.colectivo.tarifaAdultoMayor).toContain('$600');
      expect(summary.comparativeData.radiotaxi.tiempoEspera).toBeDefined();

      expect(summary.webResponse).toBeDefined();
      expect(summary.telegramResponse).toBeDefined();
    });
  });

  describe('processSelection', () => {
    beforeEach(() => {
      service.setSessionDestination('user123', 'Feria El Belloto');
    });

    it('debe entregar detalle de microbuses al seleccionar opcion 1 o "micro"', async () => {
      const res = await service.processSelection('user123', '1');
      expect(res).toBeDefined();
      expect(res?.selectedType).toBe('microbus');
      expect(res?.destination).toBe('Feria El Belloto');
      expect(res?.web).toBeDefined();
      expect(res?.telegram).toBeDefined();
    });

    it('debe entregar detalle de colectivos al seleccionar opcion 2 o "colectivo"', async () => {
      const res = await service.processSelection('user123', '2');
      expect(res).toBeDefined();
      expect(res?.selectedType).toBe('colectivo');
      expect(res?.destination).toBe('Feria El Belloto');
      expect(res?.web.options.length).toBeGreaterThan(0);
      expect(res?.telegram).toBeDefined();
    });

    it('debe entregar centrales de radiotaxi al seleccionar opcion 3 o "taxi"', async () => {
      const res = await service.processSelection('user123', '3');
      expect(res).toBeDefined();
      expect(res?.selectedType).toBe('radiotaxi');
      expect(res?.web.showRadioTaxis).toBe(true);
      expect(res?.web.taxis.length).toBeGreaterThan(0);
      expect(res?.telegram).toBeDefined();
    });

    it('debe devolver null para una entrada que no corresponde a seleccion valida', async () => {
      const res = await service.processSelection('user123', 'opcion desconocida');
      expect(res).toBeNull();
    });
  });
});
