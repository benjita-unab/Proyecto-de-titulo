import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.interface';

describe('TelegramController', () => {
  let controller: TelegramController;
  let service: TelegramService;

  const validSecret = 'mi_token_secreto_telegram_2026';

  const mockTelegramService = {
    validateSecretToken: jest.fn((header?: string, query?: string) => {
      return header === validSecret || query === validSecret;
    }),
    handleIncomingUpdate: jest.fn().mockResolvedValue({
      processed: true,
      chatId: 12345,
      text: 'hola',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [
        {
          provide: TelegramService,
          useValue: mockTelegramService,
        },
      ],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
    service = module.get<TelegramService>(TelegramService);
    jest.clearAllMocks();
  });

  describe('Instanciación', () => {
    it('debe estar definido correctamente', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('handleWebhook', () => {
    const mockUpdate: TelegramUpdate = {
      update_id: 123456,
      message: {
        message_id: 1,
        date: 1710000000,
        chat: { id: 999999, type: 'private' },
        text: '¿Cómo llego a la plaza 40 horas?',
      },
    };

    it('debe retornar inmediatamente { status: "ok" } cuando el header de seguridad es válido', () => {
      const response = controller.handleWebhook(mockUpdate, validSecret, undefined);

      expect(response).toEqual({ status: 'ok' });
      expect(service.validateSecretToken).toHaveBeenCalledWith(
        validSecret,
        undefined,
      );
      expect(service.handleIncomingUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    it('debe retornar { status: "ok" } cuando el token se envía en el query string (?token=...)', () => {
      const response = controller.handleWebhook(mockUpdate, undefined, validSecret);

      expect(response).toEqual({ status: 'ok' });
      expect(service.validateSecretToken).toHaveBeenCalledWith(
        undefined,
        validSecret,
      );
      expect(service.handleIncomingUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    it('debe lanzar UnauthorizedException si no se envía ningún token de seguridad', () => {
      expect(() => {
        controller.handleWebhook(mockUpdate, undefined, undefined);
      }).toThrow(UnauthorizedException);

      expect(service.handleIncomingUpdate).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el token de seguridad es inválido', () => {
      expect(() => {
        controller.handleWebhook(mockUpdate, 'token_invalido', undefined);
      }).toThrow(UnauthorizedException);

      expect(service.handleIncomingUpdate).not.toHaveBeenCalled();
    });

    it('debe responder { status: "ok" } de inmediato incluso si el procesamiento en segundo plano arroja un error', async () => {
      mockTelegramService.handleIncomingUpdate.mockRejectedValueOnce(
        new Error('Fallo inesperado en el servicio'),
      );

      const response = controller.handleWebhook(mockUpdate, validSecret, undefined);

      expect(response).toEqual({ status: 'ok' });
    });
  });
});
