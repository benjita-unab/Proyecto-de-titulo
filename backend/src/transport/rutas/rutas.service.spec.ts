import { Test, TestingModule } from '@nestjs/testing';
import { RutasService } from './rutas.service';
import { ConfigService } from '@nestjs/config';

describe('RutasService', () => {
  let service: RutasService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://mock.supabase.co';
        if (key === 'SUPABASE_KEY') return 'mock-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RutasService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RutasService>(RutasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
