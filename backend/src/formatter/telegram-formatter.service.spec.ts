/**
 * ============================================================================
 * CHECKLIST DE PRUEBAS UNITARIAS - TelegramFormatterService (HU #54 - Tarea 1)
 * ============================================================================
 * [x] 1. Inicialización y dependencias:
 *      - [x] 1.1 El servicio TelegramFormatterService debe instanciarse correctamente.
 *
 * [x] 2. Sanitización y seguridad de formato (HTML para Telegram):
 *      - [x] 2.1 escapeHtml() debe neutralizar caracteres reservados (&, <, >).
 *      - [x] 2.2 escapeHtml() debe retornar string vacío si el texto es nulo o indefinido.
 *
 * [x] 3. Plantilla 1: Rutas de Transporte Público (formatRouteResponse):
 *      - [x] 3.1 Debe incluir los emojis institucionales requeridos (🚌, 📍, ⏱️, 💰, 🗺️).
 *      - [x] 3.2 Debe estructurar el mensaje con etiquetas HTML <b> y saltos de línea claros.
 *      - [x] 3.3 Debe reflejar la tarifa preferencial para adultos mayores y tarifa general.
 *      - [x] 3.4 Debe limitar el número de rutas visualizadas a un máximo de 4 para no saturar al usuario.
 *      - [x] 3.5 Debe generar el hipervínculo codificado a Google Maps en modo tránsito.
 *      - [x] 3.6 Debe responder con mensaje amigable de contingencia si no hay rutas o destino vacío.
 *
 * [x] 4. Plantilla 2: Directorio de Radio Taxis Autorizados (formatRadioTaxisResponse):
 *      - [x] 4.1 Debe incluir emojis institucionales (🚕, 📍, 📞, ⏱️, 💰, 🛡️).
 *      - [x] 4.2 Debe formatear números de teléfono como enlaces 'tel:' clicables y bloques <code> legibles.
 *      - [x] 4.3 Debe mostrar dirección base, tarifa estimada y horario de atención por cada taxi.
 *      - [x] 4.4 Debe manejar listas vacías o nulas de taxis sin producir errores.
 *
 * [x] 5. Plantilla Auxiliar: Bienvenida al Adulto Mayor (formatWelcomeMessage):
 *      - [x] 5.1 Debe personalizar el saludo cuando se provee el nombre del usuario (escapando HTML).
 *      - [x] 5.2 Debe ofrecer un saludo genérico accesible cuando no se provee el nombre.
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  TelegramFormatterService,
  TelegramRouteDetail,
} from './telegram-formatter.service';
import { RadioTaxiDto } from '../transport/taxis/taxis.service';

describe('TelegramFormatterService', () => {
  let service: TelegramFormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramFormatterService],
    }).compile();

    service = module.get<TelegramFormatterService>(TelegramFormatterService);
  });

  describe('1. Inicialización', () => {
    it('debe estar definido e instanciado', () => {
      expect(service).toBeDefined();
    });
  });

  describe('2. Sanitización HTML (escapeHtml)', () => {
    it('debe escapar correctamente caracteres peligrosos (&, <, >)', () => {
      const input = 'Hospital Santo Tomás <Sector A> & Farmacia';
      const escaped = service.escapeHtml(input);
      expect(escaped).toBe('Hospital Santo Tomás &lt;Sector A&gt; &amp; Farmacia');
    });

    it('debe devolver cadena vacía ante valores nulos o vacíos', () => {
      expect(service.escapeHtml('')).toBe('');
      expect(service.escapeHtml(null as unknown as string)).toBe('');
      expect(service.escapeHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('3. Plantilla de Rutas de Transporte Público (formatRouteResponse)', () => {
    const mockRoutes: TelegramRouteDetail[] = [
      {
        linea: 'Línea 01',
        recorrido: 'Terminal Victoria, Urmeneta, Estación Limache',
        tipo: 'Microbús Agdabus',
        horario: '06:30 - 21:00 hrs',
        frecuencia: 'Cada 10 min',
        tarifaAdultoMayor: '$150',
        tarifaGeneral: '$350',
      },
      {
        linea: 'Línea 02',
        recorrido: 'República, San Francisco, Cajón Grande',
        tipo: 'Microbús Agdabus',
      },
      {
        linea: 'Línea 04',
        recorrido: 'Urmeneta, Serrano, Eastman',
      },
      {
        linea: 'Línea 08',
        recorrido: 'Palmira Romano Sur, Los Laureles',
      },
      {
        linea: 'Línea 09',
        recorrido: 'Excedente de prueba (no debe salir)',
      },
    ];

    it('debe incluir emojis institucionales (🚌, 📍, ⏱️, 💰, 🗺️) y parse_mode HTML', () => {
      const result = service.formatRouteResponse('Hospital Santo Tomás', [mockRoutes[0]]);

      expect(result.parse_mode).toBe('HTML');
      expect(result.text).toContain('🚌');
      expect(result.text).toContain('📍');
      expect(result.text).toContain('⏱️');
      expect(result.text).toContain('💰');
      expect(result.text).toContain('🗺️');
    });

    it('debe contener negritas HTML y datos estructurados de la ruta', () => {
      const result = service.formatRouteResponse('Hospital Santo Tomás', [mockRoutes[0]]);

      expect(result.text).toContain('<b>OPCIONES DE TRANSPORTE A: HOSPITAL SANTO TOMÁS</b>');
      expect(result.text).toContain('<b>Línea 01</b>');
      expect(result.text).toContain('Terminal Victoria, Urmeneta, Estación Limache');
      expect(result.text).toContain('<b>Tarifa Adulto Mayor:</b> $150');
      expect(result.text).toContain('General: $350');
    });

    it('debe incluir el enlace funcional a Google Maps con destino codificado', () => {
      const result = service.formatRouteResponse('Plaza 40 Horas', [mockRoutes[0]]);
      expect(result.text).toContain(
        'https://www.google.com/maps/dir/?api=1&amp;destination=Plaza%2040%20Horas%20Quilpue&amp;travelmode=transit',
      );
    });

    it('debe limitar a un máximo de 4 opciones para cuidar la sobrecarga cognitiva del adulto mayor', () => {
      const result = service.formatRouteResponse('Centro', mockRoutes);

      expect(result.text).toContain('Opción 1:');
      expect(result.text).toContain('Opción 4:');
      expect(result.text).not.toContain('Opción 5:');
      expect(result.text).not.toContain('Excedente de prueba');
    });

    it('debe retornar mensaje amigable de contingencia si no hay rutas o destino es vacío', () => {
      const resultVacio = service.formatRouteResponse('', []);
      expect(resultVacio.text).toContain('Disculpa, no encontré recorridos directos');
      expect(resultVacio.text).toContain('Hospital de Quilpué');
      expect(resultVacio.text).toContain('Estación Metro Quilpué');

      const resultNull = service.formatRouteResponse('Destino Raro', null as unknown as TelegramRouteDetail[]);
      expect(resultNull.text).toContain('Disculpa, no encontré recorridos directos');
    });
  });

  describe('4. Plantilla de Radio Taxis (formatRadioTaxisResponse)', () => {
    const mockTaxis: RadioTaxiDto[] = [
      {
        id: 'TAXI-LIM-01',
        nombre: 'Radio Taxi Limache',
        telefono: '+56322626021',
        telefonoFormateado: '32 2626021',
        direccionBase: 'Porvenir 574, Limache',
        tarifaBaseEstimada: '$2.500 - $3.000',
        horarioAtencion: 'Lun a Dom 24 horas',
        autorizada: true,
      },
      {
        id: 'TAXI-LIM-02',
        nombre: 'Taxi Colectivos Juan Egaña',
        telefono: '+5633414613',
        telefonoFormateado: '(33) 414613',
        direccionBase: 'Calle Los Alamos 816, Limache',
        tarifaBaseEstimada: '$2.500',
        horarioAtencion: '08:00 a 20:00 hrs',
        autorizada: true,
      },
    ];

    it('debe incluir emojis institucionales (🚕, 📍, 📞, ⏱️, 💰, 🛡️)', () => {
      const result = service.formatRadioTaxisResponse(mockTaxis);

      expect(result.parse_mode).toBe('HTML');
      expect(result.text).toContain('🚕');
      expect(result.text).toContain('📍');
      expect(result.text).toContain('📞');
      expect(result.text).toContain('⏱️');
      expect(result.text).toContain('💰');
      expect(result.text).toContain('🛡️');
    });

    it('debe formatear enlaces tel: y etiquetas code para llamada rápida desde móvil', () => {
      const result = service.formatRadioTaxisResponse(mockTaxis);

      expect(result.text).toContain('<a href="tel:+56322626021">32 2626021</a>');
      expect(result.text).toContain('<code>32 2626021</code>');
      expect(result.text).toContain('Porvenir 574, Limache');
      expect(result.text).toContain('$2.500 - $3.000');
      expect(result.text).toContain('Lun a Dom 24 horas');
    });

    it('debe manejar contingencia ante lista vacía o indefinida', () => {
      const result = service.formatRadioTaxisResponse([]);
      expect(result.text).toContain('En este momento no hay información de bases disponibles');
    });
  });

  describe('5. Saludo y Bienvenida (formatWelcomeMessage)', () => {
    it('debe personalizar el saludo cuando se ingresa nombre del usuario', () => {
      const result = service.formatWelcomeMessage('Don Juan & Señora Elena');
      expect(result.text).toContain('¡Hola <b>Don Juan &amp; Señora Elena</b>!');
      expect(result.text).toContain('MoviTech');
    });

    it('debe presentar saludo general accesible si no se provee nombre', () => {
      const result = service.formatWelcomeMessage();
      expect(result.text).toContain('¡Hola! Te damos la bienvenida');
    });
  });

  describe('6. Plantilla de Horarios de Operación (formatHorarioResponse)', () => {
    it('debe formatear estado EN_SERVICIO e itinerario en HTML', () => {
      const mockStatus = {
        isOutOfService: false,
        badgeText: 'EN SERVICIO',
        detail: 'El servicio se encuentra operando normalmente.',
        linea: 'Línea 01',
        horarios: [
          { dias: 'Lunes a Viernes', inicio: '06:30', termino: '21:00' },
          { dias: 'Sábados', inicio: '07:00', termino: '20:30' },
        ],
      };

      const result = service.formatHorarioResponse(mockStatus);

      expect(result.parse_mode).toBe('HTML');
      expect(result.text).toContain('⏱️ <b>HORARIOS DE OPERACIÓN');
      expect(result.text).toContain('🟢 <b>Estado:</b> EN SERVICIO');
      expect(result.text).toContain('06:30 hrs a 21:00 hrs');
      expect(result.text).toContain('Línea 01');
    });

    it('debe advertir cuando el servicio está fuera de horario', () => {
      const mockStatus = {
        isOutOfService: true,
        badgeText: 'FUERA DE SERVICIO',
        detail: 'El servicio cerró sus salidas.',
        linea: 'Línea 02',
        horarios: [],
      };

      const result = service.formatHorarioResponse(mockStatus);

      expect(result.text).toContain('⚠️ <b>Estado:</b> FUERA DE SERVICIO');
      expect(result.text).toContain('Línea 02');
    });
  });
});
