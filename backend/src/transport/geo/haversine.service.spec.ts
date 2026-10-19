import { Test, TestingModule } from '@nestjs/testing';
import { HaversineService } from './haversine.service';

describe('HaversineService', () => {
  let service: HaversineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HaversineService],
    }).compile();

    service = module.get<HaversineService>(HaversineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDistance', () => {
    it('debe devolver 0 metros para el mismo punto', () => {
      const dist = service.calculateDistance(-33.0483, -71.4431, -33.0483, -71.4431);
      expect(dist).toBe(0);
    });

    it('debe ser simetrica entre dos coordenadas', () => {
      const d1 = service.calculateDistance(-33.0483, -71.4431, -33.0442, -71.4285);
      const d2 = service.calculateDistance(-33.0442, -71.4285, -33.0483, -71.4431);
      expect(d1).toBe(d2);
      expect(d1).toBeGreaterThan(1000);
      expect(d1).toBeLessThan(2000);
    });
  });

  describe('validateCoordinates', () => {
    it('debe aceptar coordenadas validas en la zona de Quilpue y Region de Valparaiso', () => {
      expect(service.validateCoordinates(-33.0483, -71.4431)).toBe(true);
      expect(service.validateCoordinates('-33.0483', '-71.4431')).toBe(true);
    });

    it('debe rechazar coordenadas fuera de rango lat/lng', () => {
      expect(service.validateCoordinates(95, -71.4431)).toBe(false);
      expect(service.validateCoordinates(-33.0483, 195)).toBe(false);
    });

    it('debe rechazar valores no numericos, null o indefinidos', () => {
      expect(service.validateCoordinates(NaN, -71.4431)).toBe(false);
      expect(service.validateCoordinates('invalido', -71.4431)).toBe(false);
      expect(service.validateCoordinates(null, null)).toBe(false);
    });

    it('debe rechazar coordenadas fuera de Chile', () => {
      // Coordenadas de Paris, Francia
      expect(service.validateCoordinates(48.8566, 2.3522)).toBe(false);
    });
  });

  describe('generateGoogleMapsLink y generateWalkingDirectionsLink', () => {
    it('debe generar enlace estandar a Google Maps sin APIs de pago', () => {
      const url = service.generateGoogleMapsLink(-33.0483, -71.4431);
      expect(url).toContain('https://maps.google.com/?q=-33.0483,-71.4431');
    });

    it('debe generar enlace de navegacion a pie', () => {
      const url = service.generateWalkingDirectionsLink(-33.048, -71.443, -33.044, -71.428);
      expect(url).toContain('saddr=-33.048,-71.443');
      expect(url).toContain('daddr=-33.044,-71.428');
    });
  });

  describe('findClosestStop', () => {
    it('debe encontrar la parada mas cercana en el catalogo para la Plaza de Quilpue', async () => {
      // Cerca de la Plaza de Quilpue (-33.0483, -71.4431)
      const res = await service.findClosestStop(-33.0482, -71.4430);
      expect(res).toBeDefined();
      expect(res?.parada).toBeDefined();
      expect(res?.distanciaMetros).toBeLessThan(100);
      expect(res?.googleMapsUrl).toBeDefined();
    });

    it('debe ampliar el radio si la distancia supera el radio inicial sin arrojar error', async () => {
      // Punto retirado en zona rural / cerro
      const res = await service.findClosestStop(-33.0900, -71.4200, { radioInicialMetros: 200 });
      expect(res).toBeDefined();
      expect(res?.radioAmpliado).toBe(true);
    });

    it('debe filtrar exclusivamente paradas seguras cuando soloPuntosSeguros es true', async () => {
      const res = await service.findClosestStop(-33.0483, -71.4431, { soloPuntosSeguros: true });
      expect(res).toBeDefined();
      expect(res?.parada.esPuntoSeguro).toBe(true);
    });

    it('debe lanzar excepcion si se envian coordenadas invalidas', async () => {
      await expect(service.findClosestStop(100, -71.4431)).rejects.toThrow(
        'Coordenadas geográficas inválidas o fuera de rango.',
      );
    });
  });
});
