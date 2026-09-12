import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import axios from 'axios';
import { AudioTranscriptionService } from './audio-transcription.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AudioTranscriptionService', () => {
  let service: AudioTranscriptionService;
  let tempFilePath: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioTranscriptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return '';
              if (key === 'WHISPER_API_URL') return 'https://api.openai.com/v1/audio/transcriptions';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AudioTranscriptionService>(AudioTranscriptionService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // Ignorar errores de limpieza
      }
    }
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe arrojar error si la ruta del archivo es vacía', async () => {
    await expect(service.transcribeAudioFile('')).rejects.toThrow(
      'Ruta de archivo de audio no proporcionada.',
    );
  });

  it('debe arrojar error si el archivo no existe físicamente', async () => {
    const nonexistent = path.join(os.tmpdir(), 'nonexistent-audio-file.ogg');
    await expect(service.transcribeAudioFile(nonexistent)).rejects.toThrow(
      'El archivo de audio no existe',
    );
  });

  it('debe devolver cadena vacía si el archivo de audio tiene 0 bytes', async () => {
    tempFilePath = path.join(os.tmpdir(), `test-empty-${Date.now()}.ogg`);
    fs.writeFileSync(tempFilePath, Buffer.alloc(0));

    const result = await service.transcribeAudioFile(tempFilePath);
    expect(result).toBe('');
  });

  it('debe procesar el archivo mediante puente local de transcripción en entorno de pruebas', async () => {
    tempFilePath = path.join(os.tmpdir(), `test-audio-${Date.now()}.ogg`);
    fs.writeFileSync(tempFilePath, '¿Cómo llego al Hospital Santo Tomás?');

    const result = await service.transcribeAudioFile(tempFilePath);
    expect(result).toBe('¿Cómo llego al Hospital Santo Tomás?');
  });

  it('debe llamar a la API externa de Whisper si se proporciona OPENAI_API_KEY', async () => {
    const externalModule: TestingModule = await Test.createTestingModule({
      providers: [
        AudioTranscriptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'sk-mock-key-12345';
              return null;
            }),
          },
        },
      ],
    }).compile();

    const externalService = externalModule.get<AudioTranscriptionService>(
      AudioTranscriptionService,
    );

    tempFilePath = path.join(os.tmpdir(), `test-whisper-${Date.now()}.ogg`);
    fs.writeFileSync(tempFilePath, 'mock audio bytes binary content');

    mockedAxios.post.mockResolvedValueOnce({
      data: { text: 'horarios de la linea 01' },
    });

    const result = await externalService.transcribeAudioFile(tempFilePath);

    expect(result).toBe('horarios de la linea 01');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('audio/transcriptions'),
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-mock-key-12345',
        }),
      }),
    );
  });

  it('debe degradar a puente simulado si la API externa falla con error de red', async () => {
    const externalModule: TestingModule = await Test.createTestingModule({
      providers: [
        AudioTranscriptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'sk-mock-key-12345';
              return null;
            }),
          },
        },
      ],
    }).compile();

    const externalService = externalModule.get<AudioTranscriptionService>(
      AudioTranscriptionService,
    );

    tempFilePath = path.join(os.tmpdir(), `test-fail-${Date.now()}.ogg`);
    fs.writeFileSync(tempFilePath, 'quiero ir a la plaza de limache');

    mockedAxios.post.mockRejectedValueOnce(new Error('Whisper API connection timeout'));

    const result = await externalService.transcribeAudioFile(tempFilePath);

    // No debe lanzar excepción no controlada, degrada al puente con el contenido disponible
    expect(result).toBe('quiero ir a la plaza de limache');
  });
});
