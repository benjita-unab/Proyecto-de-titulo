# 📑 Registro de Pruebas Unitarias y Plan de Pruebas

**Proyecto:** Aplicación de Transporte para Adultos Mayores (Quilpué, Villa Alemana y Marga Marga / Limache)  
**Entorno:** NestJS / Jest / TypeScript / Supabase  
**Última ejecución registrada:** 27 de noviembre de 2026

- **Unitarias completas:** 15 suites / 140 pruebas aprobadas.
- **Unitarias dirigidas de Telegram, flujo comparativo, radiotaxis y formato:** 4 suites / 70 pruebas aprobadas.
- **Unitarias complementarias HU #2/HU #3:** 27 de 29 aprobadas; 2 fallidas en expectativas antiguas.
- **Build de NestJS:** aprobado.
- **E2E:** 2 de 5 aprobadas; 3 fallidas.
- **Integración:** 12 de 19 aprobadas; 7 fallidas.

> Estos resultados corresponden al árbol de trabajo local de esa fecha, no a una versión publicada. Las pruebas unitarias no demuestran que existan servicios reales cargados en Supabase ni que sus datos estén vigentes.

La ejecución detallada, los resultados por HU y sus justificaciones se consolidan en la sección 6 de este mismo documento.

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
| **HU #53 (Tarea 1-3)** | Radiotaxis: consulta segura de centrales verificadas | [`taxis.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/taxis/taxis.service.spec.ts) | 5 pruebas unitarias; no verifica centrales reales |
| **HU #54 (Tarea 1)** | Formateo accesible Telegram (HTML, emojis, sanitización) | [`telegram-formatter.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/formatter/telegram-formatter.service.spec.ts) | 15 tests |
| **HU #54 (Tarea 2)** | Controlador de Webhook seguro y servicio Telegram (Nest.js) | [`telegram.controller.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.controller.spec.ts) | 5 tests |
| **HU #54 (Tarea 3-4) + HU #2** | Botones inline en Telegram, flujo comparativo de 3 medios y notas de voz | [`telegram.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/telegram.service.spec.ts) / [`audio-transcription.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/telegram/audio-transcription.service.spec.ts) | 44 tests (37 Telegram + 7 Audio) |
| **PR #22 (HU #5)** | Incorporar colectivos de Quilpué como tercer medio de transporte (T1-T5) | [`colectivos.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/colectivos/colectivos.service.spec.ts) | 4 pruebas unitarias; filtra filas verificadas |
| **PR #23 (HU #3)** | Geolocalización y parada más cercana con fórmula Haversine (T1-T7) | [`haversine.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/geo/haversine.service.spec.ts) | 15 tests unitarios |
| **HU #2** | Sistema de selección comparativa de 3 medios y flujo interactivo (T1-T5) | [`comparative-flow.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/comparative-flow.service.spec.ts) | 8 pruebas unitarias; valida mensajes cuando faltan datos verificados |
| **Ejecución local (27-11-2026)** | Telegram, transporte, endpoints y pipeline | Unitarias, E2E e integración ejecutadas por separado | 140/140 unitarias principales; 27/29 unitarias complementarias; 2/5 E2E; 12/19 integración |

---

## 2. Detalle de Suites Unitarias

