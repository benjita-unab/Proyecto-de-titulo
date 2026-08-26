import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { NlpService } from '../nlp/nlp.service';
import { RutasService } from '../transport/rutas/rutas.service';
import { FormatterService } from '../formatter/formatter.service';

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [NlpService, RutasService, FormatterService],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleChat', () => {
    it('should return routes for a known destination', () => {
      const response = controller.handleChat('cómo llego a la plaza');
      expect(response.text).toContain('Aquí tienes algunas opciones para llegar a plaza');
      expect(response.options.length).toBeGreaterThan(0);
    });

    it('should return a guided message for an unknown destination', () => {
      const response = controller.handleChat('quiero ir a un lugar inventado');
      expect(response.text).toContain('Lo siento, no he podido reconocer tu destino');
      expect(response.options.length).toBe(0);
    });
  });
});
