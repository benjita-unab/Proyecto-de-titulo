import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { HaversineService } from '../../src/transport/geo/haversine.service';

describe('HU #3 - Nivel 2: Pruebas de Integración de Endpoints de Ubicación (T9)', () => {
  let app: INestApplication<App>;
  let haversineService: HaversineService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    haversineService = moduleFixture.get<HaversineService>(HaversineService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Endpoint Seguro de Recepción de Coordenadas (POST /api/chat/location)', () => {
    it('debe recibir evento de ubicación válido y devolver la parada más cercana con formato amigable', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chat/location')
        .send({
          latitude: -33.0480,
          longitude: -71.4425,
          destination: 'Hospital de Quilpué',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.text).toContain('Parada más cercana');
      expect(res.body.text).toContain('Plaza Manuel Blanco Encalada');
      expect(res.body.text).toContain('https://maps.google.com');
    });

    it('debe rechazar eventos con coordenadas geográficas inválidas o fuera de rango (HTTP 400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chat/location')
        .send({
          latitude: 999, // Latitud imposible
          longitude: -71.4425,
        })
        .expect(400);

      expect(res.body).toBeDefined();
      expect(res.body.message).toContain('Coordenadas geográficas inválidas');
    });

    it('debe rechazar coordenadas fuera de la zona permitida de Chile (HTTP 400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chat/location')
        .send({
          latitude: 40.7128, // Nueva York
          longitude: -74.0060,
        })
        .expect(400);

      expect(res.body.message).toContain('Coordenadas geográficas inválidas');
    });

    it('debe retornar punto seguro y centrales autorizadas cuando forTaxi es true', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chat/location')
        .send({
          latitude: -33.0480,
          longitude: -71.4425,
          forTaxi: true,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.text).toContain('Punto seguro de espera');
      expect(res.body.text).toContain('Radio Taxi');
    });
  });

  describe('2. Consulta por Radio e Índices Espaciales / Persistencia', () => {
    it('debe consultar paradas reales manteniendo coherencia geodésica con HaversineService', async () => {
      const paradas = await haversineService.getParadasList();
      expect(paradas).toBeDefined();
      expect(paradas.length).toBeGreaterThan(0);

      // Verificar que cada parada tenga coordenadas válidas
      for (const p of paradas) {
        expect(haversineService.validateCoordinates(p.latitud, p.longitud)).toBe(true);
        expect(p.nombre).toBeDefined();
        expect(p.comuna).toBeDefined();
      }
    });
  });

  describe('3. Medición de Rendimiento y Latencia (50 consultas, P95 <= 500 ms)', () => {
    it('debe responder 50 consultas de ubicación consecutivas con P95 <= 500 ms sin errores', async () => {
      const NUM_CONSULTAS = 50;
      const tiempos: number[] = [];

      // Coordenadas variadas dentro de Quilpué y alrededores
      const puntos = [
        { lat: -33.0480, lng: -71.4425 }, // Plaza Quilpué
        { lat: -33.0445, lng: -71.4435 }, // Estación Quilpué
        { lat: -33.0510, lng: -71.4330 }, // Feria El Belloto
        { lat: -33.0416, lng: -71.4395 }, // Hospital de Quilpué
        { lat: -33.0560, lng: -71.4380 }, // Los Pinos
      ];

      for (let i = 0; i < NUM_CONSULTAS; i++) {
        const punto = puntos[i % puntos.length];
        const tInicio = performance.now();

        const res = await request(app.getHttpServer())
          .post('/api/chat/location')
          .send({
            latitude: punto.lat,
            longitude: punto.lng,
            destination: 'Hospital de Quilpué',
          });

        const tFin = performance.now();
        tiempos.push(tFin - tInicio);

        expect(res.status).toBe(201);
      }

      // Ordenar tiempos de menor a mayor para cálculo estadístico
      tiempos.sort((a, b) => a - b);

      const min = tiempos[0];
      const max = tiempos[tiempos.length - 1];
      const suma = tiempos.reduce((acc, val) => acc + val, 0);
      const promedio = Math.round((suma / tiempos.length) * 10) / 10;
      // Percentil 95
      const idxP95 = Math.floor(tiempos.length * 0.95);
      const p95 = Math.round(tiempos[idxP95] * 10) / 10;

      // Log formal de medición
      // console.log(`[T9 Medición 50 consultas] Promedio: ${promedio}ms, Min: ${min.toFixed(1)}ms, Max: ${max.toFixed(1)}ms, P95: ${p95}ms`);

      expect(p95).toBeLessThanOrEqual(500);
      expect(promedio).toBeLessThanOrEqual(500);
    }, 30000); // Timeout amplio para 50 llamadas HTTP
  });
});
