# Hito 3 — Informe de ejecución HU3

## Línea base y lineamientos de información correcta

| Antecedente | Resultado |
|---|---|
| Historia | HU3 — evaluar plataformas actuales y definir criterios de información correcta |
| Relación | OE1 |
| Dictamen | **Parcial; faltan clasificación y evidencias por plataforma** |

## Línea base registrada

Las mediciones siguientes se consolidan según los datos entregados para el proyecto. No se encontró registro de fecha, dispositivo, recorrido exacto ni capturas que permitan reproducirlas.

| Plataforma | Tiempo | Segundos | Pasos | ¿Entrega toda la información? | Brechas por lineamiento |
|---|---:|---:|---:|---|---|
| Moovit | 3:32 | 212 | 5 | No | No individualizadas; falta revisar captura. |
| Red Regional | 4:29 | 269 | 5 | No | No individualizadas; falta revisar captura. |
| Google Maps | 1:30 | 90 | 4 | No | No individualizadas; falta revisar captura. |
| Google | 2:30 | 150 | 5 o más | No | No individualizadas; falta precisar pasos y revisar captura. |

El promedio aritmético es **180,25 s (3:00,25 min)**. Google Maps es la referencia más rápida registrada, con 90 s.

## Lineamientos de información correcta

| ID | Información | Regla | Fuente de verificación |
|---|---|---|---|
| **L1** | Línea que llega al destino | El servicio vigente llega al destino, o se explica la combinación necesaria. | [DTPR — Gran Valparaíso](https://dtpr.gob.cl/pe/gran-valparaiso/), plan operacional y confirmación del operador/SEREMI si corresponde. Para tren, [EFE Valparaíso](https://www.efe.cl/). |
| **L2** | Paradero más cercano y útil | Existe y sirve a la línea y sentido recomendados; no basta con proximidad geométrica. | Operador o autoridad para el servicio; [Google Maps](https://maps.google.com/) para contrastar ubicación y trayecto peatonal. Moovit es referencia secundaria. |
| **L3** | Tarifa vigente, general y adulto mayor | El valor corresponde al servicio, tramo y categoría; si no está confirmado, se informa como no verificado. | Tarifario vigente de DTPR/SEREMI u operador. No extrapolar tarifas de buses regulados a taxis colectivos. |
| **L4** | Frecuencia u horario | Se informa el día/franja aplicable; si la fuente no publica el dato, se indica “no publicado”. | Plan operacional y horario oficial del operador/DTPR; para tren, EFE. |

## Clasificación de las 30 respuestas de IA

Los archivos [`hu6-resultados-sistema.csv`](../../test/system/hu6-resultados-sistema.csv) y [`hu6-evaluacion-calidad-ia.csv`](hu6-evaluacion-calidad-ia.csv) contienen registros y puntuaciones, pero no las 30 respuestas completas junto con fuentes fechadas para verificar L1–L4. El tono o una puntuación general no acreditan exactitud de rutas, paraderos, tarifas y horarios.

| Clasificación L1–L4 | Casos | Porcentaje |
|---|---:|---:|
| Cumple (4/4 aplicables, verificados) | No calculable | No calculable |
| Parcial (1–3 correctos, sin error crítico) | No calculable | No calculable |
| No cumple (0/4 o dato crítico incorrecto) | No calculable | No calculable |
| Pendiente por falta de respuesta completa y evidencia | **30** | **100% pendientes** |

Los pendientes no se cuentan como “no cumple” ni como casos evaluables. Para completar la clasificación se necesita conservar la respuesta íntegra, captura, fuente, fecha y evaluación L1–L4 de cada caso.

## Brechas por plataforma y evidencia

El registro solo indica que ninguna de las plataformas entregó toda la información. No desglosa qué campos faltaron en cada una. En los archivos de imagen del repositorio no se localizaron capturas de las consultas; solo imágenes auxiliares de cobertura.

| Plataforma | Estado informado | Campos faltantes | Evidencia |
|---|---|---|---|
| Moovit | Incompleta | No documentados por L1–L4 | Captura no localizada en el repositorio. |
| Red Regional | Incompleta | No documentados por L1–L4 | Captura no localizada en el repositorio. |
| Google Maps | Incompleta | No documentados por L1–L4 | Captura no localizada en el repositorio. |
| Google | Incompleta | No documentados por L1–L4 | Captura no localizada; falta precisar cantidad de pasos. |

## Estado de tareas

| Tarea | Estado | Justificación |
|---|---|---|
| T1 — Consolidar tiempos y pasos | **Parcialmente realizada** | Tabla consolidada; faltan condiciones y evidencia original. |
| T2 — Definir cuatro lineamientos y fuentes | **Realizada documentalmente** | Se definieron L1–L4 y fuentes de contraste; la verificación concreta se realiza por consulta. |
| T3 — Clasificar las 30 respuestas | **Pendiente** | No están disponibles las respuestas completas con fuentes por caso. |
| T4 — Identificar datos faltantes por plataforma | **Pendiente** | No se encontraron capturas ni desglose por campo. |
| T5 — Integrar brechas y evidencia | **Pendiente** | Requiere completar T3 y T4. |

## Conclusión

**HU3 queda parcialmente documentada.** La línea base y los lineamientos están consolidados, pero no se deben inventar porcentajes de exactitud ni brechas por plataforma. El cierre depende de recuperar capturas y respuestas completas, y documentar sus fuentes.
