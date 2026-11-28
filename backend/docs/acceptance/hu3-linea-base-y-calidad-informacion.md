# HU de comprobación 3 - Línea base y calidad de la información

**Propósito:** evaluar las plataformas actuales y dejar definidos los criterios con que se verificará la información de transporte de Movitech.  
**Relación:** OE1. Esta HU es de comprobación; no incorpora funcionalidades al producto.  
**Estado:** línea base transcrita; clasificación de respuestas y brechas por plataforma pendientes de evidencia verificable.

## 1. Línea base de plataformas

Se conservan los tiempos y pasos entregados para esta historia. No se informa fecha, dispositivo, recorrido exacto ni capturas asociadas; por ello, esta tabla registra la línea base declarada, pero no permite reproducir ni auditar las mediciones todavía.

| Plataforma | Tiempo registrado | Tiempo (s) | Pasos registrados | ¿Entrega toda la información? | Evidencia / observación |
|---|---:|---:|---:|---|---|
| Moovit | 3:32 | 212 | 5 | No | Incorporar captura y registro del recorrido medido |
| Red Regional | 4:29 | 269 | 5 | No | Incorporar captura y registro del recorrido medido |
| Google Maps | 1:30 | 90 | 4 | No | Incorporar captura y registro del recorrido medido |
| Google | 2:30 | 150 | 5 o más | No | Precisar el número observado y adjuntar captura |

El promedio aritmético de los cuatro tiempos registrados es **180,25 s (3:00,25 min)**. Como referencia secundaria, la plataforma más rápida registrada es Google Maps, con **90 s**. Para evitar escoger el comparador después de ver los resultados, se propone usar el promedio como comparación principal y reportar también el resultado frente a cada plataforma individual.

La meta de reducir el tiempo al menos 50% equivale a:

- **Comparación principal (promedio):** Movitech promedio de tres corridas ≤ **90,125 s** (1:30,125 min).
- **Comparación más exigente (Google Maps):** Movitech promedio de tres corridas ≤ **45 s**.

## 2. Lineamientos de información correcta

La respuesta se evalúa con información del viaje que consulta la persona. Cada verificación debe registrar la fecha, comuna/servicio y enlace o captura de la fuente utilizada. No se debe completar un dato por inferencia si la fuente no lo publica.

