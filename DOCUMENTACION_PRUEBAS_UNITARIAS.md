# 📑 Registro Oficial de Pruebas Unitarias y Plan de Pruebas

**Proyecto:** Aplicación de Transporte para Adultos Mayores (Limache)  
**Entorno:** NestJS / Jest / TypeScript / Supabase  
**Total de Suites de Pruebas Unitarias:** 7 Suites  
**Total de Suites de Pruebas Unitarias:** 7 Suites  
**Total de Pruebas Unitarias Registradas:** 31 Tests (100% pasando)  
**Pruebas de Integración (E2E):** 2 Suites / 5 Tests (100% pasando)  

---

## 1. Mapeo de Pull Requests y Tareas Realizadas

| Pull Request / Rama | Tarea / Historia de Usuario | Archivo de Prueba | Tests Asociados |
| :--- | :--- | :--- | :--- |
| **PR #3** | Detección de destino y lugar de llegada en el texto del usuario | [`nlp.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/nlp/nlp.service.spec.ts) | 7 tests |
| **PR #4** | Creación de tablas y consulta de rutas por destino en Supabase | [`rutas.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/rutas/rutas.service.spec.ts) | 4 tests |
| **PR #6** | Programar formato de respuesta de opciones de transporte | [`formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/formatter.service.spec.ts) | 4 tests |
| **PR #7** | Gestión de respuestas sobre destinos no reconocidos (fallback conversacional) | [`formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/formatter.service.spec.ts) / [`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts) | 2 tests |
| **PR #8** | Configurar permisos CORS y conexión App-Backend | Configuración global y endpoints del Chat | Verificado en E2E / Controller |
| **PR #10** | Comparación de horarios dispositivo e itinerario oficial backend | [`horarios.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/horarios/horarios.service.spec.ts) | 7 tests |
| **PR #11** | Creación tabla de horario de servicio e integración con chat | [`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts) | 1 test |
| **PR #12** | Diseñar extractor y poblamiento de horarios en Supabase (HU #22) | [`chat-horarios.e2e-spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/test/chat-horarios.e2e-spec.ts) / `poblar-horarios.ts` | 4 tests E2E |
| **HU #53 (Tarea 1)** | Diseñar dashboard de radiotaxis con llamada rápida 1 toque | Frontend `RadioTaxisDashboard.tsx` / `App.tsx` | Verificado en interfaz y build Vite |
| **HU #53 (Tarea 2)** | Estructurar tabla de base de datos `servicio_radiotaxi` | Backend `crear_tabla_radiotaxis.sql` | Verificado con RLS y Supabase |
| **HU #53 (Tarea 3 / Actual)** | Extractor automático desde TodoRadioTaxi y API en servidor | [`taxis.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/taxis/taxis.service.spec.ts) / [`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts) | 3 tests unitarios |

---

## 2. Detalle Exhaustivo de Pruebas Unitarias (31 Tests)

