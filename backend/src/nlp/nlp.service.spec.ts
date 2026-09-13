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
    it('should clean text properly (remove accents, punctuation, and politeness)', () => {
      expect(service.cleanText('¿Cómo llego a la Plaza?')).toBe('como llego a la plaza');
      expect(service.cleanText('Micro al Cesfam!')).toBe('micro al cesfam');
      expect(service.cleanText('Hola Cómo estás Mira Necesito que me entregues directamente una línea de bus que pase directamente por el hospital Santo Tomás por favor')).toBe('pase directamente por el hospital santo tomas');
    });
  });

  describe('extractDestination', () => {
    it('should extract destination using regex patterns', () => {
      const clean1 = service.cleanText('¿Cómo llego a la plaza?');
      expect(service.extractDestination(clean1)).toBe('plaza');

      const clean2 = service.cleanText('quiero ir a un lugar bonito');
      expect(service.extractDestination(clean2)).toBe('lugar bonito');
      
      const clean3 = service.cleanText('Hola Cómo estás Mira Necesito que me entregues directamente una línea de bus que pase directamente por el hospital Santo Tomás por favor');
      expect(service.extractDestination(clean3)).toBe('hospital santo tomas');
    });

    it('should use fallback for phrases without patterns up to 8 words', () => {
      const clean = service.cleanText('hospital');
      expect(service.extractDestination(clean)).toBe('hospital');

      const clean40 = service.cleanText('a la plaza de las 40 horas');
      expect(service.extractDestination(clean40)).toBe('plaza de las 40 horas');
    });

    it('should return null for very long phrases with unknown intent', () => {
      const clean = service.cleanText('no se de que estoy hablando en este texto extremadamente largo que pasa de las ocho palabras sin destinos');
      expect(service.extractDestination(clean)).toBeNull();
    });
  });

  describe('processQuery', () => {
    it('should return Buscar Ruta intent and destination if regex matches', () => {
      const result = service.processQuery('¿Cómo llego a la Plaza?');
      expect(result).toEqual({ intent: 'Buscar Ruta', destination: 'plaza' });
    });

    it('should return unknown intent if text is too long and has no pattern', () => {
      const result = service.processQuery('Ayer fui a comprar pan y no me dieron vuelto porque no se qué pasó');
      expect(result).toEqual({ intent: 'unknown', destination: null });
    });

    it('should return Saludo intent for greetings and "hola bot"', () => {
      expect(service.processQuery('hola bot')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('Hola')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('Buenos días')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('buen día')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('/start')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('hola como estan')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('¿hola como estan?')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('¿cómo están?')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('como estan')).toEqual({ intent: 'Saludo', destination: null });
      expect(service.processQuery('Hola, ¿cómo están?')).toEqual({ intent: 'Saludo', destination: null });
    });

    it('should return Consultar RadioTaxi with detected comuna', () => {
      expect(service.processQuery('¿Cuáles son los taxis de Quilpué?')).toEqual({
        intent: 'Consultar RadioTaxi',
        destination: null,
        comuna: 'Quilpué',
      });
      expect(service.processQuery('necesito un radiotaxi en Villa Alemana')).toEqual({
        intent: 'Consultar RadioTaxi',
        destination: null,
        comuna: 'Villa Alemana',
      });
      expect(service.processQuery('dame el numero de taxi')).toEqual({
        intent: 'Consultar RadioTaxi',
        destination: null,
        comuna: null,
      });
    });

    it('should return Consultar Horario with line or general comuna', () => {
      expect(service.processQuery('¿A qué hora pasa la Línea 111?')).toEqual({
        intent: 'Consultar Horario',
        destination: null,
        linea: '111',
        comuna: null,
      });
      expect(service.processQuery('Horarios de las micros de Villa Alemana en general')).toEqual({
        intent: 'Consultar Horario',
        destination: null,
        linea: null,
        comuna: 'Villa Alemana',
      });
      expect(service.processQuery('Horarios de Quilpué')).toEqual({
        intent: 'Consultar Horario',
        destination: null,
        linea: null,
        comuna: 'Quilpué',
      });
    });
  });
});