| ID | Lineamiento | Regla para marcar “cumple” | Fuente para verificar |
|---|---|---|---|
| L1 | Línea que llega al destino (incluido el Hospital cuando corresponda) | Identifica una línea/servicio vigente que efectivamente llega al destino o indica de forma clara la combinación necesaria. | Recorridos y planes operacionales publicados por la [División de Transporte Público Regional (DTPR), Gran Valparaíso](https://dtpr.gob.cl/pe/gran-valparaiso/), y confirmación del operador o SEREMI cuando el recorrido local no aparezca en el portal. Para EFE, usar los canales oficiales de [EFE Valparaíso](https://www.efe.cl/). Moovit sirve como referencia secundaria para localizar candidatos y detectar discrepancias, no como única verificación. |
| L2 | Paradero de espera más cercano y útil | Identifica un paradero real, el lado/dirección cuando sea necesario y que allí se pueda abordar la línea indicada. Comparar ubicación y recorrido peatonal; no basta con el punto geográfico más cercano si no sirve la línea. | Paraderos/recorrido del operador o autoridad de transporte; comprobar ubicación con cartografía y recorrido peatonal de [Google Maps](https://maps.google.com/) según permite la prueba HU4. [Moovit](https://moovitapp.com/) puede aportar nombres/distancias peatonales de referencia, que deben contrastarse y no sustituyen coordenadas ni la validación del sentido. |
| L3 | Tarifa vigente, incluida la de adulto mayor | Entrega el valor vigente para la modalidad y tramo consultados, distingue tarifa general y adulto mayor cuando corresponda, y no presenta como universal una tarifa de otro servicio o zona. | Tarifario/plan operacional vigente de DTPR o SEREMI y publicación oficial del operador. La página DTPR de Gran Valparaíso describe la tarifa adulto mayor como 50% de la tarifa adulto para los servicios allí regulados; confirmar su aplicación concreta y vigencia para cada servicio antes de calificar. |
| L4 | Frecuencia u horario | Indica frecuencia o primer/último servicio que corresponda a la consulta, con día/franja relevante y sin presentarlo como garantía si es referencial. | Plan operacional y horario oficial del operador o DTPR; para tren, horario oficial de EFE. Registrar fecha de consulta. Si la fuente oficial no publica frecuencia, anotar “no publicado” en vez de inventar un valor. |

## 3. Clasificación de las 30 respuestas de IA existentes

Se utilizaron como registros de entrada [hu6-resultados-sistema.csv](../../test/system/hu6-resultados-sistema.csv), [hu6-prompts-sistema.ts](../../test/system/hu6-prompts-sistema.ts) y [hu6-evaluacion-calidad-ia.csv](hu6-evaluacion-calidad-ia.csv). Estos archivos no incluyen el texto íntegro de las 30 respuestas de IA ni evidencia por respuesta para verificar línea, paradero, tarifa y frecuencia. El CSV del sistema registra principalmente intención, destino y latencias; además, el código puede simular respuestas estructuradas cuando no existe `GEMINI_API_KEY`.

Por lo tanto, no es válido asignar “cumple”, “parcial” o “no cumple” a las cuatro reglas basándose únicamente en intención o puntuación general de tono/calidad. Resultado documental actual:

| Resultado de clasificación | Casos | Porcentaje de los 30 |
|---|---:|---:|
| Cumple los cuatro lineamientos | No calculable | No calculable |
| Parcial | No calculable | No calculable |
| No cumple | No calculable | No calculable |
| Pendiente: falta respuesta íntegra y evidencia de contraste | 30 | 100% pendientes |

Para cerrar T3, incorporar por cada ID el texto exacto devuelto en la ejecución real, captura, fuentes consultadas y veredicto independiente L1-L4. Después clasificar: **cumple** = 4/4; **parcial** = 1-3/4 sin error crítico; **no cumple** = 0/4 o dato crítico incorrecto. Reportar porcentajes sobre 30 respuestas evaluables; los casos sin evidencia deben permanecer fuera del denominador y declararse aparte.

## 4. Brechas de información por plataforma

El registro de línea base sólo afirma que ninguna plataforma entrega toda la información. No identifica qué campos faltaron en cada una ni incluye capturas en los registros revisados. No se atribuyen brechas específicas sin evidencia.

| Plataforma | Brecha general registrada | Campos L1-L4 faltantes | Evidencia requerida |
|---|---|---|---|
| Moovit | Información incompleta | Completar desde captura: L1 __ / L2 __ / L3 __ / L4 __ | Captura existente, consulta, fecha y URL |
| Red Regional | Información incompleta | Completar desde captura: L1 __ / L2 __ / L3 __ / L4 __ | Captura existente, consulta, fecha y URL |
| Google Maps | Información incompleta | Completar desde captura: L1 __ / L2 __ / L3 __ / L4 __ | Captura existente, consulta, fecha y URL |
| Google | Información incompleta | Completar desde captura: L1 __ / L2 __ / L3 __ / L4 __ | Captura existente, consulta, fecha y URL |

Marcar para cada lineamiento **presente y correcto**, **parcial/ambiguo**, **ausente** o **incorrecto**. Adjuntar las capturas ya existentes al informe o indicar la ruta estable donde se guardaron. La afirmación “no entrega toda la información” no sustituye este desglose.

## 5. Cierre de aceptación y evidencia por completar

- [x] T1: tiempos y pasos declarados consolidados; falta documentar condiciones y evidencia original.
- [x] T2: cuatro lineamientos y sus fuentes de contraste definidos.
- [ ] T3: clasificar las 30 respuestas; requiere sus respuestas íntegras y evidencias.
- [ ] T4: identificar brechas exactas de cada plataforma usando las capturas existentes.
- [ ] T5: integrar resultados, fechas, condiciones y evidencias en el informe final.

La HU queda **parcialmente documentada**, no aprobada como comprobación final, hasta completar T3-T5.

### Advertencia sobre las pruebas geográficas históricas

El CSV `../../test/system/hu3-resultados-sistema.csv` contenía una comparación tautológica: la distancia calculada y la distancia de referencia provenían de la misma función Haversine, por lo que el error cero no medía exactitud. Tampoco existía evidencia de origen para los paraderos que aparecían en él, y las 20 coordenadas de escenario del script no validan por sí mismas la existencia de esos paraderos. El script se corrigió para usar una referencia geodésica independiente (Vincenty) y para no contabilizar resultados sin paradero verificado. Al ejecutarlo con el catálogo actual, 0 de 20 casos son evaluables; por tanto, el sistema no demuestra todavía el criterio de exactitud ni el flujo completo. Hasta incorporar datos geográficos verificables y volver a ejecutar la prueba, esos resultados históricos no acreditan el criterio de exactitud.
