import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ComparativeFlowService } from '../../src/chat/comparative-flow.service';
import { performance } from 'perf_hooks';

describe('HU #2 - Nivel 2: Pruebas de Integración de Flujo Interactivo en Dos Pasos (T17)', () => {
  let app: INestApplication;
  let comparativeService: ComparativeFlowService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    comparativeService = moduleFixture.get<ComparativeFlowService>(ComparativeFlowService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Flujo Conversacional Completo de 2 Pasos (Web / WhatsApp)', () => {
    it('Paso 1: Consulta inicial debe entregar resumen comparativo de 3 modalidades', async () => {
      const resPaso1 = await request(app.getHttpServer())
        .post('/api/chat')
        .send({
          text: 'cómo llego a Plaza Quilpué',
          userId: 'user_flow_complete',
          comparative: true,
        })
        .expect(201);

      expect(resPaso1.body).toBeDefined();
      expect(resPaso1.body.text).toContain('Microbús');
      expect(resPaso1.body.text).toContain('Colectivo');
      expect(resPaso1.body.text).toContain('Radio Taxi');
      expect(resPaso1.body.options).toBeDefined();
      expect(resPaso1.body.options).toHaveLength(3);
    });

    it('Paso 2: Selección numérica "2" (Colectivo) debe desplegar el desglose específico de colectivos', async () => {
      const resPaso2 = await request(app.getHttpServer())
        .post('/api/chat')
        .send({
          text: '2',
          userId: 'user_flow_complete',
        })
        .expect(201);

      expect(resPaso2.body).toBeDefined();
      expect(resPaso2.body.text).toContain('Líneas de Colectivos');
      expect(resPaso2.body.text).toContain('Tarifa Adulto Mayor');
      expect(resPaso2.body.options).toBeDefined();
    });
  });

  describe('2. Desglose Específico para Modalidad 1 (Microbús) y Modalidad 3 (Radio Taxi)', () => {
    it('Paso 2 con Opción 1 ("micro") debe retornar líneas de microbuses y paradas', async () => {
      comparativeService.setSessionDestination('user_micro_test', 'Hospital de Quilpué');

      const res = await request(app.getHttpServer())
        .post('/api/chat')
        .send({ text: '1', userId: 'user_micro_test' })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.text).toContain('Hospital de Quilpué');
      expect(res.body.routes || res.body.text).toBeTruthy();
    });

    it('Paso 2 con Opción 3 ("taxi") debe retornar centrales autorizadas con número telefónico para marcar', async () => {
      comparativeService.setSessionDestination('user_taxi_test', 'Feria El Belloto');

      const res = await request(app.getHttpServer())
        .post('/api/chat')
        .send({ text: '3', userId: 'user_taxi_test' })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.showRadioTaxis).toBe(true);
      expect(res.body.taxis).toBeDefined();
      expect(res.body.taxis.length).toBeGreaterThan(0);
      expect(res.body.taxis[0].telefonoFormateado).toMatch(/\+56/);
    });
  });

  describe('3. Simulación de Interacción por Telegram (Callback Data)', () => {
    it('debe resolver la selección directa mediante callback_data (sel_col_Plaza)', async () => {
      const selection = await comparativeService.processSelection('user_tg_callback', 'sel_col_Plaza');

      expect(selection).toBeDefined();
      expect(selection?.selectedType).toBe('colectivo');
      expect(selection?.telegram).toBeDefined();
      expect(selection?.telegram.text).toContain('LÍNEAS DE COLECTIVOS');
      expect(selection?.telegram.text).toContain('PLAZA');
    });

    it('debe resolver selección de radiotaxi mediante callback_data (sel_taxi_Hospital)', async () => {
      const selection = await comparativeService.processSelection('user_tg_taxicall', 'sel_taxi_Hospital');

      expect(selection).toBeDefined();
      expect(selection?.selectedType).toBe('radiotaxi');
      expect(selection?.telegram).toBeDefined();
      expect(selection?.web.showRadioTaxis).toBe(true);
      expect(selection?.web.taxis.length).toBeGreaterThan(0);
    });
  });

  describe('4. Resiliencia y Manejo de Sesión Expirada o Sin Contexto', () => {
    it('si el usuario envía "2" sin sesión previa, debe resolver amigablemente sin error 500', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/chat')
        .send({ text: '2', userId: 'user_sin_sesion_123' })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.text).toBeTruthy();
      expect(res.body.text).toContain('Líneas de Colectivos');
    });
  });

  describe('5. Medición de Latencia en Ambos Pasos (P95 <= 1.5 s)', () => {
    it(
      'debe medir la latencia de Paso 1 y Paso 2 en 15 ciclos con P95 <= 1500 ms',
      async () => {
        const latenciasPaso1: number[] = [];
        const latenciasPaso2: number[] = [];
        const totalCiclos = 15;

        for (let i = 0; i < totalCiclos; i++) {
          const uId = `perf_flow_user_${i}`;

          // Medir Paso 1
          const t0 = performance.now();
          await request(app.getHttpServer())
            .post('/api/chat/comparative')
            .send({ destination: 'Hospital de Quilpué', userId: uId })
            .expect(201);
          const t1 = performance.now();
          latenciasPaso1.push(t1 - t0);

          // Medir Paso 2
          await request(app.getHttpServer())
            .post('/api/chat')
            .send({ text: '2', userId: uId })
            .expect(201);
          const t2 = performance.now();
          latenciasPaso2.push(t2 - t1);
        }

        latenciasPaso1.sort((a, b) => a - b);
        latenciasPaso2.sort((a, b) => a - b);

        const p95Paso1 = Math.round(latenciasPaso1[Math.floor(latenciasPaso1.length * 0.95)]);
        const p95Paso2 = Math.round(latenciasPaso2[Math.floor(latenciasPaso2.length * 0.95)]);
        const avgPaso1 = Math.round(latenciasPaso1.reduce((a, b) => a + b, 0) / latenciasPaso1.length);
        const avgPaso2 = Math.round(latenciasPaso2.reduce((a, b) => a + b, 0) / latenciasPaso2.length);

        console.log(`\n--- BENCHMARK LATENCIA FLUJO INTERACTIVO (15 Ciclos) ---`);
        console.log(`Paso 1 (Resumen Comparativo): Promedio = ${avgPaso1} ms | P95 = ${p95Paso1} ms`);
        console.log(`Paso 2 (Desglose Modalidad):  Promedio = ${avgPaso2} ms | P95 = ${p95Paso2} ms`);

        expect(p95Paso1).toBeLessThanOrEqual(1500);
        expect(p95Paso2).toBeLessThanOrEqual(1500);
      },
      35000,
    );
  });
});
