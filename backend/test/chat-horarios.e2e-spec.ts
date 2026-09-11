import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Chat & Horarios Integration (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/chat - debe responder consulta de horarios generales en servicio', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chat')
      .send({
        text: '¿Cuáles son los horarios de los microbuses?',
        clientTime: '2026-09-09T14:30:00', // Miércoles 14:30
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.showHorarios).toBe(true);
    expect(res.body.horarios).toBeDefined();
    expect(res.body.horarios.status).toBe('EN_SERVICIO');
    expect(res.body.text).toContain('Horarios de Operación - Micros Limache');
    expect(res.body.horarios.franjas.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/chat - debe alertar FUERA_DE_HORARIO cuando el cliente consulta tarde en la noche', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chat')
      .send({
        text: '¿A qué hora pasa el bus?',
        clientTime: '2026-09-09T22:45:00', // Miércoles 22:45 (última salida ~21:00)
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.showHorarios).toBe(true);
    expect(res.body.horarios.status).toBe('FUERA_DE_HORARIO');
    expect(res.body.horarios.isOutOfService).toBe(true);
    expect(res.body.text).toContain('FUERA DE HORARIO');
  });

  it('POST /api/chat - debe consultar horarios para una línea específica (Línea 02)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chat')
      .send({
        text: '¿Qué horario tiene la línea 02?',
        clientTime: '2026-09-09T10:00:00',
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.showHorarios).toBe(true);
    expect(res.body.horarios.linea).toContain('02');
  });

  it('POST /api/chat - debe buscar rutas para un destino conocido', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chat')
      .send({
        text: '¿Cómo llego al Hospital Santo Tomás?',
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.text).toContain('Aquí tienes opciones para llegar');
    expect(res.body.options.length).toBeGreaterThan(0);
    expect(res.body.text).toContain('Línea 01');
  });
});
