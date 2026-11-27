# Hito 3 — Informe de ejecución HU1

## Selección de destino y medio de transporte mediante botones

| Antecedente | Resultado |
|---|---|
| Historia | HU1 — flujo guiado de Telegram |
| Fecha de ejecución automatizada | 27 de noviembre de 2026 |
| Dictamen | **Parcial; aceptación en dispositivo pendiente** |

## Objetivo

Comprobar que una persona pueda escoger un destino, compartir su ubicación y seleccionar microbús, colectivo o radiotaxi mediante botones con etiquetas visibles, sin tener que escribir ni enviar una nota de voz.

## Evidencia de ejecución

La suite general del backend se ejecutó con `npm test -- --runInBand`: **15 suites, 140/140 pruebas aprobadas**. Incluye la suite [`telegram.service.spec.ts`](../../src/telegram/telegram.service.spec.ts), que comprueba, entre otros aspectos, etiquetas de botones, destinos, compartir ubicación, callbacks y el comportamiento seguro cuando faltan datos verificados.

La suite de integración relacionada con el flujo comparativo de opciones obtuvo **3/8 aprobadas** en la ejecución del 27 de noviembre. No constituye por sí sola una prueba de aceptación de HU1: mezcla criterios de selección de transporte, tarifas, radiotaxis y textos de respuesta.

| Criterio | Estado | Justificación |
|---|---|---|
| Bienvenida y botones con texto visible | **Parcial** | Hay comprobaciones unitarias del formato del teclado; falta captura de la conversación real desplegada. |
| Flujo completo en ≤4 toques y respuesta ≤1,5 s | **No acreditado** | No se midió en un celular ni se registraron tres corridas completas. |
| Alternativa si no se comparte ubicación y botón para reintentar | **Pendiente de aceptación** | No hay un registro de ejecución real que recorra este caso de principio a fin. |
| Ocultar simulaciones en producción | **Cobertura unitaria** | Se prueba la configuración del teclado, pero no se adjuntó evidencia del despliegue productivo. |

## Incidencias y justificación

- Las pruebas automatizadas confirman componentes del flujo, no el número de toques que realiza una persona.
- No se localizaron capturas del flujo real ni mediciones de latencia de extremo a extremo desde Telegram en celular.
- Los datos de transporte no verificados no deben mostrarse como reales. La respuesta segura sin resultados confirmados no prueba que el servicio no exista.

## Conclusión

**HU1 queda parcial.** Para cerrar la historia se debe probar el flujo real desde el mensaje inicial, registrar pasos/toques y tiempo de cada respuesta, comprobar el caso sin ubicación y adjuntar capturas legibles.
