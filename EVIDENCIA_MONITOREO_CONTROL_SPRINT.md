# Evidencia de monitoreo y control del sprint

**Proyecto:** MoviTech  
**Período revisado:** 25 de agosto al 13 de septiembre de 2026  
**Rama de integración:** `main`  
**Rama fuente del PR de cierre:** `correciones-HU-Y-Pruebas-generales`  
**Tipo de documento:** reconstrucción retrospectiva a partir del historial Git/GitHub y la documentación de pruebas disponible.

## 1. Propósito y alcance

Este informe registra los cambios integrados durante el período, los controles de calidad que sí tienen respaldo documental y las afirmaciones que no se pudieron comprobar con registros de ejecución. No sustituye los informes de aceptación de las historias de usuario ni presenta como ejecutada una prueba de la que no se encontró salida, captura o registro.

La fuente principal para las fechas, ramas y estados fue el historial de PR y commits del repositorio. La documentación de pruebas se usó como evidencia declarativa, no como sustituto de los logs de Jest, E2E o CI.

## 2. Resumen de seguimiento

| Indicador | Resultado revisado | Observación de control |
|---|---|---|
| Integración | PR #3 al #21 dirigidos a `main` | `correciones-HU-Y-Pruebas-generales` fue la rama fuente del PR #21, no la rama destino consolidada. |
| PRs integrados | 18 PRs: #3–#15 y #17–#21 | El PR #16 se cerró sin merge. El PR #17 sí se integró y comparte el mismo SHA de origen que el #16. |
| “14 PRs (#3 al #20)” | No coincide con GitHub | El rango contiene 18 números; 17 PRs de ese rango se integraron y el #16 no. El #21 añade un PR integrado más. |
| Automatización de pruebas | No se encontró un workflow de Jest/E2E | GitHub Actions muestra un workflow de revisión de Copilot. En el PR #21 el único check visible fue “Vercel Preview Comments”, exitoso, que no acredita pruebas de software. |
| Hito de calidad | 94 pruebas unitarias y 5 E2E declaradas en documentación | Se conserva como resultado documentado; no se encontró un log de ejecución de CI que permita revalidarlo independientemente. |

El PR #21 se integró a `main` el 13 de septiembre de 2026. La rama `correciones-HU-Y-Pruebas-generales` figura como su rama fuente. El check de [Vercel Preview Comments del PR #21](https://github.com/benjita-unab/Proyecto-de-titulo/runs/103791142063) terminó correctamente, pero no es un resultado de Jest ni de E2E.

## 3. Matriz de hitos y control de avance

| Hito y fecha | Módulo / trabajo observado | Impedimento o afirmación original | Mitigación y resultado verificable | Estado de evidencia |
|---|---|---|---|---|
| **Hito 1 — 25–26 ago.** | Detección y filtrado de destinos, [PR #3](https://github.com/benjita-unab/Proyecto-de-titulo/pull/3), SHA [`7106027`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/71060274ebb501d344971bb2972e57a3687c85ac). | Se indicó que expresiones rígidas fallaban con saludos largos y modismos. | El PR implementa detección y filtrado de destino. El historial consultado no demuestra por sí solo el detalle de una lista blanca ni el límite de ocho palabras; no se presentan esos mecanismos como hechos comprobados. | Implementación respaldada por PR; causa específica y umbral no corroborados. |
| **Hito 2 — 26–28 ago.** | Base de datos y extracción/población de transporte, [PR #4](https://github.com/benjita-unab/Proyecto-de-titulo/pull/4) y [PR #5](https://github.com/benjita-unab/Proyecto-de-titulo/pull/5), SHA [`2eedab1`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/2eedab1def83172260d8317fcf7654271d06cfd7). | Se atribuyeron bloqueos de anti-scraping/captcha y uso de Puppeteer. | El PR #5 agrega Axios y Cheerio como dependencias; el script de población usa Axios. No se halló evidencia en ese PR de captcha ni de Puppeteer. El extractor de tarifas [`extraer-tarifas-puppeteer.ts`](./backend/src/scripts/extraer-tarifas-puppeteer.ts) aparece en el historial recién en octubre, fuera de este período. | Extracción respaldada; bloqueo y uso de Puppeteer en agosto no corroborados. |
| **Hito 3 — 28 ago.–1 sep.** | Formato de respuestas y sugerencias ante destinos no reconocidos, [PR #6](https://github.com/benjita-unab/Proyecto-de-titulo/pull/6) y [PR #7](https://github.com/benjita-unab/Proyecto-de-titulo/pull/7). | Se atribuyó un conflicto de merge y un rebase sobre `main` al commit `a869e75c`. | El commit [`a869e75c`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/a869e75ccec780c0dd2a8bcdf5fed16701e86ad3) modifica expectativas de una prueba de `chat.controller`; su mensaje dice “arreglo choque de versiones”. No prueba que haya ocurrido un conflicto de merge ni un rebase. | Cambios funcionales respaldados; explicación del conflicto/rebase no comprobada. |
| **Hito 4 — 2 sep.** | Configuración CORS y ajustes de NLP/extractor, [PR #8](https://github.com/benjita-unab/Proyecto-de-titulo/pull/8), SHA [`ea670dc`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/ea670dcb81ce24db7585c6cdbb3a0a1fd3b21f21). | Se describió un preflight `OPTIONS` que dejaba el chat cargando. | [`main.ts`](./backend/src/main.ts) configura CORS global para permitir solicitudes entre la aplicación cliente y el backend. La configuración registrada usa `origin: '*'` junto con `credentials: true`; es amplia y debe revisarse/restringirse para producción. No se encontró un log que demuestre el incidente de carga infinita ni una prueba de navegador que lo cierre. | Cambio CORS respaldado; síntoma original y validación funcional no comprobados. |
| **Hito 5 — 9–11 sep.** | Respuestas de horarios, comparación con itinerario, tabla y población de horarios, [PR #9](https://github.com/benjita-unab/Proyecto-de-titulo/pull/9)–[PR #12](https://github.com/benjita-unab/Proyecto-de-titulo/pull/12). | Se atribuyó la causa a una desincronización UTC/hora local de Chile y se dijo que `clientTime` la resolvió. | El PR #10 envía `clientTime` desde la interfaz como fecha ISO UTC. El backend la convierte a `Date` y consulta `getHours()` según la zona local del proceso; no se observó una conversión explícita a la zona de Chile. Por ello, el parámetro existe, pero no basta para afirmar que el desfase quedó resuelto en todos los entornos. | Flujo y pruebas E2E actualizados en código; solución de zona horaria requiere validación con zona horaria del despliegue. |
| **Hito 6 — 11 sep.** | Dashboard, tabla y extractor de radiotaxis, [PR #13](https://github.com/benjita-unab/Proyecto-de-titulo/pull/13)–[PR #15](https://github.com/benjita-unab/Proyecto-de-titulo/pull/15). | Se indicó que teléfonos inconsistentes motivaron la corrección. | El extractor del PR #15 limpia los dígitos y genera un número de discado `+56…` (formato E.164), además de conservar un formato visual. El historial respalda la normalización; no documenta por sí solo el incidente concreto que la motivó. | Normalización respaldada por código; causa reportada no registrada como incidente. |
| **Hito 7 — 11–12 sep.** | Bot, eventos/webhook, sincronización con backend y transcripción de notas OGG, [PR #17](https://github.com/benjita-unab/Proyecto-de-titulo/pull/17)–[PR #20](https://github.com/benjita-unab/Proyecto-de-titulo/pull/20). | Se atribuyeron reintentos de Telegram a una respuesta de voz que demoraba más de cinco segundos. | Los PR documentan formato del bot, conexión de eventos y un servicio de transcripción de audio OGG mediante API compatible con Whisper. No se encontró evidencia de que los reintentos mayores a cinco segundos fueran el impedimento real ni de una solución mediante ACK asíncrono. | Integración y transcripción respaldadas; explicación del retry no corroborada. |
| **Hito 8 — 12–13 sep.** | Alcance multicomunal y pruebas formales, [PR #20](https://github.com/benjita-unab/Proyecto-de-titulo/pull/20) y [PR #21](https://github.com/benjita-unab/Proyecto-de-titulo/pull/21). | Se afirmó que una migración a Quilpué/Villa Alemana hizo fallar E2E y que la actualización produjo un 100% de éxito. | El PR #21 sí actualiza el escenario E2E de Hospital Santo Tomás a Hospital de Quilpué y cambia la expectativa a Línea 111. La documentación de pruebas declara 94/94 unitarias y 5/5 E2E; no se encontró un log de ejecución de CI que confirme el 100% ni evidencia suficiente para afirmar la causa exacta de un fallo anterior. | Cambio del caso de prueba respaldado; resultado 100% declarado, no revalidado por CI. |

### Aclaración sobre el conteo de PRs

Entre los PR #3 y #20:

- Se integraron #3–#15 y #17–#20: **17 PRs**.
- El PR #16 se cerró sin integración.
- Los PR #16 y #17 apuntaban al mismo SHA `f2abc359`; el cambio se contabiliza por el PR #17, que sí fue integrado.
- El PR #21 también se integró, por lo que el total del período es **18 PRs integrados**, no 14.

## 4. Registro de commits y fechas

Las fechas de commit son las fechas locales informadas por Git; las fechas de merge son las registradas por GitHub en UTC. Se muestran ambas para no confundir autoría del commit con integración a `main`.

| PR | Commit | Fecha del commit | Fecha de merge (UTC) | Cambio registrado |
|---|---|---:|---:|---|
| [#3](https://github.com/benjita-unab/Proyecto-de-titulo/pull/3) | [`7106027`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/71060274ebb501d344971bb2972e57a3687c85ac) | 25 ago. | 26 ago. | Detección y filtrado de destino. |
| [#4](https://github.com/benjita-unab/Proyecto-de-titulo/pull/4) | [`a7e24b1`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/a7e24b109e6d5a8312bab5ff71ed1e25b065f678) | 26 ago. | 27 ago. | Base de datos y consulta de rutas por destino. |
| [#5](https://github.com/benjita-unab/Proyecto-de-titulo/pull/5) | [`2eedab1`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/2eedab1def83172260d8317fcf7654271d06cfd7) | 27 ago. | 28 ago. | Extracción y guardado de datos de transporte. |
| [#6](https://github.com/benjita-unab/Proyecto-de-titulo/pull/6) | [`91fe408`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/91fe408e69c400a639995b7a947a4a2620babf46) | 28 ago. | 29 ago. | Formato de respuestas de transporte. |
| [#7](https://github.com/benjita-unab/Proyecto-de-titulo/pull/7) | [`7b6c6e5`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/7b6c6e5faa4b6ce586337b82823145536a9d6140) | 31 ago. | 1 sep. | Sugerencias para destinos no reconocidos. |
| [#8](https://github.com/benjita-unab/Proyecto-de-titulo/pull/8) | [`ea670dc`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/ea670dcb81ce24db7585c6cdbb3a0a1fd3b21f21) | 2 sep. | 2 sep. | CORS, NLP y extractor. |
| [#9](https://github.com/benjita-unab/Proyecto-de-titulo/pull/9) | [`fbbf3d2`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/fbbf3d2a1c0a106b90f8f98f315702ad8ba29dee) | 9 sep. | 9 sep. | Respuestas para horarios. |
| [#10](https://github.com/benjita-unab/Proyecto-de-titulo/pull/10) | [`24c8cf4`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/24c8cf4bc355f882c726848683e821f4ddd73dd1) | 9 sep. | 9 sep. | Comparación de horario del dispositivo e itinerario. |
| [#11](https://github.com/benjita-unab/Proyecto-de-titulo/pull/11) | [`032b01e`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/032b01e7a6208bd29533ae845886056873006afa) | 10 sep. | 10 sep. | Tabla de horarios de servicio. |
| [#12](https://github.com/benjita-unab/Proyecto-de-titulo/pull/12) | [`2dac6fc`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/2dac6fc4acde872f63b72c3eaf0275b895be9903) | 10 sep. | 11 sep. | Extractor/población de horarios y E2E. |
| [#13](https://github.com/benjita-unab/Proyecto-de-titulo/pull/13) | [`06a24a2`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/06a24a225b076ef426070b4eda87c59d7d5dd6eb) | 11 sep. | 11 sep. | Vista de servicios de radiotaxi. |
| [#14](https://github.com/benjita-unab/Proyecto-de-titulo/pull/14) | [`ae9b950`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/ae9b950b675e13ccd0e1a7a26c55e69745aee217) | 11 sep. | 11 sep. | Tabla y población de radiotaxis. |
| [#15](https://github.com/benjita-unab/Proyecto-de-titulo/pull/15) | [`b100764`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/b1007646db5075985db53a551b148ed2b03605cb) | 11 sep. | 11 sep. | Extractor de datos de radiotaxis y normalización telefónica. |
| [#17](https://github.com/benjita-unab/Proyecto-de-titulo/pull/17) | [`f2abc35`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/f2abc3594ae0bd58a473c6ed384cde52c947afd8) | 11 sep. | 11 sep. | Bot y conexión inicial con Telegram. |
| [#18](https://github.com/benjita-unab/Proyecto-de-titulo/pull/18) | [`f14f914`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/f14f91430e6dd8cd9fd14914cceaa5eb1f725147) | 11 sep. | 11 sep. | Eventos y webhook Telegram-backend. |
| [#19](https://github.com/benjita-unab/Proyecto-de-titulo/pull/19) | [`b4b6130`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/b4b6130862f3bacbdc10862566712f68a3930f0f) | 11 sep. | 11 sep. | Sincronización del bot con servicios backend. |
| [#20](https://github.com/benjita-unab/Proyecto-de-titulo/pull/20) | [`130d8da`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/130d8da7b6ee5d59a5471806e88aed69ceaffb88) | 12 sep. | 12 sep. | Transcripción de audio OGG mediante API. |
| [#21](https://github.com/benjita-unab/Proyecto-de-titulo/pull/21) | [`a328e6c`](https://github.com/benjita-unab/Proyecto-de-titulo/commit/a328e6c37e53d8de07bcb8f32910ffd43b99d8f3) | 13 sep. | 13 sep. | Ajuste de alcance y actualización de pruebas formales. |

## 5. Control de calidad y métricas

| Métrica / objetivo | Meta indicada | Resultado disponible | Estado de control |
|---|---:|---|---|
| Pruebas unitarias | 94 pruebas, 11 suites | `DOCUMENTACION_PRUEBAS_UNITARIAS.md` declara 94/94 y 100%. | **Documentado; no hay log de CI asociado** que confirme la ejecución de ese corte. |
| Pruebas E2E | 5 pruebas, 2 suites | La documentación declara 5/5 y 100%; el E2E de horarios contiene cuatro escenarios funcionales. | **Documentado; no verificado por un workflow de pruebas.** |
| Reconocimiento de destinos | ≥90% | El borrador informa 20/20. | **Reportado, no revalidado:** no se adjuntó matriz de consultas y resultados ni registro crudo. |
| Latencia de respuesta | <1,5 s en ≥95% de las pruebas | El borrador informa 240–410 ms. | **Reportado, no revalidado:** no se encontró conjunto de mediciones ni cálculo de percentil 95. |
| Éxito de eventos/webhooks | ≥90% | El borrador informa 20/20 comandos. | **Reportado, no revalidado:** faltan logs fechados de Telegram/webhook. |
| Disponibilidad offline | 100% | El borrador declara operación en modo avión. | **Pendiente de evidencia:** no se encontró protocolo, registro de dispositivo ni captura de la ejecución. |
| Modalidades de transporte | 3 operativas | El documento de referencia declara 2 de 3 para el cierre inicial. | **Parcial según el informe.** La incorporación de colectivos aparece después, en [PR #22](https://github.com/benjita-unab/Proyecto-de-titulo/pull/22), integrado el 18 de octubre, fuera de este sprint. |
| Cobertura de rutas | ≥70% de las rutas de Quilpué | Se declaran 6 líneas, pero no se indica el total oficial usado como denominador. | **No calculable:** falta catálogo oficial completo y fecha de corte. |
| OE2/OE3 | Métricas de geolocalización y comparativa | El borrador las sitúa en la iteración siguiente. | **No evaluadas en este período.** |

La [documentación de pruebas del repositorio](./DOCUMENTACION_PRUEBAS_UNITARIAS.md) conserva resultados declarados y, en una actualización posterior, cifras distintas (128 pruebas unitarias y 5 E2E). Esa actualización posterior no debe trasladarse al corte del 13 de septiembre. Para la línea base histórica, se toma la versión del documento incluida en el PR #21, que declara 94 unitarias y 5 E2E; se deja explícito que son cifras documentadas y no revalidadas mediante CI.

## 6. Plan de monitoreo y control para mantener trazabilidad

La siguiente matriz define los controles que deben conservarse en cada iteración. Es un procedimiento de seguimiento; no se afirma que todas sus evidencias se hayan generado durante el sprint revisado.

| Control | Frecuencia | Evidencia mínima a guardar | Criterio de aceptación |
|---|---|---|---|
| Seguimiento de alcance y cambios | En cada PR | HU vinculada, rama origen/destino, SHA, fecha, revisión y estado de merge. | Cada cambio integrado a `main` debe asociarse a una HU y a un criterio de aceptación. |
| Pruebas unitarias e integración | En cada PR y antes del cierre | Comando, versión/entorno, salida completa, conteo aprobado/fallido y artefacto de CI. | No declarar “100%” sin log fechado que identifique el commit probado. |
| Pruebas E2E/UAT | En cada escenario de aceptación | Consulta, pasos, respuesta, captura, fuente de verificación, resultado y responsable ejecutor. | Cada escenario debe enlazarse a un criterio de aceptación; registrar explícitamente fallos y reintentos. |
| Rendimiento | Por flujo completo y por versión candidata | Tres corridas como mínimo cuando así lo exige la HU, tiempos individuales, promedio y comparación con línea base. | Conservar el cálculo de reducción y comprobar el umbral sobre el dato medido, no sobre una estimación. |
| Cobertura de datos | Por actualización de catálogo | Fuente oficial, fecha de consulta, total de rutas/servicios y elementos cargados. | El porcentaje requiere numerador y denominador verificables. |
| Gestión de impedimentos | Al detectar y al cerrar cada impedimento | Descripción reproducible, impacto, mitigación, resultado y evidencia posterior. | Separar causas observadas de hipótesis; no declarar resuelto sin volver a ejecutar el caso. |
| Cierre del sprint | Al finalizar la iteración | Resumen de PR integrados, métricas con fuente, riesgos abiertos y pendientes. | Diferenciar “cumple”, “parcial”, “no cumple” y “no verificable”. |

## 7. Pendientes y justificaciones

1. **Ejecuciones automatizadas:** no se encontró una acción de GitHub que ejecute Jest o E2E para este período. Por ello, las cifras 94/94 y 5/5 quedan como resultados escritos en la documentación, no como resultados de CI revalidados.
2. **Evidencia UAT y rendimiento:** no se localizaron las 20 consultas, capturas, marcas de tiempo ni cálculos que respalden 20/20 o 240–410 ms. No se inventan los datos faltantes.
3. **Cobertura de rutas:** seis líneas no permiten calcular 70% sin el total oficial de líneas dentro del alcance y una fecha de referencia.
4. **Incidentes técnicos:** los PR demuestran cambios, pero no siempre registran la causa original. Por ello, captcha/anti-scraping, bloqueo de preflight, conflicto/rebase, desincronización de zona horaria y reintentos de más de cinco segundos se marcan como no corroborados cuando falta un registro reproducible.
5. **Hitos de Taiga:** el enlace de timeline proporcionado devolvió únicamente la pantalla de carga al consultarlo; no fue posible contrastar sus eventos con GitHub.
6. **Próximo control recomendado:** vincular cada futura ejecución con el SHA exacto, guardar logs y capturas junto con el protocolo de consulta y cerrar los indicadores pendientes antes de afirmar cumplimiento global.

## 8. Fuentes consultadas

- Historial de PR [#3–#21](https://github.com/benjita-unab/Proyecto-de-titulo/pulls?q=is%3Apr+is%3Aclosed) y SHA de cada cambio enlazado en las tablas.
- Rama de integración [`main`](https://github.com/benjita-unab/Proyecto-de-titulo/tree/main) y rama fuente [`correciones-HU-Y-Pruebas-generales`](https://github.com/benjita-unab/Proyecto-de-titulo/tree/correciones-HU-Y-Pruebas-generales).
- [Documentación de pruebas del repositorio](./DOCUMENTACION_PRUEBAS_UNITARIAS.md) y versión incorporada en el PR #21.
- [Caso E2E de horarios](./backend/test/chat-horarios.e2e-spec.ts).
- [Workflow y ejecuciones de GitHub Actions](https://github.com/benjita-unab/Proyecto-de-titulo/actions).
- Timeline de Taiga proporcionado por el equipo: <https://tree.taiga.io/project/benjita-unab-movilidad-adultos-mayores/timeline> (contenido no disponible durante la consulta).
