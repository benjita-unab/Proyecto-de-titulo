# Hito 3 — Informe de ejecución HU2

## Paradero más cercano mediante Haversine

| Antecedente | Resultado |
|---|---|
| Historia | HU2 — localizar un paradero de una línea que llegue al destino |
| Fecha de ejecución automatizada | 27 de noviembre de 2026 |
| Dictamen | **Parcial; exactitud con datos reales no acreditada** |

## Objetivo

Comprobar la validación de coordenadas, el cálculo de distancia, la selección de paraderos y la recomendación de un punto de espera útil para una línea que llegue al destino consultado.

## Resultados

| Nivel | Resultado | Interpretación |
|---|---:|---|
| Unitaria [`hu3-haversine.spec.ts`](../../test/unit/hu3-haversine.spec.ts) | **18/18 aprobadas** | Se prueban distancia, casos borde, coordenadas, radio de búsqueda, ampliación progresiva, enlaces y rendimiento del cálculo con datos controlados. |
| Integración [`hu3-ubicacion.integration-spec.ts`](../../test/integration/hu3-ubicacion.integration-spec.ts) | **3/6 aprobadas** | Pasan validaciones de coordenadas inválidas y la medición local. Fallan la respuesta con paradero, el punto seguro y la consulta de paraderos persistidos, al no haber registros verificados disponibles. |
| Sistema [`hu3-resultados-sistema.csv`](../../test/system/hu3-resultados-sistema.csv) | **0/20 evaluables** | Las ubicaciones no encontraron paraderos verificados. No equivale a 0% de precisión: no hubo puntos de referencia válidos para medir el error. |

En el benchmark local de integración, el resumen comparativo obtuvo 248 ms de promedio y 336 ms P95; el desglose, 237 ms de promedio y 422 ms P95. Esas cifras miden el endpoint bajo prueba, no el tiempo completo percibido por una persona en Telegram.

## Justificación técnica

Haversine permite estimar la distancia geodésica en línea recta entre dos coordenadas. Las pruebas unitarias no demuestran que los puntos sean paraderos reales, que sirvan a la línea/sentido indicado ni que la distancia corresponda al trayecto caminable. La distancia a pie requiere contrastar una ruta peatonal; la existencia y operación del servicio requieren una fuente de transporte verificable.

La ejecución también registra que falta la columna `servicio_radiotaxi.verificado` en el esquema de Supabase consultado. El sistema no debe mostrar contactos de radiotaxi sin verificar. La lista vacía resultante no prueba que no existan operadores.

## Criterios de aceptación

| Criterio | Estado | Justificación |
|---|---|---|
| Recomendar paradero y línea real que llegue al hospital, con distancia y mapa | **No acreditado** | No se encontraron paraderos verificados disponibles para contrastar la recomendación. |
| Ordenar alternativas y mostrar máximo tres | **Cobertura parcial** | La lógica se prueba con datos controlados, no con un catálogo real verificado. |
| Ampliar progresivamente el radio e informar la distancia | **Cobertura unitaria** | La lógica de radio está probada; no se valida la recomendación real por falta de registros. |
| Error <10 m en al menos 85% de 20 ubicaciones | **No evaluable** | 0/20 casos tienen paradero verificado contra el cual calcular error. |
| Respuesta ≤1,5 s en el 95% de casos | **Parcial** | Hay una medición local de endpoint; falta medir el flujo real completo y el conjunto requerido. |

## Conclusión

**HU2 queda parcial.** La lógica matemática está cubierta; antes de aceptar la exactitud se deben verificar las coordenadas, líneas, sentidos y paraderos, aplicar la migración necesaria de Supabase y repetir integración y sistema con 20 ubicaciones válidas.
