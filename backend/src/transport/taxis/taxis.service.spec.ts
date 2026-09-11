import { Test, TestingModule } from '@nestjs/testing';
import { TaxisService } from './taxis.service';

describe('TaxisService', () => {
  let service: TaxisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxisService],
    }).compile();

    service = module.get<TaxisService>(TaxisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCentralesRadioTaxi', () => {
    it('debe devolver al menos 2 centrales autorizadas con nombre, telefono y direccion (CA-3.1 y CA-3.3)', async () => {
      const centrales = await service.getCentralesRadioTaxi();
      expect(centrales).toBeDefined();
      expect(Array.isArray(centrales)).toBe(true);
      expect(centrales.length).toBeGreaterThanOrEqual(2);

      centrales.forEach((taxi) => {
        expect(taxi.nombre).toBeDefined();
        expect(taxi.nombre.length).toBeGreaterThan(0);
        expect(taxi.telefono).toMatch(/^\+56\d+/); // Formato E.164
        expect(taxi.telefonoFormateado).toBeDefined();
        expect(taxi.direccionBase).toBeDefined();
        expect(taxi.autorizada).toBe(true);
      });
    });

    it('debe mantener disponibilidad con lista de contingencia si no hay conexion', async () => {
      // Forzar cliente nulo
      (service as any).supabase = null;
      const centrales = await service.getCentralesRadioTaxi();
      expect(centrales.length).toBeGreaterThanOrEqual(2);
      expect(centrales[0].nombre).toContain('Radio Taxi');
    });
  });
});
