import { Test, TestingModule } from '@nestjs/testing';
import { HorariosService } from './horarios.service';

describe('HorariosService', () => {
  let service: HorariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HorariosService],
    }).compile();

    service = module.get<HorariosService>(HorariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHorarios', () => {
    it('debe devolver el 100% de las franjas para semana, sabados y domingos con inicio y termino', () => {
      const horarios = service.getHorarios();
      expect(horarios).toHaveLength(3);

      const semana = horarios.find((h) => h.tipoDia === 'semana');
      const sabado = horarios.find((h) => h.tipoDia === 'sabado');
      const domingo = horarios.find((h) => h.tipoDia === 'domingo');

      expect(semana).toBeDefined();
      expect(semana?.inicio).toBe('06:30');
      expect(semana?.termino).toBe('21:00');

      expect(sabado).toBeDefined();
      expect(sabado?.inicio).toBe('07:00');
      expect(sabado?.termino).toBe('20:30');

      expect(domingo).toBeDefined();
      expect(domingo?.inicio).toBe('07:30');
      expect(domingo?.termino).toBe('20:00');
    });
  });

  describe('checkHorarioStatus', () => {
    it('debe detectar EN_SERVICIO en dias de semana durante horario de operacion (ej. Miercoles 14:30)', () => {
      // 2026-09-09 es Miércoles
      const testDate = new Date(2026, 8, 9, 14, 30);
      const result = service.checkHorarioStatus(testDate);

      expect(result.status).toBe('EN_SERVICIO');
      expect(result.isOutOfService).toBe(false);
      expect(result.badgeText).toBe('EN SERVICIO');
      expect(result.detail).toContain('21:00');
    });

    it('debe detectar FUERA_DE_HORARIO si la hora supera la ultima salida en dia de semana (ej. Miercoles 22:15)', () => {
      // 2026-09-09 es Miércoles a las 22:15 (termina a las 21:00)
      const testDate = new Date(2026, 8, 9, 22, 15);
      const result = service.checkHorarioStatus(testDate);

      expect(result.status).toBe('FUERA_DE_HORARIO');
      expect(result.isOutOfService).toBe(true);
      expect(result.badgeText).toBe('FUERA DE HORARIO');
      expect(result.detail).toContain('La última salida de hoy fue a las 21:00 hrs');
    });

    it('debe detectar FUERA_DE_HORARIO si la hora es previa a la primera salida (ej. Miercoles 05:45)', () => {
      // 2026-09-09 es Miércoles a las 05:45 (inicia a las 06:30)
      const testDate = new Date(2026, 8, 9, 5, 45);
      const result = service.checkHorarioStatus(testDate);

      expect(result.status).toBe('FUERA_DE_HORARIO');
      expect(result.isOutOfService).toBe(true);
      expect(result.detail).toContain('El servicio inicia hoy a las 06:30 hrs');
    });

    it('debe aplicar correctamente los limites de operacion los Sabados (07:00 a 20:30)', () => {
      // 2026-09-12 es Sábado
      const enServicioSabado = new Date(2026, 8, 12, 18, 0);
      const resEnServicio = service.checkHorarioStatus(enServicioSabado);
      expect(resEnServicio.status).toBe('EN_SERVICIO');
      expect(resEnServicio.detail).toContain('20:30');

      const fueraHorarioSabado = new Date(2026, 8, 12, 21, 0);
      const resFuera = service.checkHorarioStatus(fueraHorarioSabado);
      expect(resFuera.status).toBe('FUERA_DE_HORARIO');
      expect(resFuera.isOutOfService).toBe(true);
    });

    it('debe aplicar correctamente los limites de operacion los Domingos (07:30 a 20:00)', () => {
      // 2026-09-13 es Domingo
      const enServicioDomingo = new Date(2026, 8, 13, 12, 0);
      const resEnServicio = service.checkHorarioStatus(enServicioDomingo);
      expect(resEnServicio.status).toBe('EN_SERVICIO');
      expect(resEnServicio.detail).toContain('20:00');

      const fueraHorarioDomingo = new Date(2026, 8, 13, 20, 15);
      const resFuera = service.checkHorarioStatus(fueraHorarioDomingo);
      expect(resFuera.status).toBe('FUERA_DE_HORARIO');
      expect(resFuera.isOutOfService).toBe(true);
    });
  });
});
