import { Test, TestingModule } from '@nestjs/testing';
import { ColectivosService } from './colectivos.service';

describe('ColectivosService', () => {
  let service: ColectivosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColectivosService],
    }).compile();

    service = module.get<ColectivosService>(ColectivosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getColectivos', () => {
    it('no publica el catálogo local que carece de fuentes verificadas', async () => {
      const colectivos = await service.getColectivos();
      expect(colectivos).toBeDefined();
      expect(colectivos).toEqual([]);
    });

    it('publica sólo registros de Supabase con evidencia y fuente HTTPS', async () => {
      const verifiedRecord = {
        id_colectivo: 'COL-TEST',
        numero_linea: 'Línea verificada',
        nombre_linea: 'Línea verificada',
        comuna: 'Quilpué',
        origen: 'Origen',
        destino: 'Los Pinos',
        trazado_ida: 'Origen a Los Pinos',
        trazado_regreso: 'Los Pinos a Origen',
        frecuencia_minutos: 10,
        horario_inicio: '06:00',
        horario_termino: '22:00',
        tarifa_diurna: 900,
        tarifa_nocturna: 1100,
        tarifa_adulto_mayor: 450,
        accesible_adulto_mayor: true,
        paraderos_principales: 'Centro',
        verificado: true,
        fuente_url: 'https://mtt.gob.cl/registro',
        evidencia_fuente: 'Línea verificada: Origen a Los Pinos',
      };
      const query: any = {
        select: jest.fn(),
        eq: jest.fn(),
        not: jest.fn(),
      };
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      query.not.mockReturnValue(query);
      query.then = (resolve: (value: any) => void) =>
        resolve({ data: [verifiedRecord], error: null });
      (service as any).supabase = {
        from: jest.fn().mockReturnValue(query),
      };

      const colectivos = await service.getColectivos('Los Pinos');
      expect(colectivos).toHaveLength(1);
      expect(colectivos[0].fuenteUrl).toBe('https://mtt.gob.cl/registro');
      expect(query.eq).toHaveBeenCalledWith('verificado', true);
    });
  });

  describe('getPuntosEsperaColectivo', () => {
    it('no publica puntos de espera sin verificación de fuente', () => {
      const paradas = service.getPuntosEsperaColectivo();
      expect(paradas).toEqual([]);
    });
  });
});
