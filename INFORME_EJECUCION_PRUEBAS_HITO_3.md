# Informe de ejecución de pruebas y evidencias

## Sistema MoviTech — Hito 3

| Antecedente | Detalle |
|---|---|
| Proyecto | Asistente de información de transporte MoviTech |
| Componentes considerados | Backend NestJS, Telegram, Supabase y pruebas de aceptación |
| Fecha de ejecución técnica registrada en este informe | 27 de noviembre de 2026 |
| Alcance | Historias HU1–HU4 entregadas para el Hito 3 |
| Resultado general | Parcial: hay pruebas automatizadas aprobadas, pero no se acredita el cumplimiento integral de las historias |

> **Criterio de elaboración.** Este informe sigue la organización por niveles, resultados y evidencias del documento de referencia compartido. No copia sus cifras de aprobación: la ejecución del repositorio presenta resultados distintos y se priorizan las pruebas reproducidas y los registros disponibles. Una prueba unitaria aprobada no equivale a aceptación en Telegram ni valida que los datos de transporte sean reales.

## 1. Resumen ejecutivo

| Historia | Evidencia principal | Resultado observado | Dictamen |
|---|---|---|---|
| **HU1 — Selección mediante botones en Telegram** | La suite unitaria general incluye pruebas de teclado, callbacks y flujo Telegram. No hay evidencia de aceptación real en celular ni de las tres mediciones completas de tiempo y toques. | Las pruebas unitarias generales pasan; faltan las verificaciones de extremo a extremo y aceptación. | **Parcial; aceptación pendiente.** |
| **HU2 — Paradero más cercano mediante Haversine** | Suite focalizada: 18/18 aprobadas. Integración de ubicación: 3/6 aprobadas. Sistema: 0/20 casos evaluables por falta de paraderos verificados. | Se comprueba la lógica matemática con datos de prueba, pero no la exactitud de paraderos reales. | **Parcial; exactitud real no acreditada.** |
| **HU3 — Línea base y criterios de información correcta** | Tiempos y pasos de cuatro plataformas consolidados; lineamientos L1–L4 definidos. Las respuestas de IA y brechas por plataforma no tienen evidencia suficiente para clasificarse. | T1 y T2 documentadas; T3–T5 incompletas. | **Parcial.** |
| **HU4 — Nueve consultas comparativas de MoviTech** | Existe un protocolo de nueve consultas y una plantilla de tres corridas; no se encontraron resultados ejecutados, capturas ni mediciones reales. | No se acredita 8/9 respuestas correctas, reducción de 50% del tiempo ni reducción de pasos. | **No ejecutada.** |

### Resultados de pruebas automatizadas

Las ejecuciones siguientes se realizaron desde `backend/` el 27 de noviembre de 2026. Las suites focalizadas HU2/HU3 y las suites bajo `src/` son conjuntos distintos; no se suman como si fueran una única campaña.

| Nivel / conjunto | Casos o suites | Aprobadas | Fallidas | Resultado |
|---|---:|---:|---:|---|
| Unitarias backend (`src/`) | 15 suites / 140 casos | 140 | 0 | **100%** |
| Unitarias focalizadas HU comparativa y Haversine (`test/unit/`) | 29 casos | 27 | 2 | **93,1%** |
| E2E | 5 casos | 2 | 3 | **40%** |
| Integración HU comparativa, ubicación y pipeline IA | 19 casos | 11 | 8 | **57,9%** |
| Sistema HU2, flujos en memoria | 15 registros | 15 registros, no aceptación real | — | **Evidencia técnica parcial** |
| Sistema HU2, exactitud geográfica | 20 ubicaciones | 0 evaluables | 20 no evaluables | **Sin resultado de exactitud** |
| Aceptación HU4 en Telegram | 9 consultas y 3 corridas | Sin ejecuciones registradas | — | **Pendiente** |

Las métricas de rendimiento obtenidas dentro de un servicio o una API local no prueban por sí solas el tiempo percibido por una persona usando Telegram en un celular.

## 2. Alcance y método de evaluación

Se separan los niveles para no presentar como equivalentes evidencias con distinto alcance:

