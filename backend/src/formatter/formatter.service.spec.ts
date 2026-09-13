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
    it('debe retornar hasta 4 alternativas y formatear correctamente con enlace a Google Maps', () => {
      const routes = [
        { linea: 'Línea 1', recorrido: 'Calle A', tipo: 'Micro' },
        { linea: 'Línea 2', recorrido: 'Calle B', tipo: 'Colectivo' },
        { linea: 'Línea 3', recorrido: 'Calle C', tipo: 'Micro' },
      ];
      
      const response = service.formatRouteResponse('hospital', routes);
      
      expect(response.options.length).toBe(3);
      expect(response.options[0].linea).toBe('Línea 1');
      expect(response.text).toContain('Aquí tienes opciones para llegar a hospital');
      expect(response.text).toContain('🚌 *Línea 1*');
      expect(response.text).toContain('Pasa por: Calle A.');
      expect(response.text).toContain('https://www.google.com/maps/dir/?api=1&destination=hospital%20Quilpue&travelmode=transit');
    });

    it('debe retornar una respuesta amigable y guiada por destino no reconocido', () => {
      const response = service.formatRouteResponse('planeta marte', []);
      
      expect(response.options.length).toBe(0);
      expect(response.text).toContain('Disculpa, no alcancé a entender bien a qué lugar quieres ir.');
      expect(response.text).toContain('¿Me podrías indicar si vas al Hospital de Quilpué, a la Estación Metro Quilpué, Estación Villa Alemana, a la Feria El Belloto o a Los Pinos?');
      // Verifica que no hay códigos técnicos como "Error 404" o "Exception"
      expect(response.text).not.toContain('Error');
      expect(response.text).not.toContain('undefined');
    });

    it('debe manejar casos donde routes es null o undefined', () => {
      const response = service.formatRouteResponse('hospital', null as any);
      
      expect(response.options.length).toBe(0);
      expect(response.text).toContain('Disculpa, no alcancé a entender bien a qué lugar quieres ir.');
    });
  });
});
