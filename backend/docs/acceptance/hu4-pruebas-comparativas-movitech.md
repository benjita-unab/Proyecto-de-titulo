# HU de comprobación 4 - Prueba comparativa de Movitech

**Propósito:** comprobar, con consultas y mediciones reproducibles, si Movitech entrega información correcta y reduce tiempo/pasos frente a la línea base de [HU de comprobación 3](hu3-linea-base-y-calidad-informacion.md).  
**Relación:** OE4 y objetivo general. Esta HU es de comprobación; no incorpora funcionalidades.  
**Estado:** protocolo y plantilla preparados; las nueve ejecuciones, capturas y tres mediciones de flujo deben completarse en Telegram con el sistema disponible.

## 1. Criterios de aceptación

1. Al menos **8 de 9 consultas (88,9%)** cumplen los cuatro lineamientos L1-L4 de HU3, verificados con fuente oficial o Google Maps para ubicación/ruta peatonal.
2. Se ejecutan tres corridas completas en un celular. La media del tiempo Movitech debe ser al menos 50% menor que el promedio de la línea base (**180,25 s**); umbral: **≤90,125 s**.
3. El flujo ocupa como máximo cuatro pasos. Para demostrar además una reducción de al menos 25% frente a un caso base de cinco pasos, el resultado debe ser **≤3 pasos** (4 frente a 5 es sólo 20%). Si el caso base individual es de seis pasos, cuatro pasos representan 33,3% de reducción. Reportar ambos criterios por separado; no declarar cumplido el 25% sin identificar el número base aplicable.

## 2. Protocolo de ejecución

1. Registrar fecha, versión/build de Movitech, celular, conexión, comuna, operador y condición de la prueba.
2. Abrir el bot de Movitech en Telegram en estado inicial y ejecutar las nueve consultas siguientes, sin alterar el texto entre corridas de una misma consulta. Guardar una captura legible de cada respuesta.
3. Verificar cada respuesta contra L1-L4 de HU3. Usar fuente oficial vigente; usar Google Maps para confirmar el lugar/paradero y trayecto peatonal, no para validar tarifas. Moovit puede registrarse como referencia secundaria para nombres, líneas y distancias a pie, pero no cuenta por sí solo como verificación ni como fuente de tarifas.
4. Cronometrar en celular el flujo completo desde el envío de la consulta hasta que la información solicitada está disponible. Hacer tres corridas independientes y contar los toques necesarios. No contar la captura de evidencia.
5. Si un dato no aplica a la consulta (por ejemplo, se pregunta explícitamente por radiotaxi), marcarlo **N/A** y justificarlo; no convertir un N/A en cumplimiento. Para la meta 8/9, todos los lineamientos aplicables a esa consulta deben ser correctos.
6. Completar las tablas de resultados y calcular las reducciones con las fórmulas indicadas. Registrar cualquier fallo, aclaración solicitada o interrupción, sin excluirlo silenciosamente.

## 3. Consultas de prueba