1. **Unitarias:** lógica aislada, teclado, selección, validaciones y cálculo geográfico con datos de prueba.
2. **Integración:** comunicación entre endpoints, servicios y datos configurados en el entorno de ejecución.
3. **Sistema:** recorridos representativos, datos persistidos y comportamiento del flujo completo.
4. **Aceptación:** consultas reales en Telegram, mediciones en celular, capturas y contraste de datos con fuentes verificables.

En los nombres de algunas suites históricas, `HU #2` se refiere al flujo comparativo y `HU #3` a Haversine. Para evitar confundir esa numeración del código con las historias entregadas para este informe, aquí se usa **HU1–HU4 según el requerimiento del Hito 3**.

## 3. Ejecución por historia de usuario

### 3.1 HU1 — Seleccionar destino y medio de transporte mediante botones

**Objetivo de la comprobación:** verificar que el flujo guiado permita elegir destino, compartir ubicación y seleccionar microbús, colectivo o radiotaxi sin depender de escribir.

**Evidencia automatizada:** la suite general `npm test -- --runInBand` terminó con 15 suites y 140/140 casos aprobados. Incluye pruebas de `TelegramService`, formateo accesible y callbacks. La suite `telegram.service.spec.ts` contiene casos de etiquetas visibles, botones de destino/ubicación, selección inline y respuestas seguras cuando faltan datos verificados.

**Resultado y justificación:** el resultado unitario respalda componentes del flujo, pero no demuestra los criterios de aceptación completos. No se encontraron capturas del flujo real ni evidencia de que una persona lo complete en cuatro toques, sin escribir, con respuesta ≤1,5 s. Tampoco hay mediciones de tres corridas completas en celular. La prueba de una ruta simulada o en memoria no sustituye esa ejecución.

| Criterio de HU1 | Estado | Justificación |
|---|---|---|
| Mensaje inicial y botones con texto visible | **Parcial** | Hay comprobaciones automatizadas del teclado; falta captura de la conversación real desplegada. |
| Obtener destino, ubicación, medio y respuesta final en ≤4 toques y ≤1,5 s | **No acreditado** | No existen mediciones de flujo completo en dispositivo ni tres corridas registradas. |
| Respuesta general si no se comparte ubicación y opción de reintento | **No acreditado en aceptación** | No se aportó una ejecución real documentada que recorra este caso de principio a fin. |
| Ocultar simulaciones en producción | **Con cobertura automatizada** | Hay pruebas del teclado para el comportamiento de simulación; no se adjuntó evidencia del despliegue productivo. |

**Dictamen HU1:** **parcial**. Hay cobertura automatizada de componentes, pero no se acredita el cumplimiento de los criterios de uso real.

### 3.2 HU2 — Calcular el paradero más cercano con Haversine

**Objetivo de la comprobación:** validar cálculo de distancia, selección de paraderos y la recomendación de un punto real para abordar una línea que llegue al destino.

| Prueba | Resultado | Alcance y justificación |
|---|---:|---|
| Unitaria focalizada `test/unit/hu3-haversine.spec.ts` | **18/18 aprobadas** | Comprueba fórmula, casos borde, validación de coordenadas, radio de búsqueda, ampliación, enlaces y rendimiento del cálculo con datos controlados. |
| Integración `test/integration/hu3-ubicacion.integration-spec.ts` | **3/6 aprobadas** | Pasan las validaciones de coordenadas inválidas y la medición local. Fallan la respuesta con paradero, el punto seguro y la consulta de paraderos persistidos, porque no hay registros verificados disponibles. |
| Sistema `test/system/hu3-resultados-sistema.csv` | **0/20 evaluables** | El registro indica “Ninguna verificada” para las ubicaciones probadas. No equivale a 0% de precisión: no hubo dato válido para contrastar. |

**Conclusión técnica:** Haversine es apropiada para estimar la distancia geodésica en línea recta entre coordenadas. Las pruebas matemáticas no prueban que las coordenadas correspondan a paraderos reales, ni que midan distancia caminable. La distancia a pie requiere contrastar una ruta peatonal; la línea, sentido y paradero deben verificarse con una fuente operativa.

