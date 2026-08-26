import { Test, TestingModule } from '@nestjs/testing';
import { NlpService } from './nlp.service';

describe('NlpService', () => {
  let service: NlpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NlpService],
    }).compile();

    service = module.get<NlpService>(NlpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanText', () => {
    it('should clean text properly (remove accents and punctuation)', () => {
      expect(service.cleanText('¿Cómo llego a la Plaza?')).toBe('como llego a la plaza');
      expect(service.cleanText('Micro al Cesfam!')).toBe('micro al cesfam');
    });
  });

  describe('extractDestination', () => {
    it('should extract known destinations', () => {
      const clean1 = service.cleanText('¿Cómo llego a la plaza?');
      expect(service.extractDestination(clean1)).toBe('plaza');

      const clean2 = service.cleanText('Micro al cesfam');
      expect(service.extractDestination(clean2)).toBe('cesfam');
    });

    it('should return null for unknown destinations', () => {
      const clean = service.cleanText('Quiero ir a un lugar desconocido');
      expect(service.extractDestination(clean)).toBeNull();
    });
  });

  describe('processQuery', () => {
    it('should return Buscar Ruta intent and destination if recognized', () => {
      const result = service.processQuery('¿Cómo llego a la Plaza?');
      expect(result).toEqual({ intent: 'Buscar Ruta', destination: 'plaza' });
    });

    it('should return unknown intent if destination is not recognized', () => {
      const result = service.processQuery('Quiero ir a la luna');
      expect(result).toEqual({ intent: 'unknown', destination: null });
    });
  });
});
