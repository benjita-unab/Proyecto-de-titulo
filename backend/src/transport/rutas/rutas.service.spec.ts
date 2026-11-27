import { Test, TestingModule } from '@nestjs/testing';
import { RutasService } from './rutas.service';
import { ConfigService } from '@nestjs/config';

describe('RutasService', () => {
  let service: RutasService;
  const createQuery = (result: any) => {
    const query: any = {
      select: jest.fn(),
      eq: jest.fn(),
      not: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.not.mockReturnValue(query);
    query.then = (resolve: (value: any) => void) => resolve(result);
    return query;
  };

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

  describe('getRoutesForDestination', () => {
    it('debe estructurar los datos en un formato de objetos { linea, recorrido, tipo } y no como texto plano pre-concatenado', async () => {
      // Mock de Supabase
      const mockData = [
        {
          nombre_recorrido: 'Centro',
          calles_principales: 'Calle 1, Calle 2, Hospital',
          fuente_url: 'https://mtt.gob.cl/ruta',
          evidencia_fuente: 'Línea 10: Calle 1, Calle 2, Hospital',
          medio_transporte: {
            nombre_linea: 'Línea 10',
            tipo_transporte: 'Micro',
          },
        },
      ];

      const query = createQuery({ data: mockData, error: null });
      const mockFrom = jest.fn().mockReturnValue(query);

      (service as any).supabase = { from: mockFrom };

      const result = await service.getRoutesForDestination('hospital');

      // Verificamos que se llame a supabase
      expect(mockFrom).toHaveBeenCalledWith('recorrido_transporte');
      expect(query.eq).toHaveBeenCalledWith('verificado', true);
      expect(query.not).toHaveBeenCalledWith('evidencia_fuente', 'is', null);

      // Validar que el retorno sea un objeto estructurado y NO un string plano pre-concatenado
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      
      const firstRoute = result[0];
      expect(typeof firstRoute).toBe('object');
      expect(firstRoute).toHaveProperty('linea', 'Línea 10');
      expect(firstRoute).toHaveProperty('recorrido', 'Calle 1, Calle 2, Hospital');
      expect(firstRoute).toHaveProperty('tipo', 'Micro');
      
      // Asegurarnos de que no sea un string
      expect(typeof firstRoute).not.toBe('string');
    });

    it('debe manejar errores de Supabase y devolver un arreglo vacío', async () => {
      const query = createQuery({ data: null, error: new Error('DB Error') });
      (service as any).supabase = { from: jest.fn().mockReturnValue(query) };

      const result = await service.getRoutesForDestination('error');
      expect(result).toEqual([]);
    });

    it('debe devolver un arreglo vacío si no hay coincidencias locales', async () => {
      const mockData = [
        {
          nombre_recorrido: 'Centro',
          calles_principales: 'Calle 1, Calle 2',
          medio_transporte: { nombre_linea: 'Línea 10' }
        }
      ];
      const query = createQuery({ data: mockData, error: null });
      (service as any).supabase = { from: jest.fn().mockReturnValue(query) };

      const result = await service.getRoutesForDestination('marte');
      expect(result).toEqual([]);
    });

    it('restringe las búsquedas al Hospital a recorridos marcados para ese destino', async () => {
      const query = createQuery({ data: [], error: null });
      (service as any).supabase = {
        from: jest.fn().mockReturnValue(query),
      };

      await service.getRoutesForDestination('Hospital de Quilpué');

      expect(query.eq).toHaveBeenCalledWith('pasa_hospital_quilpue', true);
    });

    it('no inventa recorridos cuando no hay registros respaldados', async () => {
      (service as any).supabase = null;
      await expect(service.getRoutesForDestination('Hospital de Quilpué')).resolves.toEqual([]);
    });
  });
});
