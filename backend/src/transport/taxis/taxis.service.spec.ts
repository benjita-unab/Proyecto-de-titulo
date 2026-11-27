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
    it('no debe inventar ni mostrar centrales si Supabase no está configurado', async () => {
      const centrales = await service.getCentralesRadioTaxi();
      expect(centrales).toEqual([]);
    });

    it('debe mantener la lista vacía si se pierde la conexión en lugar de usar una contingencia falsa', async () => {
      const centrales = await service.getCentralesRadioTaxi();
      expect(centrales).toEqual([]);
    });

    it('debe usar una respuesta vacía como estado seguro hasta verificar fuentes y autorización', async () => {
      await expect(service.getCentralesRadioTaxi('Quilpué')).resolves.toEqual([]);
    });

    it('debe registrar y manejar errores de esquema sin dejar el webhook sin respuesta', async () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'column servicio_radiotaxi.verificado does not exist' },
        }),
      };
      (service as any).supabase = {
        from: jest.fn().mockReturnValue(query),
      };
      const loggerError = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => undefined);

      await expect(service.getCentralesRadioTaxi('Quilpué')).resolves.toEqual([]);

      expect(loggerError).toHaveBeenCalledWith(
        expect.stringContaining('No se mostrarán contactos sin confirmar'),
      );
    });
  });
});