### Suite 1: Horarios de Servicio ([`horarios.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/horarios/horarios.service.spec.ts))
> **Objetivo:** Verificar la lógica de franjas horarias y comparación con la hora del dispositivo para adultos mayores (HU #22).

- [x] **`HorariosService > should be defined`**: Verifica que el servicio se instancie correctamente con sus dependencias opcionales.
- [x] **`HorariosService > getHorarios > debe devolver el 100% de las franjas para semana, sabados y domingos con inicio y termino`**: Asegura la presencia exacta de las 3 franjas obligatorias (`semana`: 06:30 - 21:00, `sabado`: 07:00 - 20:30, `domingo`: 07:30 - 20:00).
- [x] **`HorariosService > checkHorarioStatus > debe detectar EN_SERVICIO en dias de semana durante horario de operacion (ej. Miercoles 14:30)`**: Valida estado `EN_SERVICIO`, `isOutOfService: false` y badge informativo.
- [x] **`HorariosService > checkHorarioStatus > debe detectar FUERA_DE_HORARIO si la hora supera la ultima salida en dia de semana (ej. Miercoles 22:15)`**: Valida advertencia `FUERA_DE_HORARIO`, `isOutOfService: true` y mensaje indicando que la última salida fue a las 21:00 hrs.
- [x] **`HorariosService > checkHorarioStatus > debe detectar FUERA_DE_HORARIO si la hora es previa a la primera salida (ej. Miercoles 05:45)`**: Valida advertencia `FUERA_DE_HORARIO` informando que el servicio inicia a las 06:30 hrs.
- [x] **`HorariosService > checkHorarioStatus > debe aplicar correctamente los limites de operacion los Sabados (07:00 a 20:30)`**: Comprueba la alternancia entre servicio y fuera de servicio para el sábado.
- [x] **`HorariosService > checkHorarioStatus > debe aplicar correctamente los limites de operacion los Domingos (07:30 a 20:00)`**: Comprueba la alternancia entre servicio y fuera de servicio para domingos y festivos.

---

### Suite 2: Controlador del Chat ([`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts))
> **Objetivo:** Verificar la recepción de mensajes del usuario y la coordinación entre NLP, Rutas y Horarios.

- [x] **`ChatController > should be defined`**: Verificación de inyección de controladores.
- [x] **`ChatController > handleChat > should return routes for a known destination`**: Ante la consulta "cómo llego a la plaza", orquesta la respuesta estructurada de rutas disponibles.
- [x] **`ChatController > handleChat > should return a guided message for an unknown destination`**: Si no se reconoce el destino, retorna el mensaje empático y accesible para adultos mayores.
- [x] **`ChatController > handleChat > should return schedule information and showHorarios flag when asking for horarios`**: Ante preguntas de horarios ("¿Cuáles son los horarios de los buses?"), activa la bandera `showHorarios: true` y entrega el bloque de estado e itinerario.

---

### Suite 3: Consulta de Rutas de Transporte ([`rutas.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/rutas/rutas.service.spec.ts))
> **Objetivo:** Asegurar la consulta y normalización de recorridos desde Supabase.

- [x] **`RutasService > should be defined`**: Instanciación del servicio de transporte.
- [x] **`RutasService > getRoutesForDestination > debe estructurar los datos en un formato de objetos { linea, recorrido, tipo } y no como texto plano pre-concatenado`**: Garantiza que el backend entregue contratos de datos limpios para el frontend.
- [x] **`RutasService > getRoutesForDestination > debe manejar errores de Supabase y devolver un arreglo vacío`**: Previene caídas del sistema ante desconexión o fallo de base de datos.
- [x] **`RutasService > getRoutesForDestination > debe devolver un arreglo vacío si no hay coincidencias locales`**: Maneja búsquedas de lugares fuera de cobertura (ej. 'marte').

---

### Suite 4: Procesamiento de Lenguaje Natural ([`nlp.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/nlp/nlp.service.spec.ts))
> **Objetivo:** Extracción robusta de intenciones y destinos a partir de entradas de voz y texto.

- [x] **`NlpService > should be defined`**: Instanciación del motor NLP local.
- [x] **`NlpService > cleanText > should clean text properly (remove accents, punctuation, and politeness)`**: Normaliza acentos, puntuación y quita frases de cortesía largas ("hola cómo estás mira necesito...").
- [x] **`NlpService > extractDestination > should extract destination using regex patterns`**: Extrae destinos clave usando patrones ("cómo llego a", "quiero ir a", "micro al", etc.).
- [x] **`NlpService > extractDestination > should use fallback for phrases without patterns up to 8 words`**: Permite entradas breves sin verbo ("hospital", "a la plaza de las 40 horas").
- [x] **`NlpService > extractDestination > should return null for very long phrases with unknown intent`**: Evita falsos positivos en relatos largos no relacionados.
- [x] **`NlpService > processQuery > should return Buscar Ruta intent and destination if regex matches`**: Clasificación como `Buscar Ruta`.
- [x] **`NlpService > processQuery > should return unknown intent if text is too long and has no pattern`**: Clasificación como `unknown`.

---

### Suite 5: Formato de Respuestas ([`formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/formatter.service.spec.ts))
> **Objetivo:** Presentación clara, legible y accesible de opciones de microbuses para adultos mayores.

- [x] **`FormatterService > should be defined`**: Instanciación del formateador.
- [x] **`FormatterService > formatRouteResponse > debe retornar hasta 4 alternativas y formatear correctamente con enlace a Google Maps`**: Limita a un máximo de 4 opciones para no abrumar al adulto mayor y genera enlace directo de tránsito en Google Maps.
- [x] **`FormatterService > formatRouteResponse > debe retornar una respuesta amigable y guiada por destino no reconocido`**: Guía al usuario sugiriendo destinos comunes (Hospital Santo Tomás, Estación Limache, Plaza 40 Horas).
- [x] **`FormatterService > formatRouteResponse > debe manejar casos donde routes es null o undefined`**: Resiliencia ante datos nulos.

---

### Suite 6: Servicio de Radiotaxis ([`taxis.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/taxis/taxis.service.spec.ts))
> **Objetivo:** Asegurar la consulta de contactos de radiotaxis desde Supabase y disponibilidad de contingencia (HU #53).

- [x] **`TaxisService > should be defined`**: Verificación de instanciación del servicio.
- [x] **`TaxisService > getCentralesRadioTaxi > debe devolver al menos 2 centrales autorizadas con nombre, telefono y direccion (CA-3.1 y CA-3.3)`**: Comprueba que la lista retorne centrales autorizadas de Limache con sus teléfonos en formato E.164 listos para discado.
- [x] **`TaxisService > getCentralesRadioTaxi > debe mantener disponibilidad con lista de contingencia si no hay conexion`**: Garantiza la disponibilidad 100% offline ante fallos de conexión (CA-3.4).

---

### Suite 7: Controlador Raíz ([`app.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/app.controller.spec.ts))

- [x] **`AppController > root > should return "Hello World!"`**: Verificación de estado del servidor raíz.

---

## 3. Pruebas de Integración End-to-End (E2E)

Ubicación: [`test/chat-horarios.e2e-spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/test/chat-horarios.e2e-spec.ts)

- [x] **`POST /api/chat - debe responder consulta de horarios generales en servicio`**: Prueba flujo completo de horarios en Supabase para día hábil.
- [x] **`POST /api/chat - debe alertar FUERA_DE_HORARIO cuando el cliente consulta tarde en la noche`**: Simula hora del teléfono de adulto mayor fuera de servicio (`22:45 hrs`) y valida banner `FUERA DE HORARIO`.
- [x] **`POST /api/chat - debe consultar horarios para una línea específica (Línea 02)`**: Valida búsqueda específica por línea en Supabase.
- [x] **`POST /api/chat - debe buscar rutas para un destino conocido`**: Valida NLP + Rutas de Supabase para "Hospital Santo Tomás".
- [x] **`GET / - AppController`** ([`test/app.e2e-spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/test/app.e2e-spec.ts)): Healthcheck de la API NestJS.

---

## 4. Comandos de Ejecución de Pruebas y Scripts

Todos los siguientes comandos deben ejecutarse desde la carpeta `backend/`:

```powershell
# 1. Ejecutar TODAS las pruebas unitarias (31 tests en 7 suites)
npm test

# 2. Ejecutar pruebas unitarias con reporte detallado de cada test individual
npx jest --verbose

# 3. Ejecutar pruebas unitarias cerrando conexiones abiertas limpiamente
npx jest --detectOpenHandles --forceExit

# 4. Ejecutar reporte de cobertura de código (Coverage)
npm test -- --coverage

# 5. Ejecutar pruebas en modo observador (se re-ejecutan automáticamente al guardar cambios)
npm run test:watch
```

### Comandos para ejecutar pruebas unitarias suite por suite:

```powershell
# Suite de Radiotaxis (HU #53)
npx jest src/transport/taxis/taxis.service.spec.ts --verbose

# Suite del Controlador de Chat (Integración NLP, Rutas, Horarios y Radiotaxis)
npx jest src/chat/chat.controller.spec.ts --verbose

# Suite de Consulta y Contingencia de Rutas
npx jest src/transport/rutas/rutas.service.spec.ts --verbose

# Suite de Procesamiento de Lenguaje Natural (NLP)
npx jest src/nlp/nlp.service.spec.ts --verbose

# Suite de Horarios e Itinerarios (HU #22)
npx jest src/transport/horarios/horarios.service.spec.ts --verbose

# Suite de Formato y Presentación Accesible
npx jest src/formatter/formatter.service.spec.ts --verbose

# Suite del Controlador Raíz
npx jest src/app.controller.spec.ts --verbose
```

### Pruebas de Integración End-to-End (E2E):

```powershell
# Ejecutar todas las pruebas E2E contra la API
npm run test:e2e

# Ejecutar únicamente la prueba E2E de Chat y Horarios
npx jest --config ./test/jest-e2e.json test/chat-horarios.e2e-spec.ts
```

### Scripts de Gestión de Base de Datos (Supabase):

```powershell
# Poblar / Extraer datos de radiotaxis automáticamente desde la web a Supabase
npm run db:populate-radiotaxis

# Poblar base de datos con recorridos de microbuses
npm run db:populate

# Poblar horarios de servicio de microbuses
npm run db:populate-horarios

# Limpiar todas las tablas en Supabase (incluyendo servicio_radiotaxi)
npm run db:clean
```

### Verificación de Compilación en Frontend:

```powershell
# Desde la carpeta 'App para adultos mayores/'
cd "..\App para adultos mayores"
npm run build
```

