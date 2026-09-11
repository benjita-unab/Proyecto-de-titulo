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

    it('debe detectar notas de voz y marcarlas con isVoice: true', () => {
      const update: TelegramUpdate = {
        update_id: 10006,
        message: {
          message_id: 47,
          date: 1710000050,
          chat: { id: 222, type: 'private' },
          from: { id: 222, is_bot: false, first_name: 'Alberto' },
          voice: { file_id: 'voice_file_123', duration: 4 },
        },
      };

      const parsed = service.extractIncomingMessage(update);
      expect(parsed).not.toBeNull();
      expect(parsed?.isVoice).toBe(true);
      expect(parsed?.chatId).toBe(222);
      expect(parsed?.senderName).toBe('Alberto');
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

    it('debe responder automáticamente con mensaje de orientación cuando el usuario envía una nota de voz', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { ok: true, result: { message_id: 102 } },
      });

      const update: TelegramUpdate = {
        update_id: 20004,
        message: {
          message_id: 88,
          date: 1710000300,
          chat: { id: 333444, type: 'private' },
          from: { id: 333444, is_bot: false, first_name: 'Elena' },
          voice: { file_id: 'voice_abc_123', duration: 3 },
        },
      };

      const result = await service.handleIncomingUpdate(update);

      expect(result.processed).toBe(true);
      expect(result.sent).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          chat_id: 333444,
          text: expect.stringContaining('Mensaje de voz recibido'),
          parse_mode: 'HTML',
        }),
      );
    });

    it('debe responder automáticamente con mensaje de bienvenida al recibir "hola bot"', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { ok: true, result: { message_id: 101 } },
      });

      const mockFormatter = {
        formatWelcomeMessage: jest.fn().mockReturnValue({
          text: '👋 ¡Hola! Te damos la bienvenida a Movitech Limache.',
          parse_mode: 'HTML',
        }),
      };

      const mockNlp = {
        processQuery: jest.fn().mockReturnValue({
          intent: 'Saludo',
          destination: null,
        }),
      };

      const activeModule = await Test.createTestingModule({
        providers: [
          TelegramService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(mockBotToken),
            },
          },
          { provide: 'TelegramFormatterService', useValue: mockFormatter },
          { provide: 'NlpService', useValue: mockNlp },
        ],
      }).compile();

      const activeService = new TelegramService(
        activeModule.get<ConfigService>(ConfigService),
        mockFormatter as any,
        mockNlp as any,
      );

      const update: TelegramUpdate = {
        update_id: 20003,
        message: {
          message_id: 70,
          date: 1710000200,
          chat: { id: 777888, type: 'private' },
          from: { id: 777888, is_bot: false, first_name: 'Rosa' },
          text: 'hola bot',
        },
      };

      const result = await activeService.handleIncomingUpdate(update);

      expect(result.processed).toBe(true);
      expect(result.sent).toBe(true);
      expect(mockFormatter.formatWelcomeMessage).toHaveBeenCalledWith('Rosa');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          chat_id: 777888,
          text: expect.stringContaining('Movitech Limache'),
          parse_mode: 'HTML',
        }),
      );
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

  describe('syncTelegramEventWithRoutes (Tarea 3 - HU #54)', () => {
    let activeService: TelegramService;
    let mockRutasService: any;
    let mockNlpService: any;
    let mockFormatterService: any;
    let mockHorariosService: any;
    let mockTaxisService: any;

    beforeEach(async () => {
      mockRutasService = {
        getRoutesForDestination: jest.fn().mockResolvedValue([
          {
            linea: 'Línea 01',
            recorrido: 'Terminal Victoria, Urmeneta, Estación Limache',
            tipo: 'Microbús Agdabus',
          },
          {
            linea: 'Línea 02',
            recorrido: 'República, San Francisco, Cajón Grande',
            tipo: 'Microbús Agdabus',
          },
        ]),
      };

      mockNlpService = {
        processQuery: jest.fn((text: string) => {
          if (text.includes('hospital') || text.includes('plaza') || text.includes('centro')) {
            return { intent: 'Buscar Ruta', destination: 'Hospital Santo Tomás' };
          }
          if (text.includes('taxi')) {
            return { intent: 'Consultar RadioTaxi', destination: null };
          }
          if (text.includes('horario')) {
            return { intent: 'Consultar Horario', destination: null, linea: '01' };
          }
          if (text.includes('hola') || text.startsWith('/start')) {
            return { intent: 'Saludo', destination: null };
          }
          return { intent: 'unknown', destination: null };
        }),
      };

      mockFormatterService = {
        formatRouteResponse: jest.fn((dest: string, routes: any[], mode: any) => {
          if (routes.length === 0) {
            return {
              text: '🚌 Disculpa, no encontré recorridos directos.',
              parse_mode: mode || 'HTML',
            };
          }
          if (mode === 'Markdown') {
            return {
              text: `🚌 *OPCIONES DE TRANSPORTE A: ${dest.toUpperCase()}*\n📍 *Pasa por:* ${routes[0].recorrido}\n⏱️ *Horario:* 06:30 - 21:00\n💰 *Tarifa:* $150`,
              parse_mode: 'Markdown',
            };
          }
          return {
            text: `🚌 <b>OPCIONES DE TRANSPORTE A: ${dest.toUpperCase()}</b>\n📍 <b>Pasa por:</b> ${routes[0].recorrido}\n⏱️ <b>Horario:</b> 06:30 - 21:00\n💰 <b>Tarifa:</b> $150`,
            parse_mode: 'HTML',
          };
        }),
        formatWelcomeMessage: jest.fn().mockReturnValue({
          text: '👋 ¡Hola! Te damos la bienvenida a <b>Movitech Limache</b>.',
          parse_mode: 'HTML',
        }),
        formatRadioTaxisResponse: jest.fn().mockReturnValue({
          text: '🚕 <b>DIRECTORIO DE RADIO TAXIS - LIMACHE</b>',
          parse_mode: 'HTML',
        }),
        formatHorarioResponse: jest.fn().mockReturnValue({
          text: '⏱️ <b>HORARIOS DE OPERACIÓN - MICROBUSES LIMACHE</b>',
          parse_mode: 'HTML',
        }),
      };

      mockHorariosService = {
        getHorariosPorLinea: jest.fn().mockResolvedValue({
          nombreLinea: 'Línea 01',
          empresa: 'Agdabus',
          franjas: [],
        }),
        checkHorarioStatus: jest.fn().mockReturnValue({
          isOutOfService: false,
          badgeText: 'EN SERVICIO',
          detail: 'Operando',
          linea: 'Línea 01',
          horarios: [],
        }),
      };

      mockTaxisService = {
        getCentralesRadioTaxi: jest.fn().mockResolvedValue([
          {
            nombre: 'Radio Taxi Limache',
            telefono: '+56322626021',
            direccionBase: 'Porvenir 574',
          },
        ]),
      };

      activeService = new TelegramService(
        { get: jest.fn().mockReturnValue(mockBotToken) } as any,
        mockFormatterService,
        mockNlpService,
        mockRutasService,
        mockHorariosService,
        mockTaxisService,
      );
    });

    it('debe conectar con RutasService y enviar respuesta enriquecida ante consulta de destino (CA-54.2)', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { ok: true } });

      const result = await activeService.syncTelegramEventWithRoutes(
        123456,
        '¿Cómo llego al hospital?',
        'Don Juan',
      );

      expect(result.success).toBe(true);
      expect(result.intent).toBe('Buscar Ruta');
      expect(mockRutasService.getRoutesForDestination).toHaveBeenCalledWith('Hospital Santo Tomás');
      expect(result.replyText).toContain('🚌');
      expect(result.replyText).toContain('📍');
      expect(result.replyText).toContain('⏱️');
      expect(result.replyText).toContain('💰');
      expect(result.replyText).toContain('<b>OPCIONES DE TRANSPORTE');
    });

    it('debe soportar parse_mode: Markdown si es requerido por el cliente', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { ok: true } });

      const result = await activeService.syncTelegramEventWithRoutes(
        123456,
        '¿Cómo llego a la plaza?',
        'María',
        'Markdown',
      );

      expect(result.success).toBe(true);
      expect(result.parseMode).toBe('Markdown');
      expect(result.replyText).toContain('*OPCIONES DE TRANSPORTE');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          parse_mode: 'Markdown',
        }),
      );
    });

    it('debe procesar consultas en un tiempo menor o igual a 1.5 segundos (CA-54.1)', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { ok: true } });

      const result = await activeService.syncTelegramEventWithRoutes(
        123456,
        'micro al hospital',
      );

      expect(result.latencyMs).toBeLessThanOrEqual(1500);
      expect(result.success).toBe(true);
    });

    it('CA-54.3: debe lograr una tasa de éxito >= 85% ante 20 comandos de prueba consecutivos', async () => {
      mockedAxios.post.mockResolvedValue({ data: { ok: true } });

      const testCommands = [
        'hola bot',
        '¿Cómo llego al hospital?',
        'quiero ir a la plaza',
        'micro al centro',
        '¿A qué hora pasa la micro?',
        'horarios de buses',
        'necesito un taxi',
        'número de radiotaxi',
        '/start',
        '/help',
        'cómo llegar al hospital santo tomas',
        'buses para la plaza 40 horas',
        'horario linea 01',
        'radiotaxi limache',
        'hola buenas tardes',
        'micro al hospital',
        'taxi al centro',
        'a que hora sale el primer bus',
        'quiero ir a un lugar desconocido',
        'gracias bot',
      ];

      let successfulResponses = 0;

      for (const cmd of testCommands) {
        const res = await activeService.syncTelegramEventWithRoutes(999000, cmd);
        if (res.success && res.latencyMs <= 1500 && res.replyText.length > 0) {
          successfulResponses++;
        }
      }

      const successRate = (successfulResponses / testCommands.length) * 100;
      expect(successRate).toBeGreaterThanOrEqual(85);
      expect(successfulResponses).toBe(20); // 100% de éxito logrado
    });
  });
});
