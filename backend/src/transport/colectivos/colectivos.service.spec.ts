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
    it('debe devolver todas las líneas de colectivos de contingencia si no se especifica filtro', async () => {
      const colectivos = await service.getColectivos();
      expect(colectivos).toBeDefined();
      expect(Array.isArray(colectivos)).toBe(true);
      expect(colectivos.length).toBeGreaterThanOrEqual(5);

      colectivos.forEach((c) => {
        expect(c.numeroLinea).toBeDefined();
        expect(c.nombreLinea).toBeDefined();
        expect(c.tarifaAdultoMayor).toBeGreaterThan(0);
        expect(c.tarifaDiurna).toBeGreaterThan(0);
        expect(c.horarioInicio).toBeDefined();
        expect(c.horarioTermino).toBeDefined();
      });
    });

    it('debe filtrar colectivos por destino relevante (ej. Los Pinos o Belloto)', async () => {
      const pinos = await service.getColectivos('Los Pinos');
      expect(pinos.length).toBeGreaterThan(0);
      expect(pinos.some((c) => c.destino.toLowerCase().includes('pinos') || c.trazadoIda.toLowerCase().includes('pinos'))).toBe(true);

      const belloto = await service.getColectivos('Belloto');
      expect(belloto.length).toBeGreaterThan(0);
    });

    it('debe soportar busqueda sin acentos ni distincion de mayusculas', async () => {
      const resAcento = await service.getColectivos('quilpue');
      const resMayus = await service.getColectivos('QUILPUÉ');
      expect(resAcento.length).toBe(resMayus.length);
      expect(resAcento.length).toBeGreaterThan(0);
    });

    it('debe usar catalogo de contingencia si Supabase no esta disponible o falla', async () => {
      (service as any).supabase = null;
      const colectivos = await service.getColectivos();
      expect(colectivos.length).toBeGreaterThanOrEqual(5);
      expect(colectivos[0].comuna).toBe('Quilpué');
    });
  });

  describe('getPuntosEsperaColectivo', () => {
    it('debe devolver todos los puntos de espera si no se especifica linea', () => {
      const paradas = service.getPuntosEsperaColectivo();
      expect(paradas.length).toBeGreaterThanOrEqual(5);
      paradas.forEach((p) => {
        expect(p.idParada).toBeDefined();
        expect(p.latitud).toBeLessThan(0);
        expect(p.longitud).toBeLessThan(0);
        expect(p.lineaColectivo).toBeDefined();
      });
    });

    it('debe filtrar puntos de espera asociados a una linea especifica', () => {
      const paradasLinea1 = service.getPuntosEsperaColectivo('Línea 1');
      expect(paradasLinea1.length).toBeGreaterThan(0);
      paradasLinea1.forEach((p) => {
        expect(p.lineaColectivo).toContain('Línea 1');
      });
    });
  });
});
