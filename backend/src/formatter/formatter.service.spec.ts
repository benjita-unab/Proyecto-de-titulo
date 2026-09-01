import { Test, TestingModule } from '@nestjs/testing';
import { FormatterService } from './formatter.service';

describe('FormatterService', () => {
  let service: FormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormatterService],
    }).compile();

    service = module.get<FormatterService>(FormatterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('formatRouteResponse', () => {
    it('debe retornar máximo 2 alternativas si recibe más de 2 rutas', () => {
      const routes = [
        { linea: 'Línea 1', recorrido: 'Calle A', tipo: 'Micro' },
        { linea: 'Línea 2', recorrido: 'Calle B', tipo: 'Colectivo' },
        { linea: 'Línea 3', recorrido: 'Calle C', tipo: 'Micro' },
      ];
      
      const response = service.formatRouteResponse('hospital', routes);
      
      expect(response.options.length).toBe(2);
      expect(response.options[0].linea).toBe('Línea 1');
      expect(response.options[1].linea).toBe('Línea 2');
      expect(response.text).toContain('Aquí tiene 2 opción(es)');
      expect(response.text).not.toContain('Línea 3');
    });

    it('debe devolver texto accesible con nombres en negrita (* *) y saltos de línea (\\n)', () => {
      const routes = [
        { linea: 'Línea 1', recorrido: 'Calle A', tipo: 'Micro' }
      ];
      
      const response = service.formatRouteResponse('hospital', routes);
      
      // Verifica nombres en negrita (Markdown) y emojis
      expect(response.text).toContain('🚌 *Línea 1 (Micro)*');
      // Verifica la organización en párrafos cortos
      expect(response.text).toContain('Recorrido: Calle A.');
    });

    it('debe retornar una respuesta amigable con sugerencias de destinos por destino no reconocido', () => {
      const response = service.formatRouteResponse('planeta marte', []);
      
      expect(response.options.length).toBe(0);
      expect(response.text).toContain('Lo siento, no pude reconocer su destino.');
      expect(response.text).toContain('¿Podría intentar con alguno de estos destinos conocidos en Limache?');
      expect(response.text).toContain('- Hospital');
      expect(response.text).toContain('- Cesfam');
      expect(response.text).toContain('- Plaza');
      expect(response.text).toContain("*'Quiero ir al hospital'*");
      // Verifica que no hay códigos técnicos como "Error 404" o "Exception"
      expect(response.text).not.toContain('Error');
      expect(response.text).not.toContain('undefined');
    });

    it('debe manejar casos donde routes es null o undefined', () => {
      const response = service.formatRouteResponse('hospital', null as any);
      
      expect(response.options.length).toBe(0);
      expect(response.text).toContain('Lo siento, no pude reconocer su destino.');
    });
  });
});
