import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GeminiService } from '../../src/nlp/gemini.service';
import { MqttService } from '../../src/mqtt/mqtt.service';
import { DatabaseManagerService } from '../../src/transport/database/database-manager.service';
import { performance } from 'perf_hooks';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HU #6 - Nivel 2: Pruebas de Integración de Pipeline de IA, Fallbacks y MQTT (T21)', () => {
  let app: INestApplication;
  let geminiService: GeminiService;
  let mqttService: MqttService;
  let dbManager: DatabaseManagerService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    geminiService = moduleFixture.get<GeminiService>(GeminiService);
    mqttService = moduleFixture.get<MqttService>(MqttService);
    dbManager = moduleFixture.get<DatabaseManagerService>(DatabaseManagerService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Pipeline Completo con IA Activa (Mock Gemini HTTPS)', () => {
    it('debe interpretar consulta, consultar rutas y publicar eventos de inicio y fin en MQTT', async () => {
      let incomingEventReceived = false;
      let outgoingEventReceived = false;

      mqttService.subscribe(mqttService.getIncomingTopic(), () => {
        incomingEventReceived = true;
      });
      mqttService.subscribe(mqttService.getOutgoingTopic(), () => {
        outgoingEventReceived = true;
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      intent: 'Buscar Ruta',
                      destination: 'Plaza de Quilpué',
                      respuestaModelada: '¡Con gusto le ayudo a llegar a la Plaza de Quilpué!',
                    }),
                  },
                ],
              },
            },
          ],
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/chat')
        .send({ text: 'cómo llego a la Plaza de Quilpué', userId: 'user_ai_success' })
        .expect(201);

      await new Promise((r) => setTimeout(r, 50));

      expect(res.body).toBeDefined();
      expect(res.body.text).toContain('Plaza de Quilpué');
      expect(incomingEventReceived).toBe(true);
      expect(outgoingEventReceived).toBe(true);
    });
  });

  describe('2. Pipeline con Gemini Caído (Simulación 503 / Timeout -> Respaldo Nivel 1)', () => {
    it('debe conmutar en < 1s a Respaldo Nivel 1 (NLP local) con respuesta amigable sin errores técnicos', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 503 },
        message: 'Service Unavailable',
      });

      const t0 = performance.now();
      const res = await request(app.getHttpServer())
        .post('/api/chat')
        .send({ text: 'quiero ir al Hospital de Quilpué', userId: 'user_fallback_test' })
        .expect(201);
      const t1 = performance.now();

      expect(t1 - t0).toBeLessThan(1000);
      expect(res.body).toBeDefined();
      expect(res.body.text).toContain('Hospital de Quilpué');

      // Verificación de transparencia: ninguna traza ni código de error técnico visible
      expect(res.body.text).not.toContain('503');
      expect(res.body.text).not.toContain('Service Unavailable');
      expect(res.body.text).not.toContain('Error:');
      expect(res.body.text).not.toContain('exception');
    });
  });

  describe('3. Pipeline con Gemini Caído y Destino Incomprensible (Respaldo Nivel 2)', () => {
    it('debe conmutar a Respaldo Nivel 2 ofreciendo puntos conocidos de Marga Marga', async () => {
      mockedAxios.post.mockRejectedValue({ message: 'timeout of 2000ms exceeded' });

      const res = await request(app.getHttpServer())
        .post('/api/chat')
        .send({
          text: 'esto es una consulta sumamente confusa con muchas palabras que no indican destino',
          userId: 'user_level2_fallback',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.text).toContain('Hospital de Quilpué');
      expect(res.body.text).toContain('Los Pinos');
      expect(res.body.text).not.toContain('timeout');
    });
  });

  describe('4. Pipeline de Base de Datos con Supabase Caído (Failover SQLite)', () => {
    it('debe resolver consultas de transporte desde el respaldo SQLite local sin pérdida de funcionalidad', async () => {
      (dbManager as any).isSupabaseHealthy = false;
      (dbManager as any).localSqliteStore.rutas = [
        { id: 'R-1', linea: '111', destino: 'Hospital de Quilpué', activo: true, trazado: 'Troncal' },
      ];

      const resultado = await dbManager.queryWithFailover(
        'rutas',
        async () => {
          throw new Error('Supabase Down');
        },
        (r) => r.destino.includes('Hospital'),
      );

      expect(resultado).toBeDefined();
      expect(resultado.source).toBe('sqlite');
      expect(resultado.data.length).toBeGreaterThan(0);
      expect(resultado.data[0].linea).toBe('111');
    });
  });

  describe('5. Medición de Latencia en Fallback Nivel 1 (30 consultas, P95 <= 500 ms)', () => {
    it(
      'debe procesar 30 consultas consecutivas con respaldo Nivel 1 manteniendo P95 <= 500 ms',
      async () => {
        // Forzar fallback Nivel 1 y base local para medir rendimiento puro del motor sin latencia de red externa
        (geminiService as any).apiKey = '';
        const rutasService = app.get(require('../../src/transport/rutas/rutas.service').RutasService);
        const originalSupabase = (rutasService as any).supabase;
        (rutasService as any).supabase = null;

        const latencias: number[] = [];
        const totalConsultas = 30;

        for (let i = 0; i < totalConsultas; i++) {
          const t0 = performance.now();
          await request(app.getHttpServer())
            .post('/api/chat')
            .send({ text: `quiero ir al Hospital ${i % 3}`, userId: `perf_ia_${i}` })
            .expect(201);
          const t1 = performance.now();
          latencias.push(t1 - t0);
        }

        (rutasService as any).supabase = originalSupabase;

        latencias.sort((a, b) => a - b);
        const min = Math.round(latencias[0]);
        const max = Math.round(latencias[latencias.length - 1]);
        const avg = Math.round(latencias.reduce((a, b) => a + b, 0) / latencias.length);
        const p95 = Math.round(latencias[Math.floor(latencias.length * 0.95)]);

        console.log(`\n--- BENCHMARK LATENCIA PIPELINE IA / FALLBACK NIVEL 1 (30 Consultas) ---`);
        console.log(`Mínimo: ${min} ms | Máximo: ${max} ms | Promedio: ${avg} ms | P95: ${p95} ms`);

        expect(p95).toBeLessThanOrEqual(500);
      },
      30000,
    );
  });
});
