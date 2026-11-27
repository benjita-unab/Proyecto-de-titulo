# Hito 3 — Informe de ejecución HU4

## Nueve consultas comparativas de MoviTech

| Antecedente | Resultado |
|---|---|
| Historia | HU4 — probar MoviTech frente a los lineamientos y la línea base |
| Relación | OE4 y objetivo general |
| Dictamen | **No ejecutada; existe protocolo y plantilla** |

## Criterios de aceptación

1. Al menos **8 de 9** consultas cumplen los lineamientos aplicables L1–L4, contrastados con fuente oficial.
2. El tiempo medio de tres corridas completas es al menos 50% menor que la línea base. El promedio registrado de las cuatro plataformas es 180,25 s; el umbral resultante es **≤90,125 s**. Como comparación adicional, Google Maps registró 90 s, por lo que un resultado 50% menor frente a esa plataforma sería **≤45 s**.
3. El flujo ocupa **≤4 pasos** y la reducción respecto a la línea base individual es **≥25%**.

## Consultas de prueba

Estas consultas conforman el protocolo; no son resultados ejecutados.

| ID | Escenario | Consulta |
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

## Plantilla de evaluación

Completar una fila por consulta. “Cumple” requiere que todos los lineamientos aplicables sean correctos y tengan evidencia. Un “N/A” debe justificarse y no cuenta por sí solo como cumplimiento.

| ID | Captura | Fuente y fecha | L1 | L2 | L3 | L4 | Veredicto | Tiempo (s) | Toques | Observaciones |
|---|---|---|---|---|---|---|---|---:|---:|---|
| C1 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C2 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C3 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C4 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C5 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C6 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C7 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C8 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |
| C9 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | — | — | — |

## Plantilla de tres corridas completas

Usar el mismo dispositivo, punto inicial, destino y criterio de término. Registrar desde que se abre el bot hasta que la información solicitada está disponible; no excluir repreguntas o interrupciones.

| Corrida | Tiempo total (s) | Toques | Flujo completo | Evidencia / observación |
|---|---:|---:|---|---|
| 1 | — | — | Pendiente | — |
| 2 | — | — | Pendiente | — |
| 3 | — | — | Pendiente | — |
| **Promedio** | **Pendiente** | **Pendiente** | — | — |

## Resultados actuales y justificación

| Métrica | Resultado observado | Meta | Dictamen |
|---|---:|---:|---|
| Consultas correctas | Sin ejecución / 9 | ≥8/9 | Pendiente |
| Tiempo medio de Movitech | Sin tres mediciones | ≤90,125 s frente al promedio de línea base | Pendiente |
| Pasos/toques | Sin medición en celular | ≤4 | Pendiente |
| Reducción de pasos | No calculable | ≥25% frente al caso base individual | Pendiente |

Cuatro pasos frente a cinco son una reducción del 20%, no del 25%. Frente a seis pasos, cuatro sí superan el 25%. Por tanto, se debe conservar el número de pasos de la línea base de cada participante; si el valor base es cinco, se requieren tres o menos pasos para alcanzar la reducción mínima.

No se encontraron capturas de las nueve respuestas ni registros de las tres corridas en la documentación del repositorio. Las mediciones de endpoints en pruebas de integración no sustituyen el tiempo de búsqueda completo en un celular.

## Conclusión

**HU4 no se puede declarar cumplida.** La plantilla está preparada; faltan las ejecuciones en Telegram, las capturas, el contraste de cada respuesta con las fuentes y las tres mediciones completas. Hasta contar con esos datos, no corresponde afirmar el cumplimiento de 8/9, 50% de reducción de tiempo ni 25% de reducción de pasos.
