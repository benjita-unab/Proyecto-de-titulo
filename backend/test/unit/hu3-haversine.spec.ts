import { HaversineService } from '../../src/transport/geo/haversine.service';
import { ParadaData } from '../../src/transport/geo/paradas-catalogo';

describe('HU #3 - Nivel 1: Pruebas Unitarias de HaversineService (T8)', () => {
  let service: HaversineService;

  beforeEach(() => {
    // Instanciar servicio sin ConfigService para operar en modo local simulado puro
    service = new HaversineService();
  });

  describe('1. Cálculo de Distancia Geodésica y Precisión (Error < 10m)', () => {
    it('debe calcular caso determinista de 0.001 grados de latitud con error < 10m (~111.2m)', () => {
      // 0.001° de latitud equivale a (6371000 * 0.001 * PI / 180) = 111.19 m
      const distanciaEsperadaIndependiente = 111.19;
      const lat1 = 0;
      const lon1 = 0;
      const lat2 = 0.001;
      const lon2 = 0;

      const resultado = service.calculateDistance(lat1, lon1, lat2, lon2);
      const error = Math.abs(resultado - distanciaEsperadaIndependiente);

      expect(error).toBeLessThan(10);
      expect(resultado).toBeCloseTo(111.2, 0);
    });

    it('debe calcular con referencia independiente Plaza Quilpué -> Estación Quilpué con error < 10m', () => {
      // Plaza Quilpué: (-33.0480, -71.4425), Estación Quilpué: (-33.0445, -71.4435)
      // Distancia geodésica elipsoidal / cálculo de referencia independiente ≈ 400.1 metros
      const distanciaReferenciaIndependiente = 400.1;
      const dist = service.calculateDistance(-33.0480, -71.4425, -33.0445, -71.4435);
      const error = Math.abs(dist - distanciaReferenciaIndependiente);

      expect(error).toBeLessThan(10);
    });

    it('debe calcular con referencia independiente Plaza Quilpué -> Hospital de Quilpué con error < 10m', () => {
      // Plaza Quilpué: (-33.0480, -71.4425), Hospital Quilpué: (-33.0416, -71.4395)
      // Distancia de referencia independiente ≈ 764.5 metros
      const distanciaReferenciaIndependiente = 764.5;
      const dist = service.calculateDistance(-33.0480, -71.4425, -33.0416, -71.4395);
      const error = Math.abs(dist - distanciaReferenciaIndependiente);

      expect(error).toBeLessThan(10);
    });
  });

  describe('2. Casos Bordes y Simetría', () => {
    it('debe retornar 0 metros cuando se compara el mismo punto (distancia cero)', () => {
      const lat = -33.0480;
      const lon = -71.4425;
      const dist = service.calculateDistance(lat, lon, lat, lon);
      expect(dist).toBe(0);
    });

    it('debe cumplir la propiedad de simetría d(A, B) = d(B, A)', () => {
      const p1 = { lat: -33.0480, lon: -71.4425 };
      const p2 = { lat: -33.0510, lon: -71.4330 }; // Feria El Belloto

      const d12 = service.calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
      const d21 = service.calculateDistance(p2.lat, p2.lon, p1.lat, p1.lon);

      expect(d12).toBe(d21);
    });

    it('debe operar con coordenadas negativas de Chile (hemisferio sur / occidental)', () => {
      const dist = service.calculateDistance(-33.0450, -71.4400, -33.0480, -71.4425);
      expect(dist).toBeGreaterThan(0);
      expect(isNaN(dist)).toBe(false);
    });

    it('debe calcular distancias a puntos lejanos sin desbordamiento numérico', () => {
      // Quilpué a Tokyo (35.6762, 139.6503) ≈ 17.200 km
      const dist = service.calculateDistance(-33.0480, -71.4425, 35.6762, 139.6503);
      expect(dist).toBeGreaterThan(17000000);
      expect(dist).toBeLessThan(18000000);
    });
  });

  describe('3. Validación de Coordenadas Geográficas', () => {
    it('debe aceptar coordenadas válidas dentro del rango central de Chile', () => {
      expect(service.validateCoordinates(-33.0480, -71.4425)).toBe(true);
      expect(service.validateCoordinates(-33.0510, -71.4330)).toBe(true);
    });

    it('debe rechazar latitudes fuera del rango [-90, 90]', () => {
      expect(service.validateCoordinates(95, -71.4425)).toBe(false);
      expect(service.validateCoordinates(-95, -71.4425)).toBe(false);
    });

    it('debe rechazar longitudes fuera del rango [-180, 180]', () => {
      expect(service.validateCoordinates(-33.0480, 185)).toBe(false);
      expect(service.validateCoordinates(-33.0480, -185)).toBe(false);
    });

    it('debe rechazar valores nulos, undefined, NaN o strings no numéricos', () => {
      expect(service.validateCoordinates(null, -71.4425)).toBe(false);
      expect(service.validateCoordinates(-33.0480, undefined)).toBe(false);
      expect(service.validateCoordinates(NaN, -71.4425)).toBe(false);
      expect(service.validateCoordinates('invalido', 'lat')).toBe(false);
    });

    it('debe lanzar error al invocar findClosestStop con coordenadas inválidas', async () => {
      await expect(service.findClosestStop(999, -71.4425)).rejects.toThrow(
        'Coordenadas geográficas inválidas o fuera de rango.',
      );
    });
  });

  describe('4. Filtro de 500m y Ampliación Progresiva del Radio', () => {
    const paradasSimuladas: ParadaData[] = [
      {
        idParada: 'PAR-01',
        codigoParada: 'P01',
        nombre: 'Parada Cercana (a 200m)',
        direccion: 'Calle 1',
        latitud: -33.0480,
        longitud: -71.4403, // ~205m
        comuna: 'Quilpué',
        esPuntoSeguro: false,
      },
      {
        idParada: 'PAR-02',
        codigoParada: 'P02',
        nombre: 'Parada Lejana (a 800m)',
        direccion: 'Calle 2',
        latitud: -33.0480,
        longitud: -71.4339, // ~800m
        comuna: 'Quilpué',
        esPuntoSeguro: true,
      },
    ];

    it('debe seleccionar la parada más cercana dentro del radio inicial de 500m sin ampliar', async () => {
      jest.spyOn(service, 'getParadasList').mockResolvedValue(paradasSimuladas);

      const res = await service.findClosestStop(-33.0480, -71.4425, { radioInicialMetros: 500 });
      expect(res).not.toBeNull();
      expect(res?.parada.idParada).toBe('PAR-01');
      expect(res?.radioAmpliado).toBe(false);
      expect(res?.radioAplicadoMetros).toBe(500);
      expect(res?.distanciaMetros).toBeLessThanOrEqual(500);
    });

    it('debe ampliar progresivamente el radio en pasos de 500m cuando la parada más cercana supera 500m', async () => {
      // Simular que solo existe la parada lejana (~800m)
      jest.spyOn(service, 'getParadasList').mockResolvedValue([paradasSimuladas[1]]);

      const res = await service.findClosestStop(-33.0480, -71.4425, { radioInicialMetros: 500 });
      expect(res).not.toBeNull();
      expect(res?.parada.idParada).toBe('PAR-02');
      expect(res?.radioAmpliado).toBe(true);
      // Math.ceil(800 / 500) * 500 = 1000m
      expect(res?.radioAplicadoMetros).toBe(1000);
    });

    it('debe retornar null sin lanzar error si no existe ninguna parada disponible', async () => {
      jest.spyOn(service, 'getParadasList').mockResolvedValue([]);

      const res = await service.findClosestStop(-33.0480, -71.4425);
      expect(res).toBeNull();
    });
  });

  describe('5. Puntos Seguros de Radiotaxi y Enlaces a Google Maps', () => {
    it('debe filtrar exclusivamente puntos seguros cuando soloPuntosSeguros es true', async () => {
      const paradas: ParadaData[] = [
        {
          idParada: 'P-INSEGURA',
          nombre: 'Parada Común',
          latitud: -33.0480,
          longitud: -71.4420,
          comuna: 'Quilpué',
          esPuntoSeguro: false,
        },
        {
          idParada: 'P-SEGURO',
          nombre: 'Comisaría Quilpué',
          latitud: -33.0480,
          longitud: -71.4410,
          comuna: 'Quilpué',
          esPuntoSeguro: true,
        },
      ];
      jest.spyOn(service, 'getParadasList').mockResolvedValue(paradas);

      const res = await service.findClosestStop(-33.0480, -71.4425, { soloPuntosSeguros: true });
      expect(res).not.toBeNull();
      expect(res?.parada.idParada).toBe('P-SEGURO');
      expect(res?.parada.esPuntoSeguro).toBe(true);
    });

    it('debe generar enlaces universales a Google Maps sin causar error 404', () => {
      const mapsUrl = service.generateGoogleMapsLink(-33.0480, -71.4425);
      expect(mapsUrl).toBe('https://maps.google.com/?q=-33.048,-71.4425');

      const walkingUrl = service.generateWalkingDirectionsLink(-33.0480, -71.4425, -33.0483, -71.4431);
      expect(walkingUrl).toContain('maps.google.com/maps?saddr=-33.048,-71.4425&daddr=-33.0483,-71.4431&dirflg=w');
    });
  });

  describe('6. Rendimiento y Tiempo de Ejecución (<= 50 ms)', () => {
    it('debe ejecutar el cálculo puro de Haversine en <= 50 ms', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        service.calculateDistance(-33.0480 + i * 0.0001, -71.4425, -33.0510, -71.4330);
      }
      const totalTime = performance.now() - start;
      const averageTime = totalTime / 100;

      expect(averageTime).toBeLessThanOrEqual(50);
    });
  });
});
