# 📑 Registro Oficial de Pruebas Unitarias y Plan de Pruebas

**Proyecto:** Aplicación de Transporte para Adultos Mayores (Quilpué, Villa Alemana y Marga Marga / Limache)  
**Entorno:** NestJS / Jest / TypeScript / Supabase  
**Total de Suites de Pruebas Unitarias:** 11 Suites  
**Total de Pruebas Unitarias Registradas:** 94 Tests (100% pasando)  
**Pruebas de Integración (E2E):** 2 Suites / 5 Tests (100% pasando)  

---

## 1. Mapeo de Pull Requests y Tareas Realizadas

| Pull Request / Rama | Tarea / Historia de Usuario | Archivo de Prueba | Tests Asociados |
| :--- | :--- | :--- | :--- |
| **PR #3** | Detección de destino y lugar de llegada en el texto del usuario | [`nlp.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/nlp/nlp.service.spec.ts) | 8 tests |
| **PR #4** | Creación de tablas y consulta de rutas por destino en Supabase | [`rutas.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/rutas/rutas.service.spec.ts) | 4 tests |
| **PR #6** | Programar formato de respuesta de opciones de transporte | [`formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/formatter.service.spec.ts) | 4 tests |
| **PR #7** | Gestión de respuestas sobre destinos no reconocidos (fallback conversacional) | [`formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/formatter.service.spec.ts) / [`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts) | 2 tests |
| **PR #8** | Configurar permisos CORS y conexión App-Backend | Configuración global y endpoints del Chat | Verificado en E2E / Controller |
| **PR #10** | Comparación de horarios dispositivo e itinerario oficial backend | [`horarios.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/horarios/horarios.service.spec.ts) | 7 tests |
| **PR #11** | Creación tabla de horario de servicio e integración con chat | [`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts) | 2 tests |
| **PR #12** | Diseñar extractor y poblamiento de horarios en Supabase (HU #22) | [`chat-horarios.e2e-spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/test/chat-horarios.e2e-spec.ts) / `poblar-horarios.ts` | 4 tests E2E |
| **HU #53 (Tarea 1-3)** | Radiotaxis: Dashboard, tablas y extractor web contingente | [`taxis.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/taxis/taxis.service.spec.ts) / [`chat.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/chat.controller.spec.ts) | 3 tests unitarios |
| **HU #54 (Tarea 1)** | Formateo accesible Telegram (HTML, emojis, sanitización) | [`telegram-formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/telegram-formatter.service.spec.ts) | 15 tests |
| **HU #54 (Tarea 2)** | Controlador de Webhook seguro y servicio Telegram (Nest.js) | [`telegram.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.controller.spec.ts) | 5 tests |
| **HU #54 (Tarea 3)** | Sincronización eventos bot con Rutas y Supabase (CA-54.1, CA-54.2, CA-54.3) | [`telegram.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.service.spec.ts) | 14 tests |
| **HU #54 (Tarea 4)** | Recepción, descarga y transcripción de audios (OGG) hacia asistente de rutas | [`telegram.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.service.spec.ts) / [`audio-transcription.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/audio-transcription.service.spec.ts) | 28 tests (21 Telegram + 7 Audio) |
| **Actualización Reciente** | Extracción, población y actualización multicomunal de transporte y radiotaxis (Quilpué y Villa Alemana) | [`poblar-transporte.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/scripts/poblar-transporte.ts), [`poblar-horarios.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/scripts/poblar-horarios.ts), [`poblar-radiotaxis.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/scripts/poblar-radiotaxis.ts), [`nlp.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/nlp/nlp.service.spec.ts), [`rutas.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/rutas/rutas.service.spec.ts), [`horarios.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/horarios/horarios.service.spec.ts), [`taxis.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/taxis/taxis.service.spec.ts) | 94 tests unitarios integrados (100% pasando) |

---

## 2. Detalle Exhaustivo de Pruebas Unitarias (94 Tests)

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
- [x] **`ChatController > handleChat > should return a friendly welcome message when greeting with "hola bot"`**: Responde con un saludo amigable y orientativo ante saludos o llamadas al bot.

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
- [x] **`NlpService > processQuery > should return Saludo intent for greetings and "hola bot"`**: Clasificación como `Saludo` ante saludos y llamados al bot sin destino de viaje.

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

### Suite 8: Formateador Accesible de Telegram ([`telegram-formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/telegram-formatter.service.spec.ts))
> **Objetivo:** Garantizar presentación accesible para adultos mayores en Telegram (HTML, emojis, legibilidad visual según HU #54 - Tarea 1).

- [x] **`TelegramFormatterService > should be defined`**: Verificación de instanciación del servicio.
- [x] **`TelegramFormatterService > sanitizeHtml`**: Sanitiza caracteres reservados HTML (`<`, `>`, `&`).
- [x] **`TelegramFormatterService > formatRouteResponse`**: Formatea alternativas con negritas, emojis institucionales y enlaces de tránsito.
- [x] **`TelegramFormatterService > formatHorarioResponse`**: Muestra estado de servicio activo o fuera de horario con franjas detalladas e itinerario oficial en HTML.
- [x] **`TelegramFormatterService > formatWelcomeMessage`**: Mensaje de bienvenida empático con comandos sugeridos.

---

### Suite 9: Controlador de Webhook de Telegram ([`telegram.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.controller.spec.ts))
> **Objetivo:** Verificar recepción de webhooks, validación del token de seguridad y respuesta inmediata HTTP 200 (HU #54 - Tarea 2).

- [x] **`TelegramController > should be defined`**: Verificación de inyección de dependencias.
- [x] **`TelegramController > handleWebhook > debe retornar inmediatamente { status: "ok" } cuando el header de seguridad es válido`**: Valida respuesta HTTP 200 inmediata con header `x-telegram-bot-api-secret-token`.
- [x] **`TelegramController > handleWebhook > debe retornar { status: "ok" } cuando el token se envía en el query string (?token=...)`**: Valida soporte de token por query parameter.
- [x] **`TelegramController > handleWebhook > debe lanzar UnauthorizedException si no se envía ningún token de seguridad`**: Rechaza peticiones sin autenticación.
- [x] **`TelegramController > handleWebhook > debe lanzar UnauthorizedException si el token de seguridad es inválido`**: Rechaza tokens erróneos o manipulados.
- [x] **`TelegramController > handleWebhook > debe responder { status: "ok" } de inmediato incluso si el procesamiento en segundo plano arroja un error`**: Garantiza resiliencia y evita reintentos masivos de Telegram.

---

### Suite 10: Servicio de Telegram ([`telegram.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.service.spec.ts))
> **Objetivo:** Extracción robusta de chat_id y text, validación de secretos y envío de mensajes oficiales (HU #54 - Tarea 2).

- [x] **`TelegramService > should be defined`**: Instanciación del servicio con ConfigService.
- [x] **`TelegramService > validateSecretToken > debe validar exitosamente con header correcto`**: Coincidencia exacta con `TELEGRAM_WEBHOOK_SECRET`.
- [x] **`TelegramService > validateSecretToken > debe validar exitosamente con query param correcto`**: Coincidencia por query param.
- [x] **`TelegramService > validateSecretToken > debe rechazar tokens erróneos o nulos`**: Seguridad ante accesos no autorizados.
- [x] **`TelegramService > extractIncomingMessage > debe detectar notas de voz y extraer file_id y duración con isVoice: true`**: Detección de mensajes de voz (`msg.voice`) con extracción de `file_id`.
- [x] **`TelegramService > extractIncomingMessage > debe detectar archivos de audio (msg.audio) y extraer file_id y mime_type`**: Soporte para archivos de audio general (`msg.audio`) enviados en formato OGG Opus.
- [x] **`TelegramService > handleIncomingUpdate > debe responder con mensaje de orientación cuando la nota de voz no incluye file_id`**: Gestión accesible cuando falta el archivo físico.
- [x] **`TelegramService > handleIncomingUpdate > debe procesar nota de voz con file_id descargando, transcribiendo y respondiendo`**: Flujo completo de orquestación de voz en el webhook.
- [x] **`TelegramService > getFile > debe obtener la ruta remota file_path cuando la API de Telegram responde ok: true`**: Consulta al endpoint `/getFile` oficial.
- [x] **`TelegramService > getFile > debe devolver null si la respuesta de Telegram no contiene file_path`**: Manejo de fallos en la consulta del archivo.
- [x] **`TelegramService > getFile > debe devolver null y manejar la excepción de red de axios sin lanzar error no controlado`**: Resiliencia ante fallas de conectividad.
- [x] **`TelegramService > downloadTelegramFile > debe descargar físicamente el archivo de audio OGG en una ruta temporal del backend`**: Descarga de bytes en disco temporal con `responseType: 'arraybuffer'`.
- [x] **`TelegramService > downloadTelegramFile > debe lanzar excepción si la descarga de audio falla por error de red`**: Propagación controlada de errores de descarga.
- [x] **`TelegramService > processVoiceMessage > debe ejecutar el flujo completo de voz: getFile -> download -> transcribe -> NLP -> Rutas -> sendMessage`**: Integración extremo a extremo de voz a respuesta enriquecida.
- [x] **`TelegramService > processVoiceMessage > debe enviar mensaje orientativo si el audio transcrito resulta vacío`**: Mensaje accesible al usuario ante audio inaudible o vacío.
- [x] **`TelegramService > processVoiceMessage > debe manejar errores de red o fallo en getFile sin que el backend caiga y notificando al usuario`**: Contingencia y notificación transparente al usuario.
- [x] **`TelegramService > syncTelegramEventWithRoutes > debe conectar con RutasService y enviar respuesta enriquecida ante consulta de destino (CA-54.2)`**: Consulta destinos como "Hospital Santo Tomás", recupera rutas de Supabase/contingencia y las formatea con emojis (🚌, 📍, ⏱️, 💰) y negritas.
- [x] **`TelegramService > syncTelegramEventWithRoutes > debe soportar parse_mode: Markdown si es requerido por el cliente`**: Valida respuesta compatible con `parse_mode: 'Markdown'`.
- [x] **`TelegramService > syncTelegramEventWithRoutes > debe procesar consultas en un tiempo menor o igual a 1.5 segundos (CA-54.1)`**: Cumplimiento estricto del criterio de tiempo de respuesta <= 1500 ms.
- [x] **`TelegramService > syncTelegramEventWithRoutes > CA-54.3: debe lograr una tasa de éxito >= 85% ante 20 comandos de prueba consecutivos`**: Validación de resiliencia y precisión con 20 comandos variados consecutivos logrando el 100% de éxito.
- [x] **`TelegramService > sendMessage > debe llamar a axios.post con payload correcto y manejar excepciones de red limpiamente`**: Envío seguro de mensajes con modo HTML o Markdown.

---

### Suite 11: Transcripción de Audio Voz a Texto ([`audio-transcription.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/audio-transcription.service.spec.ts))
> **Objetivo:** Servicio desacoplado de transcripción de voz (STT) para notas de voz `.ogg` de Telegram, con soporte para APIs externas (Whisper) y puente simulado de contingencia y pruebas (HU #54 - Tarea 4).

- [x] **`AudioTranscriptionService > debe estar definido`**: Instanciación correcta del servicio en el contenedor de NestJS.
- [x] **`AudioTranscriptionService > debe arrojar error si la ruta del archivo es vacía`**: Validación estricta de parámetros de entrada.
- [x] **`AudioTranscriptionService > debe arrojar error si el archivo no existe físicamente`**: Comprobación física de existencia en disco.
- [x] **`AudioTranscriptionService > debe devolver cadena vacía si el archivo de audio tiene 0 bytes`**: Manejo seguro de archivos sin contenido.
- [x] **`AudioTranscriptionService > debe procesar el archivo mediante puente local de transcripción en entorno de pruebas`**: Decodificación y extracción de texto en entornos de desarrollo y pruebas.
- [x] **`AudioTranscriptionService > debe llamar a la API externa de Whisper si se proporciona OPENAI_API_KEY`**: Integración con multipart y llamada a la API de transcripción externa.
- [x] **`AudioTranscriptionService > debe degradar a puente simulado si la API externa falla con error de red`**: Resiliencia y tolerancia a fallos ante caídas del proveedor STT.

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
# 1. Ejecutar TODAS las pruebas unitarias (94 tests en 11 suites)
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
# Suite de Servicio Telegram (Sincronización, Rutas y Audios OGG) (HU #54)
npx jest src/telegram/telegram.service.spec.ts --verbose

# Suite de Transcripción de Audio Voz a Texto (HU #54)
npx jest src/telegram/audio-transcription.service.spec.ts --verbose

# Suite del Webhook de Telegram (HU #54)
npx jest src/telegram/telegram.controller.spec.ts --verbose

# Suite de Formateador Telegram (HTML, negritas, emojis) (HU #54)
npx jest src/formatter/telegram-formatter.service.spec.ts --verbose

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

---

## 5. Módulo de Extracción y Población Multicomunal (Quilpué y Villa Alemana)

> **Objetivo:** Permitir la transición y soporte de transporte público y radio taxis para las comunas de Quilpué y Villa Alemana (Marga Marga), manteniendo el esquema relacional en Supabase y la compatibilidad con el asistente conversacional para adultos mayores.

### A. Fuentes Web Conectadas
1. **Moovit Valparaíso y Marga Marga:**  
   `https://moovitapp.com/tripplan/valparaiso_y_vina_del_mar-3121/lines/es?ref=16&customerId=4908`  
   *Uso:* Consulta de líneas y trazados de transporte metropolitano con respaldo de datos de alta fidelidad.
2. **TodoRadioTaxi Villa Alemana:**  
   `https://todoradiotaxi.cl/villa-alemana/`  
   *Uso:* Scraping directo mediante Cheerio extrayendo centrales, teléfonos, direcciones y horarios.
3. **Páginas Amarillas Quilpué:**  
   `https://www.amarillas.cl/b/radio-taxi-las-24-horas/quilpue`  
   *Uso:* Extracción estructurada de JSON-LD / `__NEXT_DATA__` con centrales verificadas de Quilpué.

### B. Datos Oficiales Cargados en Supabase
* **Tabla `medio_transporte` (6 Líneas):**
  - `TRANS-C02`: Línea C02 (Peumo - Villa Alemana - Belloto Norte - Quilpué) | TMV
  - `TRANS-108`: Línea 108 (Peumo / Peñablanca - Mena - Pompeya) | Fenur S.A.
  - `TRANS-C03`: Línea C03 (Los Pinos - Estación Quilpué) | TMV
  - `TRANS-111`: Línea 111 (Los Pinos - Hospital - Peyronet - Playa Ancha) | Fenur S.A.
  - `TRANS-Q02`: Línea Q02 (Villa Alemana - Quilpué - Viña del Mar) | TMV Marga Marga
  - `TRANS-105D`: Línea 105-D (Peñablanca - Troncal Sur - Plaza Victoria) | Fenur S.A.
* **Tabla `recorrido_transporte` (6 Trazados):**
  - Puntos y destinos emblemáticos contextuales: *Estación Metro Villa Alemana*, *Estación Metro Quilpué*, *Plaza de Quilpué*, *Hospital de Quilpué*, *Centro Villa Alemana*, *Feria El Belloto*, *Belloto Norte*, *Los Pinos*, *Peumo*, *Peñablanca*, *Troncal Sur*, etc.
* **Tabla `horario_servicio` (18 Franjas Horarias):**
  - Franjas diferenciadas para Lunes a Viernes, Sábados y Domingos/Festivos.
* **Tabla `servicio_radiotaxi` (5 Centrales Reales Activas):**
  - `TAXI-VLM-01`: Radio Taxi Aracis Vía (+56989005971 / Madrid 2594, Villa Alemana)
  - `TAXI-VLM-02`: Radio Taxi Cartagena (+56956327251 / Covadonga 246, Villa Alemana)
  - `TAXI-VLM-03`: Radio Taxi Villa Alemana C & B (+56323176457 / Los Peumos 2140, Villa Alemana)
  - `TAXI-QLP-04`: Taxiexpress Quilpué (+56989795644 / Pje Campo Lindo 2695, Quilpué)
  - `TAXI-QLP-05`: Radio Taxi Transporte Privado 24 Horas (+56997996241 / Lago Lanalhue 2405, Quilpué)

### C. Módulos Adaptados en el Backend
- **NLP ([`nlp.service.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/nlp/nlp.service.ts)):** Captura de códigos de líneas alfanuméricos con letras y guiones (`C02`, `Q02`, `105-D`, `108`, `111`).
- **Rutas ([`rutas.service.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/rutas/rutas.service.ts)):** Filtrado de contingencia y búsqueda por palabras clave (`quilpue`, `alemana`, `belloto`, `pinos`, `hospital`, `estacion`, `plaza`).
- **Horarios ([`horarios.service.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/horarios/horarios.service.ts)):** Soporte de líneas alfanuméricas de Marga Marga.
- **Taxis ([`taxis.service.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/taxis/taxis.service.ts)):** Contingencia oficial con discado directo para Villa Alemana y Quilpué.


