import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramService', () => {
  let service: TelegramService;
  let configService: ConfigService;

  const mockSecret = 'super_secret_telegram_webhook_token_2026';
  const mockBotToken = '123456789:ABCdefGHIjklMNOpqrs';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TELEGRAM_BOT_TOKEN') return mockBotToken;
              if (key === 'TELEGRAM_WEBHOOK_SECRET') return mockSecret;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  describe('Instanciación', () => {
    it('debe estar definido correctamente', () => {
      expect(service).toBeDefined();
    });
  });

  describe('validateSecretToken', () => {
    it('debe validar exitosamente cuando el header coincide con el secreto', () => {
      const isValid = service.validateSecretToken(mockSecret, undefined);
      expect(isValid).toBe(true);
    });

    it('debe validar exitosamente cuando el parámetro query coincide con el secreto', () => {
      const isValid = service.validateSecretToken(undefined, mockSecret);
      expect(isValid).toBe(true);
    });

    it('debe rechazar la validación si el token es erróneo', () => {
      const isValid = service.validateSecretToken('token_falso', undefined);
      expect(isValid).toBe(false);
    });

    it('debe rechazar la validación si no se proporciona ningún token', () => {
      const isValid = service.validateSecretToken(undefined, undefined);
      expect(isValid).toBe(false);
    });

    it('debe permitir la solicitud si TELEGRAM_WEBHOOK_SECRET no fue configurado', async () => {
      const permissiveModule = await Test.createTestingModule({
        providers: [
          TelegramService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(''),
            },
          },
        ],
      }).compile();

      const permissiveService = permissiveModule.get<TelegramService>(TelegramService);
      expect(permissiveService.validateSecretToken('cualquiera')).toBe(true);
    });
  });

  describe('extractIncomingMessage', () => {
    it('debe extraer chatId, text y remitente desde un update con message', () => {
      const update: TelegramUpdate = {
        update_id: 10001,
        message: {
          message_id: 42,
          date: 1710000000,
          chat: { id: 987654321, type: 'private' },
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'Don',
            last_name: 'Pedro',
            username: 'donpedro',
          },
          text: '¿Cómo llego al Hospital Santo Tomás?',
        },
      };

      const parsed = service.extractIncomingMessage(update);

      expect(parsed).toBeDefined();
      expect(parsed?.chatId).toBe(987654321);
      expect(parsed?.text).toBe('¿Cómo llego al Hospital Santo Tomás?');
      expect(parsed?.senderName).toBe('Don Pedro');
      expect(parsed?.username).toBe('donpedro');
      expect(parsed?.messageId).toBe(42);
    });

    it('debe extraer datos correctamente desde un edited_message', () => {
      const update: TelegramUpdate = {
        update_id: 10002,
        edited_message: {
          message_id: 43,
          date: 1710000010,
          chat: { id: 987654321, type: 'private' },
          from: {
            id: 987654321,
            is_bot: false,
            first_name: 'Marta',
          },
          text: 'Micro a la plaza',
        },
      };

      const parsed = service.extractIncomingMessage(update);

      expect(parsed).toBeDefined();
      expect(parsed?.chatId).toBe(987654321);
      expect(parsed?.text).toBe('Micro a la plaza');
      expect(parsed?.senderName).toBe('Marta');
    });

    it('debe recortar espacios en blanco (trim) en el mensaje recibido', () => {
      const update: TelegramUpdate = {
        update_id: 10003,
        message: {
          message_id: 44,
          date: 1710000020,
          chat: { id: 111, type: 'private' },
          text: '   horarios buses   ',
        },
      };

      const parsed = service.extractIncomingMessage(update);
      expect(parsed?.text).toBe('horarios buses');
    });

    it('debe devolver null si el update no contiene texto (ej: sticker o foto sin texto)', () => {
      const update: TelegramUpdate = {
        update_id: 10004,
        message: {
          message_id: 45,
          date: 1710000030,
          chat: { id: 111, type: 'private' },
        },
      };

      expect(service.extractIncomingMessage(update)).toBeNull();
    });

    it('debe devolver null si el texto solo contiene espacios en blanco', () => {
      const update: TelegramUpdate = {
        update_id: 10005,
        message: {
          message_id: 46,
          date: 1710000040,
          chat: { id: 111, type: 'private' },
          text: '    ',
        },
      };

      expect(service.extractIncomingMessage(update)).toBeNull();
    });

    it('debe devolver null si el update está vacío o es inválido', () => {
      expect(service.extractIncomingMessage({} as TelegramUpdate)).toBeNull();
    });
  });

  describe('handleIncomingUpdate', () => {
    it('debe procesar exitosamente un update válido devolviendo chatId y text', async () => {
      const update: TelegramUpdate = {
        update_id: 20001,
        message: {
          message_id: 50,
          date: 1710000100,
          chat: { id: 555666, type: 'private' },
          text: 'horarios de la linea 02',
        },
      };

      const result = await service.handleIncomingUpdate(update);

      expect(result.processed).toBe(true);
      expect(result.chatId).toBe(555666);
      expect(result.text).toBe('horarios de la linea 02');
    });

    it('debe devolver processed: false si el update no contiene texto procesable', async () => {
      const update: TelegramUpdate = {
        update_id: 20002,
      };

      const result = await service.handleIncomingUpdate(update);

      expect(result.processed).toBe(false);
      expect(result.chatId).toBeUndefined();
    });
  });

  describe('sendMessage', () => {
    it('debe llamar a axios.post con el payload correcto y retornar true', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { ok: true, result: { message_id: 99 } },
      });

      const success = await service.sendMessage(
        123456,
        '<b>Hola</b> Limache',
        'HTML',
      );

      expect(success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${mockBotToken}/sendMessage`,
        {
          chat_id: 123456,
          text: '<b>Hola</b> Limache',
          parse_mode: 'HTML',
        },
      );
    });

    it('debe manejar errores HTTP de axios sin romper la aplicación y retornar false', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network connection timeout'));

      const success = await service.sendMessage(123456, 'Mensaje de prueba');

      expect(success).toBe(false);
    });
  });
});