| ID | Escenario | Consulta exacta para Telegram | Aspectos principales |
|---|---|---|---|
| C1 | Estación | ¿Qué micro me sirve desde la Estación Quilpué para llegar al Hospital? Indica dónde esperar, tarifa general y adulto mayor, y frecuencia u horario. | L1-L4 |
| C2 | Plaza | ¿Cómo voy desde la Plaza de Quilpué al Hospital? Dime la línea, el paradero más cercano, las tarifas general/adulto mayor y cada cuánto pasa. | L1-L4 |
| C3 | Municipalidad | Estoy en la Municipalidad de Quilpué, ¿qué línea tomo para llegar al Hospital, dónde espero, cuánto cuesta para adulto y adulto mayor, y cuál es el horario? | L1-L4 |
| C4 | Calle | Estoy en calle Freire con Los Carrera, ¿dónde espero y qué micro me lleva al Hospital? Incluye tarifa general/adulto mayor y frecuencia u horario. | L1-L4 |
| C5 | Colectivo | ¿Dónde tomo un colectivo desde el centro de Quilpué a Los Pinos? Dime el servicio, paradero, tarifa general y frecuencia u horario. | L1-L4 aplicables |
| C6 | Radiotaxi | Voy del Hospital de Quilpué al centro: ¿qué micro tomo, dónde espero, cuánto cuesta para adulto/adulto mayor y cada cuánto pasa? Como alternativa, indica un radiotaxi y su tarifa. | L1-L4 para el viaje en micro; verificar además la alternativa de radiotaxi |
| C7 | Mañana temprano | ¿Cuál es la primera micro desde Villa Alemana al Hospital de Quilpué mañana temprano, dónde la tomo, cuánto cuesta para adulto/adulto mayor y cada cuánto pasa? | L1-L4 |
| C8 | Texto con faltas | kmo yego al ospital d quilpue en micro? donde tomo la micro, cuanto sale pa adulto o adulto mayor y cada cuanto pasa? | L1-L4 |
| C9 | Adulto mayor | Soy adulto mayor, ¿qué micro tomo desde la Plaza de Quilpué al Hospital, dónde espero, cuánto pago y desde qué hora pasa? Incluye también la tarifa general. | L1-L4, incluida tarifa adulto mayor |

## 4. Plantilla de evaluación de las nueve respuestas

Copiar una fila por consulta. El veredicto debe ser **Cumple** sólo cuando todos los lineamientos aplicables estén verificados. El campo “resultado 4/4” debe incluir nota si hubo algún N/A.

| ID | Captura/ruta | Fuente y fecha de verificación | L1 | L2 | L3 | L4 | Veredicto | Tiempo (s) | Pasos/toques | Observaciones |
|---|---|---|---|---|---|---|---|---:|---:|---|
| C1 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C2 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C3 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C4 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C5 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C6 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C7 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C8 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |
| C9 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | | | |

**Atención:** C6 pide una alternativa de radiotaxi además del viaje en micro. Evaluar L1-L4 para el viaje en micro y registrar aparte si la alternativa de taxi es clara y verificable. Si un lineamiento resulta genuinamente no aplicable, justificarlo; no convertir un N/A en cumplimiento.

## 5. Plantilla de tres corridas del flujo completo

Usar el mismo punto de inicio, destino/tarea y criterio de término en cada corrida. Registrar toques desde que se abre el bot hasta que la respuesta ofrece información utilizable. Si se requiere interacción adicional para obtener los datos solicitados, incluirla en tiempo y pasos.

| Corrida | Tiempo total (s) | Pasos/toques | ¿Flujo completo? | Evidencia/observación |
|---|---:|---:|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| **Promedio** | | | | |

## 6. Cálculo y dictamen

- Consultas que cumplen: `n / 9 × 100%`; aprobar exactitud con **n ≥ 8**.
- Tiempo medio Movitech: `(t1 + t2 + t3) / 3`.
- Reducción frente a una plataforma: `(tiempo_plataforma - tiempo_medio_Movitech) / tiempo_plataforma × 100%`.
- Comparación principal: `tiempo_plataforma = 180,25 s`; aprobar si Movitech promedio es **≤90,125 s**.
- Pasos: comparar el promedio de toques con el caso adulto mayor observado y adjuntar los registros. Aprobar el máximo de cuatro pasos sólo si el flujo medido queda en **≤4**. Aprobar también la reducción del 25% únicamente si `(pasos_base - pasos_Movitech) / pasos_base × 100% ≥25%`.

| Métrica | Resultado observado | Meta | Cumple |
|---|---:|---:|---|
| Consultas correctas | Pendiente / 9 | ≥ 8 / 9 | Pendiente |
| Tiempo medio Movitech (3 corridas) | Pendiente | ≤ 90,125 s | Pendiente |
| Pasos medios/completados | Pendiente | ≤ 4 pasos | Pendiente |
| Reducción de pasos vs. base observada | Pendiente | ≥ 25% | Pendiente |

No presentar esta plantilla como resultados ejecutados. La HU sólo podrá cerrarse cuando se adjunten las capturas, fuentes verificadas, tres mediciones completas y cálculos observados.