La lista siguiente documenta casos representativos. El conteo vigente de la suite completa es 140 pruebas en 15 suites; esta lista no debe usarse como recuento total.

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
> **Objetivo:** Publicar únicamente centrales cuya autorización, fuente y evidencia estén verificadas (HU #53).

- [x] **`TaxisService > should be defined`**: Verificación de instanciación del servicio.
- [x] **`getCentralesRadioTaxi > no debe inventar ni mostrar centrales si Supabase no está configurado`**: Devuelve una lista vacía segura.
- [x] **`getCentralesRadioTaxi > debe mantener la lista vacía si se pierde la conexión`**: No usa una contingencia de contactos sin verificar.
- [x] **`getCentralesRadioTaxi > debe usar una respuesta vacía hasta verificar fuentes y autorización`**: No presenta contactos sin respaldo suficiente.
- [x] **`getCentralesRadioTaxi > debe registrar y manejar errores de esquema`**: Registra el error y devuelve una lista vacía para no interrumpir el webhook.

La suite no comprueba disponibilidad offline ni centrales reales: esas afirmaciones de versiones anteriores se retiran.

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

### Suite 12: Colectivos de Quilpué ([`colectivos.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/colectivos/colectivos.service.spec.ts))
> **Objetivo:** Evitar publicar líneas o puntos de espera sin verificación de fuente (HU #5 / PR #22).

- [x] **`ColectivosService > should be defined`**: Instanciación correcta del servicio.
- [x] **`getColectivos > no publica el catálogo local que carece de fuentes verificadas`**: El catálogo candidato no basta para mostrar servicios.
- [x] **`getColectivos > publica sólo registros de Supabase con evidencia y fuente HTTPS`**: Verifica que la consulta aplique el filtro `verificado`.
- [x] **`getPuntosEsperaColectivo > no publica puntos de espera sin verificación de fuente`**: Devuelve una lista vacía.

Estas pruebas no validan recorridos, tarifas ni paraderos de colectivos reales.

---

### Suite 13: Geolocalización y Parada más Cercana con Haversine ([`haversine.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/transport/geo/haversine.service.spec.ts))
> **Objetivo:** Cálculo geodésico exacto mediante fórmula Haversine, validación estricta de coordenadas, enlaces de mapas y radio progresivo hacia paradas más cercanas y puntos seguros (HU #3 / PR #23).

- [x] **`HaversineService > should be defined`**: Instanciación del motor geográfico.
- [x] **`HaversineService > calculateDistance > debe devolver 0 metros para el mismo punto`**: Distancia nula entre coordenadas idénticas.
- [x] **`HaversineService > calculateDistance > debe ser simétrica entre dos coordenadas`**: Valida que dist(A, B) === dist(B, A) con precisión menor a 10m.
- [x] **`HaversineService > validateCoordinates > debe aceptar coordenadas válidas en la zona de Quilpué y Región de Valparaíso`**: Validación de latitudes y longitudes reales de la zona central de Chile.
- [x] **`HaversineService > validateCoordinates > debe rechazar coordenadas fuera de rango lat/lng o no numéricas`**: Protección ante valores corruptos, NaN, null y coordenadas en otros continentes.
- [x] **`HaversineService > generateGoogleMapsLink y generateWalkingDirectionsLink`**: Generación de URLs de Google Maps y rutas a pie sin consumir cuotas de pago de API.
- [x] **`HaversineService > findClosestStop > debe encontrar la parada más cercana en el catálogo para la Plaza de Quilpué`**: Detección con radio inicial de 500m.
- [x] **`HaversineService > findClosestStop > debe ampliar el radio si la distancia supera el radio inicial sin arrojar error`**: Algoritmo de radio progresivo y flag `radioAmpliado: true`.
- [x] **`HaversineService > findClosestStop > debe filtrar exclusivamente paradas seguras cuando soloPuntosSeguros es true`**: Priorización de paradas y puntos iluminados/seguros.
- [x] **`HaversineService > findClosestStop > debe lanzar excepción si se envían coordenadas inválidas`**: Manejo seguro de errores ante entradas incorrectas.

---

### Suite 14: Sistema Comparativo de 3 Medios de Transporte ([`comparative-flow.service.spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/chat/comparative-flow.service.spec.ts))
> **Objetivo:** Comprobar la navegación del menú comparativo y la respuesta segura cuando no existen servicios verificados (HU #2 / PR #22-23).

- [x] Instanciación del orquestador.
- [x] Gestión de sesiones: guarda, recupera y limpia el destino del usuario.
- [x] Resumen comparativo: incluye microbús, colectivo y radiotaxi; marca tarifas y opciones como no verificadas cuando faltan datos.
- [x] Selección de microbús: procesa la opción, pero la prueba no acredita un recorrido real.
- [x] Selección de colectivo: confirma el mensaje de falta de líneas verificadas.
- [x] Selección de radiotaxi: confirma el mensaje de falta de contactos verificados.
- [x] Entrada inválida: devuelve `null` para una selección desconocida.

Los valores de tarifas y centrales descritos en expectativas antiguas no se consideran resultados actuales.

---

## 3. Pruebas de Integración End-to-End (E2E)

Ubicación: [`test/chat-horarios.e2e-spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/test/chat-horarios.e2e-spec.ts)

**Última ejecución de `npm run test:e2e -- --runInBand`: 2/5 aprobadas y 3 fallidas.** Dos pruebas excedieron el timeout de 5 segundos; otra recibió una respuesta de aclaración en vez del texto esperado. Los casos siguientes describen pruebas definidas, no una aprobación completa actual.

- [x] **`POST /api/chat - debe responder consulta de horarios generales en servicio`**: Prueba flujo completo de horarios en Supabase para día hábil.
- [x] **`POST /api/chat - debe alertar FUERA_DE_HORARIO cuando el cliente consulta tarde en la noche`**: Simula hora del teléfono de adulto mayor fuera de servicio (`22:45 hrs`) y valida banner `FUERA DE HORARIO`.
- [x] **`POST /api/chat - debe consultar horarios para una línea específica (Línea 02)`**: Valida búsqueda específica por línea en Supabase.
- [x] **`POST /api/chat - debe buscar rutas para un destino conocido`**: Valida NLP + Rutas de Supabase para "Hospital Santo Tomás".
- [x] **`GET / - AppController`** ([`test/app.e2e-spec.ts`](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/test/app.e2e-spec.ts)): Healthcheck de la API NestJS.

---

## 4. Comandos de Ejecución de Pruebas y Scripts

Todos los siguientes comandos deben ejecutarse desde la carpeta `backend/`:

```powershell
# 1. Ejecutar todas las pruebas unitarias
npm test -- --runInBand

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

### Integración HU2/HU3/HU6

Las suites `*.integration-spec.ts` no están incluidas en `npm test` ni en `npm run test:e2e`. En la ejecución dirigida del 27-11-2026, HU2 obtuvo 4/8, HU3 3/6 y HU6 5/5: **12/19 aprobadas y 7/19 fallidas**. Las fallas de HU2 esperan tarifas, colectivos o radiotaxis verificados que no están disponibles, o textos de respuesta anteriores; las de HU3 esperan paraderos/puntos seguros reales que no están cargados. El benchmark de HU2 sí pasó dentro del límite de 1,5 s en el backend de pruebas; HU6 aprobó cinco casos con Gemini simulado y fallback local.

Como ejecución adicional, las suites `test/unit/hu2-comparativo.spec.ts` y `test/unit/hu3-haversine.spec.ts` dieron **27/29 aprobadas**: HU2 aprobó 9/11 y HU3 18/18. No están incluidas en el total principal de 140 pruebas, que corresponde a las suites bajo `src/`. Los dos fallos de HU2 esperan tarifas fijas no verificadas y un teclado de solo dos filas, mientras la respuesta actual agrega una fila de acciones. El detalle por caso está en la sección 6.

El Hito 3 del informe de referencia identifica las HU #7–#10 como planificadas. No se encontraron en el repositorio suites o resultados que permitan atribuirles una ejecución; no deben marcarse como aprobadas por las pruebas internas HU #2, HU #3 o HU #6.

### Scripts de Gestión de Base de Datos (Supabase):

```powershell
# Guardar candidatos de radiotaxi inactivos y no verificados en Supabase
npm run db:populate-radiotaxis

# Sincronizar filas de transporte del script (no implica que queden verificadas)
npm run db:populate

# Poblar horarios de servicio de microbuses
npm run db:populate-horarios

# ADVERTENCIA: elimina datos; no ejecutar para validar servicios ni pruebas
npm run db:clean
```

### Verificación de Compilación en Frontend:

```powershell
# Desde la carpeta 'App para adultos mayores/'
cd "..\App para adultos mayores"
npm run build
```

---

## 5. Trazabilidad de servicios de microbuses, colectivos y radiotaxis

Los servicios están conectados al flujo comparativo de Telegram, pero eso no significa que haya datos reales publicables. El bot debe mostrar solo filas con fuente y verificación; hoy, las pruebas y los scripts disponibles no acreditan un catálogo operativo de Quilpué.

| Servicio | Consulta y criterio para mostrar | Evidencia actual | Estado y justificación |
|---|---|---|---|
| Microbuses | `RutasService` consulta `recorrido_transporte` con `activo=true`, `verificado=true`, `fuente_url` y `evidencia_fuente`. | La integración HU3 obtuvo cero paraderos verificados; la HU2 no acreditó líneas con registros verificables. El seed de [`poblar-transporte.ts`](./backend/src/scripts/poblar-transporte.ts) deja filas pendientes sin fuente/evidencia. | **No acreditado para uso real.** No se publica un recorrido solo por estar en una lista o aparecer en un mapa; hay que verificar operador, trazado, fecha y fuente. |
| Colectivos | `ColectivosService` requiere registro activo/verificado, URL HTTPS y evidencia. | [`poblar-colectivos.ts`](./backend/src/scripts/poblar-colectivos.ts) marca las líneas candidatas inactivas y `verificado=false`; los puntos de espera devuelven lista vacía. La prueba unitaria espera ese estado seguro. | **Sin líneas publicables.** Los trazados, horarios y tarifas que aparecían en versiones anteriores del documento eran datos candidatos, no resultados oficiales comprobados. |
| Radiotaxis | `TaxisService` consulta `servicio_radiotaxi` con `activo=true`, `autorizada=true`, `verificado=true`, fuente, evidencia y fecha de verificación. | [`poblar-radiotaxis.ts`](./backend/src/scripts/poblar-radiotaxis.ts) guarda candidatos como inactivos, no autorizados y no verificados. La prueba unitaria comprueba lista vacía segura y manejo del error de esquema. | **Sin contactos publicables.** Directorios comerciales o páginas de empresas no prueban autorización vigente; no se muestran teléfonos sin confirmación. En la ejecución de integración el esquema de Supabase no tenía la columna `verificado`. |

### Estado de la base y pruebas

- Los botones/handlers permiten seleccionar microbús, colectivo o radiotaxi. Al no haber datos verificados, el bot informa que no hay resultados confirmados; una lista vacía es deliberada y no equivale a que el servicio no exista en la comuna.
- [`migrar-verificacion-fuentes.sql`](./backend/src/scripts/migrar-verificacion-fuentes.sql) agrega campos de verificación, pero el código local no demuestra que esa migración se haya aplicado a la instancia Supabase usada por Telegram.
- No afirmar que hay seis recorridos oficiales, 18 horarios cargados ni cinco centrales activas: esos números se eliminaron porque no tienen respaldo reproducible en la ejecución actual.
- Para habilitar resultados hacen falta: aplicar y comprobar la migración en la base correcta; reunir fuentes oficiales o confirmación directa; registrar evidencia y fecha por fila; activar únicamente los registros revisados; repetir integración y prueba real por Telegram.
- Los resultados por suite, las causas de fallas y los criterios pendientes se consolidan en la sección 6 de este documento.

---

## 6. Ejecución detallada por HU y estado del Hito 3

Las suites complementarias de `test/unit/` y `test/integration/` se ejecutaron de forma dirigida el 27-11-2026. Estos resultados describen el árbol de trabajo local de esa fecha; no son evidencia de una versión desplegada ni sustituyen las pruebas de aceptación con usuarios.

| HU / suite | Qué hace la prueba | Resultado | ¿Se cumple? Justificación |
|---|---|---:|---|
| HU #2 — Unitaria [`hu2-comparativo.spec.ts`](./backend/test/unit/hu2-comparativo.spec.ts) | Verifica resumen de tres medios, formato de botones, selecciones por número/texto/callback, manejo de sesión y latencia en memoria. | **9/11** | **Parcial.** Fallan dos expectativas: tarifas fijas de $150/$450 aunque el servicio responde “No verificada” si no hay fuente comprobable, y teclado de dos filas aunque la interfaz actual agrega una fila de acciones para reiniciar/finalizar. Las demás pruebas pasan. |
| HU #3 — Unitaria [`hu3-haversine.spec.ts`](./backend/test/unit/hu3-haversine.spec.ts) | Comprueba distancias y bordes, validación de coordenadas, selección y ampliación de radio con paradas simuladas, filtrado seguro, enlaces Maps y tiempo del cálculo local. | **18/18** | **Cumple el alcance unitario.** No demuestra que los puntos del catálogo sean paraderos reales, ni valida distancia caminable o exactitud en terreno. |
| HU #2 — Integración [`hu2-flujo-interactivo.integration-spec.ts`](./backend/test/integration/hu2-flujo-interactivo.integration-spec.ts) | Prueba el API, selección de medios, callback de Telegram, recuperación sin sesión y latencia en 15 ciclos. | **4/8** | **Parcial; aceptación integral no cumplida.** Pasan resumen inicial, desglose de microbús, recuperación sin sesión y latencia (P95 226 ms y 253 ms, menor a 1.500 ms). Fallan aserciones que esperan tarifa/colectivos y radiotaxis verificados o un texto anterior del callback. Supabase además informa que falta la columna `servicio_radiotaxi.verificado`; el flujo no debe mostrar contactos sin confirmar. |
| HU #3 — Integración [`hu3-ubicacion.integration-spec.ts`](./backend/test/integration/hu3-ubicacion.integration-spec.ts) | Valida coordenadas en el endpoint, consulta paraderos persistidos, solicita punto seguro y mide 50 consultas consecutivas. | **3/6** | **Parcial; recomendación real no acreditada.** Pasan los rechazos de coordenadas inválidas/fuera de zona y la medición local de latencia. Fallan la búsqueda de paradero, el punto seguro y la consulta de paraderos persistidos porque no hay filas verificadas disponibles. |
| HU #6 — Integración [`hu6-pipeline-ia.integration-spec.ts`](./backend/test/integration/hu6-pipeline-ia.integration-spec.ts) | Verifica el pipeline con Gemini simulado, fallback local, eventos MQTT, failover del almacén local y latencia. | **5/5** | **Cumple los casos automatizados simulados.** No acredita conexión a Gemini real ni una base SQLite real: el respaldo del proyecto es JSON/en memoria. |
| HU #2 — Sistema [`hu2-resultados-sistema.csv`](./backend/test/system/hu2-resultados-sistema.csv) | Registra 15 flujos comparativos ejecutados directamente en memoria, con paso 1, paso 2, coherencia y elementos visuales. | **15 filas registradas** | **Evidencia técnica parcial, no aceptación de usuario.** No demuestra interacción real por Telegram, Supabase, dispositivo ni conteo de toques; tampoco registra fecha/build por caso. |
| HU #3 — Sistema [`hu3-resultados-sistema.csv`](./backend/test/system/hu3-resultados-sistema.csv) | Evalúa 20 ubicaciones contra paraderos disponibles y compara Haversine con una referencia geodésica independiente. | **0/20 evaluables** | **No evaluable para exactitud.** No equivale a 0% de precisión: faltan paraderos verificados para calcular y contrastar las distancias. El CSV no debe presentarse como aprobación. |
| HU #6 — Sistema [`hu6-resultados-sistema.csv`](./backend/test/system/hu6-resultados-sistema.csv) | Registra 30 prompts, intención/destino y latencias de IA y fallback. | **30 filas; calidad factual no evaluable** | **No acredita respuestas correctas de transporte.** El CSV no guarda las respuestas completas ni fuentes contrastadas; el generador puede simular IA cuando no hay `GEMINI_API_KEY`. |

### Criterios de aceptación y pruebas manuales pendientes

| Historia / prueba | Estado | Justificación |
|---|---|---|
| Hito 3 — HU #7 | **No ejecutada / sin evidencia** | El informe de referencia la presenta como parte del Sprint 3 planificado. No se encontró una suite, protocolo ejecutado ni resultado trazable en el repositorio. |
| Hito 3 — HU #8 | **No ejecutada / sin evidencia** | No hay salida de pruebas ni evidencia que permita evaluar sus criterios. |
| Hito 3 — HU #9 | **No ejecutada / sin evidencia** | Las pruebas internas HU #2/#3/#6 no corresponden automáticamente a esta historia ni demuestran sus criterios. |
| Hito 3 — HU #10 | **No ejecutada / sin evidencia** | Sin casos ejecutados, fecha, resultado y evidencia no corresponde declarar cumplimiento. |
| HU #3 — Línea base y calidad de información | **Parcial** | Se consolidaron tiempos declarados de plataformas y lineamientos L1–L4, pero faltan capturas, respuestas completas y contraste por fuente para clasificar las 30 respuestas de IA. |
| HU #4 — Nueve consultas comparativas de MoviTech | **No ejecutada** | Existe un protocolo, pero faltan las nueve respuestas reales, capturas, fuentes verificadas y tres mediciones de tiempo/toques en celular. No se acredita 8/9 correctas, reducción de 50% ni máximo de cuatro pasos. |
| Aceptación con adultos mayores | **No acreditada independientemente** | Hay registros declarados de tareas, tiempos y frustración, pero faltan trazabilidad verificable de participantes, protocolo, fecha y evidencia de sesión. |

**Conclusión:** las pruebas unitarias confirman partes aisladas de la lógica y algunas métricas de backend, pero no acreditan el funcionamiento con datos reales ni el cumplimiento de aceptación. Para cerrar las HU del Hito 3 se deben ejecutar sus casos planificados y registrar resultado por criterio, evidencia y justificación de cada incumplimiento. Hasta entonces, HU #7–#10 permanecen pendientes; no se les atribuyen resultados de otras historias.