**Incidencia relacionada:** la integración también registra que Supabase no tiene la columna `servicio_radiotaxi.verificado`. El comportamiento seguro es no mostrar contactos sin verificar; la lista vacía resultante no demuestra que no existan servicios.

En el benchmark local de integración se registraron 248 ms de promedio y 336 ms P95 para el resumen comparativo; el desglose obtuvo 237 ms de promedio y 422 ms P95. Son mediciones del endpoint bajo prueba, no de las tres corridas completas en un celular que exige la HU4.

**Dictamen HU2:** **parcial**. La lógica unitaria pasa, pero la recomendación real y el umbral de exactitud no son evaluables mientras falten paraderos y líneas con procedencia comprobable.

### 3.3 HU3 — Línea base y lineamientos de información correcta

#### Línea base registrada

Los tiempos y pasos se transcriben como datos entregados para la historia. No se aportaron fecha, dispositivo, recorrido exacto ni capturas que permitan reproducir cada medición.

| Plataforma | Tiempo registrado | Tiempo (s) | Pasos registrados | ¿Entrega toda la información? | Brechas L1–L4 individualizadas |
|---|---:|---:|---:|---|---|
| Moovit | 3:32 | 212 | 5 | No | No; requiere revisar la captura de la consulta. |
| Red Regional | 4:29 | 269 | 5 | No | No; requiere revisar la captura de la consulta. |
| Google Maps | 1:30 | 90 | 4 | No | No; requiere revisar la captura de la consulta. |
| Google | 2:30 | 150 | 5 o más | No | No; falta precisar el número de pasos y revisar la captura. |

**Promedio de los cuatro tiempos:** 180,25 s (3:00,25 min). Como referencia de sensibilidad, Google Maps es la plataforma más rápida registrada, con 90 s.

#### Lineamientos de información correcta

