import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { HorariosService } from '../transport/horarios/horarios.service';
import { FormatterService } from '../formatter/formatter.service';
import { ConfigService } from '@nestjs/config';

describe('ChatController', () => {
  let controller: ChatController;
  let rutasService: RutasService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://mock.supabase.co';
        if (key === 'SUPABASE_KEY') return 'mock-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        NlpService,
        RutasService,
        HorariosService,
        FormatterService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    rutasService = module.get<RutasService>(RutasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleChat', () => {
    it('should return routes for a known destination', async () => {
      // Mock de Supabase para getRoutesForDestination ya que es asíncrono
      jest.spyOn(rutasService, 'getRoutesForDestination').mockResolvedValue([
        { linea: 'Línea 7', tipo: 'Micro', recorrido: 'Plaza de Armas, Estadio Municipal' },
      ]);

      const response = await controller.handleChat('cómo llego a la plaza');
      expect(response.text).toContain('Aquí tienes opciones para llegar a plaza');
      expect(response.options.length).toBeGreaterThan(0);
    });

    it('should return a guided message for an unknown destination', async () => {
      jest.spyOn(rutasService, 'getRoutesForDestination').mockResolvedValue([]);

      const response = await controller.handleChat('quiero ir a un lugar inventado');
      expect(response.text).toContain('Disculpa, no alcancé a entender bien a qué lugar quieres ir');
      expect(response.options.length).toBe(0);
    });

    it('should return schedule information and showHorarios flag when asking for horarios', async () => {
      const response = await controller.handleChat('¿Cuáles son los horarios de los buses?', '2026-09-09T14:30:00');
      expect(response.showHorarios).toBe(true);
      expect(response.text).toContain('Horarios de Operación - Micros Limache');
      expect(response.horarios).toBeDefined();
      expect(response.horarios.status).toBe('EN_SERVICIO');
      expect(response.text).not.toContain('Disculpa, no alcancé a entender');
    });
  });
});