| ID | Dato que debe comprobarse | Regla de aceptación | Fuente de verificación |
|---|---|---|---|
| **L1** | Línea que llega al destino | El servicio vigente llega al destino indicado o se explica claramente la combinación necesaria. | [DTPR — Gran Valparaíso](https://dtpr.gob.cl/pe/gran-valparaiso/), plan operacional y confirmación del operador o SEREMI cuando corresponda. Para tren, [EFE Valparaíso](https://www.efe.cl/). |
| **L2** | Paradero de espera más cercano y útil | El paradero existe, sirve a la línea y sentido indicados y su ubicación permite abordar el servicio; no basta con ser el punto geométrico más próximo. | Fuente del operador o autoridad para servicio y sentido; [Google Maps](https://maps.google.com/) para contrastar ubicación y trayecto peatonal según el protocolo. Moovit es referencia secundaria, no certificación. |
| **L3** | Tarifa vigente, general y adulto mayor | El monto corresponde al servicio, tramo y categoría consultados. Si no está publicado o no se confirma, debe indicarse como no verificado, no inferirse. | Tarifario oficial vigente de DTPR/SEREMI u operador. No aplicar automáticamente tarifas de buses regulados a taxis colectivos. |
| **L4** | Frecuencia u horario | Se indica horario/frecuencia vigente y el día o franja pertinente; si la fuente no lo publica, se declara “no publicado”. | Plan operacional y horario oficial del operador o DTPR; para tren, horario oficial de EFE. |

#### Clasificación de las 30 respuestas de IA

Hay registros de 30 consultas en [`hu6-resultados-sistema.csv`](./backend/test/system/hu6-resultados-sistema.csv) y una rúbrica en [`hu6-evaluacion-calidad-ia.csv`](./backend/docs/acceptance/hu6-evaluacion-calidad-ia.csv). Sin embargo, esos archivos no entregan las 30 respuestas completas junto con fuentes fechadas que permitan evaluar L1–L4. Las puntuaciones generales de tono o utilidad no prueban exactitud de rutas, paraderos, tarifas y horarios; tampoco acreditan que cada respuesta provenga de una consulta real a la IA.

| Clasificación conforme a L1–L4 | Casos | Porcentaje |
|---|---:|---:|
| Cumple (4/4, todos los datos aplicables verificados) | No calculable | No calculable |
| Parcial (1–3 lineamientos correctos, sin error crítico) | No calculable | No calculable |
| No cumple (0/4 o dato crítico incorrecto) | No calculable | No calculable |
| Pendiente por falta de respuesta completa y evidencia de contraste | **30** | **100% pendientes** |

Los pendientes no se contabilizan como “no cumple” ni como respuestas evaluables. Para completar T3 se requiere guardar el texto íntegro de cada respuesta, captura, fuente consultada y veredicto individual L1–L4; luego calcular porcentajes solo sobre casos evaluables y declarar el denominador.

#### Brechas por plataforma y evidencia

El registro actual solo indica que las cuatro plataformas no entregaron toda la información. No especifica qué lineamientos faltan en cada consulta. En los archivos de imagen del repositorio no se encontraron capturas de esas consultas; solo aparecen imágenes auxiliares de cobertura de pruebas.

| Plataforma | Estado informado | Brecha específica L1–L4 | Evidencia localizada |
|---|---|---|---|
| Moovit | Incompleta | No documentada por lineamiento | No se encontró captura de la consulta en el repositorio. |
| Red Regional | Incompleta | No documentada por lineamiento | No se encontró captura de la consulta en el repositorio. |
| Google Maps | Incompleta | No documentada por lineamiento | No se encontró captura de la consulta en el repositorio. |
| Google | Incompleta | No documentada por lineamiento | No se encontró captura de la consulta en el repositorio. |

**Dictamen HU3:** **parcial**. T1 está consolidada como línea base declarada y T2 define los criterios de contraste. T3 no se puede calcular; T4 no identifica brechas específicas; T5 requiere integrar las evidencias originales.

### 3.4 HU4 — Nueve consultas comparativas de MoviTech

El protocolo está preparado, pero las nueve consultas no cuentan con respuestas reales, capturas, verificación de fuentes ni tiempos/toques medidos. Las siguientes consultas son el plan de ejecución, no resultados:

| ID | Escenario | Consulta de prueba |
|---|---|---|
| C1 | Estación | ¿Qué micro me sirve desde la Estación Quilpué para llegar al Hospital? Indica dónde esperar, tarifa general y adulto mayor, y frecuencia u horario. |
| C2 | Plaza | ¿Cómo voy desde la Plaza de Quilpué al Hospital? Dime la línea, el paradero más cercano, las tarifas general/adulto mayor y cada cuánto pasa. |
| C3 | Municipalidad | Estoy en la Municipalidad de Quilpué, ¿qué línea tomo para llegar al Hospital, dónde espero, cuánto cuesta para adulto y adulto mayor, y cuál es el horario? |
| C4 | Calle | Estoy en calle Freire con Los Carrera, ¿dónde espero y qué micro me lleva al Hospital? Incluye tarifa general/adulto mayor y frecuencia u horario. |
| C5 | Colectivo | ¿Dónde tomo un colectivo desde el centro de Quilpué a Los Pinos? Dime el servicio, paradero, tarifa general y frecuencia u horario. |
| C6 | Radiotaxi | Voy del Hospital de Quilpué al centro: ¿qué micro tomo, dónde espero, cuánto cuesta para adulto/adulto mayor y cada cuánto pasa? Como alternativa, indica un radiotaxi y su tarifa. |
| C7 | Mañana temprano | ¿Cuál es la primera micro desde Villa Alemana al Hospital de Quilpué mañana temprano, dónde la tomo, cuánto cuesta para adulto/adulto mayor y cada cuánto pasa? |
| C8 | Texto con faltas | kmo yego al ospital d quilpue en micro? donde tomo la micro, cuanto sale pa adulto o adulto mayor y cada cuanto pasa? |
| C9 | Adulto mayor | Soy adulto mayor, ¿qué micro tomo desde la Plaza de Quilpué al Hospital, dónde espero, cuánto pago y desde qué hora pasa? Incluye también la tarifa general. |

#### Plantilla de resultados por consulta

| ID | Captura | Fuente y fecha | L1 | L2 | L3 | L4 | Veredicto | Tiempo (s) | Toques | Observaciones |
|---|---|---|---|---|---|---|---|---:|---:|---|
| C1–C9 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | Completar una fila por consulta. |

La respuesta se marca **Cumple** solo si todos los lineamientos aplicables son correctos y están verificados. Para consultas de radiotaxi, evaluar la alternativa por separado; no contabilizar un “N/A” como cumplimiento.

#### Plantilla de tres corridas y umbrales

| Corrida | Tiempo total (s) | Toques | Flujo completo | Evidencia / observación |
|---|---:|---:|---|---|
| 1 | — | — | Pendiente | — |
| 2 | — | — | Pendiente | — |
| 3 | — | — | Pendiente | — |
| **Promedio** | **Pendiente** | **Pendiente** | — | — |

| Métrica | Resultado actual | Umbral de aceptación | Estado |
|---|---:|---:|---|
| Consultas que cumplen | Sin ejecuciones / 9 | ≥ 8 / 9 | Pendiente |
| Tiempo medio de Movitech (3 corridas) | Sin medición | ≤ 90,125 s frente al promedio de línea base (180,25 s) | Pendiente |
| Comparación adicional con Google Maps | Sin medición | ≤ 45 s para superar por 50% la plataforma más rápida registrada | Pendiente |
| Pasos/toques | Sin medición | ≤ 4 para cumplir el máximo absoluto | Pendiente |
| Reducción porcentual de pasos | Sin medición | ≥ 25% frente al caso base individual | Pendiente |

**Nota sobre pasos:** cuatro pasos frente a una línea base de cinco representan una reducción del 20%, no del 25%. Frente a seis pasos, cuatro sí superan el 25%. Se debe registrar la línea base de cada participante; si el caso aplicable es de cinco pasos, se necesitan tres o menos para acreditar la reducción mínima del 25%.

**Dictamen HU4:** **no ejecutada**. La plantilla no debe presentarse como resultado; falta completar la prueba en Telegram, guardar nueve capturas, verificar L1–L4 y medir tres flujos completos en un celular.

## 4. Trazabilidad de datos de transporte y limitaciones

| Servicio | Estado que muestran las pruebas y scripts | Consecuencia para los resultados |
|---|---|---|
| Microbuses | No se acredita un conjunto suficiente de líneas y paraderos con fuente, evidencia y fecha verificables. | No se debe afirmar que una línea/paradero real fue recomendado con exactitud solo porque aparece en un escenario automatizado. |
| Colectivos | Las filas candidatas siguen inactivas o no verificadas; la suite de integración falla cuando espera tarifas/detalles que no tienen fuente comprobable. | La respuesta “sin líneas verificadas” es un resguardo de calidad, no evidencia de que no existan colectivos en Quilpué. |
| Radiotaxis | La consulta registra que falta `servicio_radiotaxi.verificado` en el esquema de Supabase utilizado. No se acredita autorización vigente de los candidatos. | No publicar centrales, teléfonos ni tarifas sin verificar; aplicar y validar la migración antes de repetir la integración. |
| Paraderos | La prueba de sistema marca las 20 ubicaciones como no evaluables al no encontrar paraderos verificados. | La fórmula puede probarse, pero el sistema no demuestra la exactitud geográfica de recomendaciones reales. |

Referencias de implementación y evidencia: [`hu1-hu2-auditoria-fuentes-y-geolocalizacion.md`](./backend/docs/acceptance/hu1-hu2-auditoria-fuentes-y-geolocalizacion.md), [`hu3-validacion-paraderos.md`](./backend/docs/acceptance/hu3-validacion-paraderos.md), [`hu3-resultados-sistema.csv`](./backend/test/system/hu3-resultados-sistema.csv) y [`hu2-resultados-sistema.csv`](./backend/test/system/hu2-resultados-sistema.csv).

## 5. Detalle de fallas y justificaciones

| Prueba fallida | Resultado observado | Justificación / acción necesaria |
|---|---|---|
| `hu2-comparativo.spec.ts` — tarifa | La prueba esperaba `$150` y recibió “No verificada”. | No se fija una tarifa sin fuente vigente. Actualizar el caso de prueba cuando exista respaldo oficial; no sustituir el dato por un valor supuesto. |
| `hu2-comparativo.spec.ts` — teclado | La prueba esperaba dos filas y recibió tres. | La interfaz actual incluye una fila adicional de acciones para reiniciar/finalizar. Alinear la expectativa con el comportamiento aprobado de interfaz. |
| E2E `chat-horarios.e2e-spec.ts` | Tres casos excedieron el timeout de 5 s; el conjunto queda en 2/5. | No se acredita el resultado de esos tres casos. Investigar la latencia/dependencias del entorno y repetir tras resolverlo; no aumentar el timeout sin identificar la causa. |
| Integración HU comparativa | 5/8 fallaron: un timeout, tarifas no verificadas, respuesta sin contactos de radiotaxi y diferencias con textos/expectativas antiguas. | Las aserciones esperan información que no está verificada o textos previos. Actualizar expectativas a criterios seguros y corregir el esquema/datos antes de validar servicios reales. |
| Integración HU ubicación | 3/6 fallaron: no se encontró paradero, punto seguro ni filas persistidas verificadas. | Falta cargar y verificar los registros y comprobar la migración del esquema. No es un fallo de la fórmula en sí. |
| Sistema HU ubicación | 0/20 ubicaciones evaluables. | Sin paraderos verificados no puede calcularse el error frente a una referencia real. No reportar este resultado como “0% de precisión”. |
| HU3, respuestas IA | No es posible clasificar las 30 respuestas con L1–L4. | Faltan respuestas íntegras y evidencia de fuentes por caso; conservar los 30 como pendientes hasta recopilar la trazabilidad. |
| HU4, aceptación | No hay resultados de las nueve consultas ni tres mediciones de flujo. | Ejecutar en Telegram y celular; conservar captura, fuente, fecha, duración y conteo de toques por caso. |

## 6. Comandos reproducibles

Ejecutar desde la carpeta `backend/`:

```powershell
# Suite unitaria general (15 suites)
npm test -- --runInBand

# Suites unitarias focalizadas HU comparativa y Haversine
npx jest --runInBand --rootDir . test/unit/hu2-comparativo.spec.ts test/unit/hu3-haversine.spec.ts

# Pruebas E2E
npm run test:e2e -- --runInBand

# Integración del Hito 3 (los archivos usan el sufijo integration-spec.ts)
npx jest --runInBand --rootDir . --testRegex '.*integration-spec\.ts$' test/integration/hu2-flujo-interactivo.integration-spec.ts test/integration/hu3-ubicacion.integration-spec.ts test/integration/hu6-pipeline-ia.integration-spec.ts
```

La suite de integración puede imprimir errores esperados de consulta de Supabase cuando falta la columna de verificación. No ejecutar scripts de limpieza o poblamiento para “hacer pasar” la prueba: primero confirmar el esquema, la fuente y el estado de cada registro.

## 7. Conclusión y condiciones de cierre

La ejecución confirma que la lógica unitaria general del backend está estable en el entorno probado. No obstante, la integración y la evidencia de sistema muestran que faltan datos de transporte verificados y que varias expectativas de pruebas todavía suponen tarifas, paraderos o contactos que el sistema correctamente no publica sin respaldo.

Para cerrar el Hito 3 se requiere:

1. Verificar y cargar fuentes oficiales, coordenadas y sentido de los paraderos; comprobar la migración de Supabase.
2. Capturar las consultas de línea base y completar las brechas L1–L4 por plataforma.
3. Guardar y clasificar las 30 respuestas de IA usando el texto real y fuentes fechadas.
4. Ejecutar las nueve consultas HU4 en Telegram, guardar capturas y completar la verificación de fuentes.
5. Medir tres corridas completas en celular, contar toques y calcular las reducciones con las fórmulas indicadas.
6. Repetir E2E e integración después de resolver dependencias, esquema y aserciones; adjuntar los resultados reproducibles.

Hasta completar estos puntos, el dictamen conjunto del Hito 3 es **parcial**: hay evidencia de lógica automatizada, pero no evidencia suficiente para afirmar que se cumplieron todos los criterios de aceptación con servicios y datos reales.
