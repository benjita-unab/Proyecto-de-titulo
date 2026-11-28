# HU 1 y HU 2 - Auditoría de datos, fuentes y geolocalización

## Conclusión

La fórmula de Haversine implementada es adecuada para calcular **distancia geodésica en línea recta** entre dos coordenadas. Eso no confirma que la coordenada represente el paradero real ni calcula la distancia caminable. La información de colectivos que estaba en el repositorio no tiene evidencia de procedencia suficiente para presentarla como oficial.

Por lo anterior, los datos locales de colectivos y paraderos sin verificación se conservan como material pendiente, pero ya no se presentan al usuario ni se usan para recomendar un paradero. La respuesta debe ser “sin información verificada” hasta que una persona registre una fuente y evidencia verificables.

## Revisión de fuentes para colectivos de Quilpué

| Fuente revisada | Qué permite afirmar | Qué no permite afirmar |
|---|---|---|
| [DTPR - Gran Valparaíso](https://dtpr.gob.cl/pe/gran-valparaiso/) | La página oficial describe el sistema **regulado de buses** de Gran Valparaíso; publica GTFS y programas operacionales para ese sistema. También señala que la tarifa adulto mayor se mantiene al 50% del valor adulto dentro de los servicios regulados. | No acredita las líneas, recorridos, tarifas, frecuencias ni paraderos de taxis colectivos de Quilpué. El porcentaje tampoco debe aplicarse automáticamente a colectivos. |
| [DTPR - recorridos de servicios subsidiados](https://dtpr.gob.cl/recorridos-servicios-subsidiados/) | Publica información de servicios subsidiados en formatos descargables. | No es un registro de recorridos de colectivos urbanos de Quilpué. |
| [Estudio de capacidad vial de Quilpué (documento municipal, 2019)](https://www.quilpue.cl/uploads/2019/10/20191008120247-11estudiocapacidadvial.pdf) | Reconoce buses y taxis colectivos como componentes del transporte local y describe necesidades de infraestructura. | Es un documento antiguo de planificación; no sirve para certificar líneas, horarios o tarifas vigentes. |
| [SEREMI de Transportes y Telecomunicaciones](https://mtt.gob.cl/organismos/secretarias-regionales/) | Es el canal institucional regional para consultas de transporte y registro. | La búsqueda no encontró una tabla pública actual que permita cotejar las líneas de colectivos de Quilpué una por una. Se debe solicitar el registro o antecedente vigente a la autoridad/operador antes de marcarlas verificadas. |

### Hallazgos sobre líneas de taxi colectivo de Quilpué

La búsqueda sí encontró antecedentes oficiales históricos en Ley Chile, pero no permiten afirmar que esos servicios sigan vigentes:

| Antecedente | Qué contiene | Estado para el proyecto |
|---|---|---|
| [Resolución Exenta 203 (1985), Ley Chile](https://www.bcn.cl/leychile/navegar?i=157952) | Autoriza un servicio identificado como **Línea 10, Centro Quilpué–Las Rosas–Población Sol del Pacífico**, con trazado por sectores/calles de Quilpué. | Referencia histórica; no cargar como servicio activo sin resolución/inscripción vigente. |
| [Resolución 662 (1987), Ley Chile](https://www.bcn.cl/leychile/navegar?i=147649) | Autoriza a un operador individual un servicio urbano de taxi colectivo en Quilpué y describe un trazado por el sector Sol del Pacífico/Nereidas y vías del centro. | Referencia histórica; el extracto consultado no prueba vigencia actual ni entrega un catálogo completo de líneas. |
| [Ordenanza municipal 3 (1995), Ley Chile](https://www.bcn.cl/leychile/navegar?i=30968) | Trata la racionalización de paradas de taxi colectivo y elimina autorizaciones antiguas de estacionamiento en varios puntos del centro. | No usar para determinar paraderos actuales. |
| [ChileAtiende: inscripción de taxis colectivos en el RNSTP](https://www.chileatiende.gob.cl/fichas/25851) | Explica que el servicio debe inscribirse en el Registro Nacional de Servicios de Transporte de Pasajeros y que la autorización produce una resolución/certificados. | Es el camino para solicitar a SEREMI/operadores la resolución o certificado vigente; la ficha no publica el listado actual de servicios de Quilpué. |

No apareció una nómina pública vigente con número de línea, operador, trazado, paraderos, horarios y tarifas. Por tanto, las líneas 1–8 que aparecen en los scripts del proyecto no quedan confirmadas por estas resoluciones: deben seguir inactivas/no verificadas hasta contrastarlas con el registro actual o con el operador.

## Referencias operativas encontradas en Moovit y Red Regional

Consulta documental realizada el 27-11-2026. Estos datos ayudan a orientar pruebas y a cotejar nombres, pero **no se incorporan como recorridos verificados**: Moovit es una referencia de terceros y los resultados de su buscador pueden variar entre fichas; la ficha de Google Play de Red Regional describe la aplicación, pero no expone en web los datos de una consulta concreta al Hospital.

| Elemento de referencia | Dato mostrado | Uso y límite |
|---|---|---|
| [Hospital de Quilpué - Moovit](https://moovitapp.com/index/es-419/transporte_p%C3%BAblico-Hospital_De_Quilpu%C3%A9-Valparaiso_y_Vina_del_Mar-site_8957128-3121) | Indica como paradero cercano “San Martin - Samuel Valencia / Sur”, a 142 m/3 min a pie; también lista 107, 111 y 119 como líneas cercanas. | Candidato para cotejar el nombre del paradero y las líneas. Los 142 m son distancia peatonal estimada por Moovit, no coordenadas ni distancia Haversine. |
| [Hospital Quilpué / Norte - Moovit](https://moovitapp.com/index/es-419/transporte_p%C3%BAblico-Hospital_Quilpue_Norte-Valparaiso_y_Vina_del_Mar-stop_9005354-3121) | Lista líneas cercanas 107, 111 y 119; muestra además otros servicios en su listado amplio. La ficha indexada muestra salidas desde las 6:18 y hasta las 21:25. | La hora depende del servicio, dirección y fecha; debe comprobarse en una consulta vigente antes de informar frecuencia u horario. |
| [Hospital Quilpué / Sur - Moovit](https://moovitapp.com/index/es-419/transporte_p%C3%BAblico-Hospital_Quilpue_Sur-Valparaiso_y_Vina_del_Mar-stop_9005170-3121) | Sitúa Hospital Quilpué / Norte a 1 min a pie y muestra líneas 107, 111 y 119 cerca; también aparecen otros servicios en el listado ampliado. | Corrobora que Norte/Sur son referencias diferenciadas; no confirma por sí sola el lado de calle apropiado para cada sentido. |
| [San Martín, 1484 - Moovit](https://moovitapp.com/index/es-419/transporte_p%C3%BAblico-San_Mart%C3%ADn_1484-Valparaiso_y_Vina_del_Mar-stop_197632887-3121) | Lista 107, 111, 119 y servicios adicionales; indica Metro L1 cercano. | Referencia secundaria; no se debe inferir que todos los servicios publicados en una ficha pasen por la entrada del hospital o en ambos sentidos. |
| [Ruta 111 - Moovit](https://moovitapp.com/index/es-419/transporte_p%C3%BAblico-line-111-Valparaiso_y_Vina_del_Mar-3121-854107-351899-1) | La ficha indexada presenta el servicio “Belloto Sur - Los Pinos - Hospital” y también publica un itinerario con extremos Galvarino - Playa Ancha. | Candidata para probar el recorrido 111; las variantes/direcciones deben compararse dentro de Moovit y Red Regional para evitar mezclar sentido, trazado o horario. |
| [Red Regional - ficha oficial de la app DTPR](https://play.google.com/store/apps/details?id=cl.gob.mtt.dtpr.redregional&hl=es-CL) | La descripción declara planificación de viajes, ubicación de vehículos, horarios estimados, frecuencias, alertas y búsqueda de paradas. | Es una buena fuente para validar servicios de transporte público cubiertos por DTPR en tiempo real. La ficha web no devuelve el resultado del viaje Quilpué–Hospital; hay que comprobar cobertura y servicio dentro de la app. |

**Conclusión de cobertura:** las fichas recuperadas de Moovit hablan de autobuses/micros y Metro L1, no aportan una lista verificable de taxis colectivos, sus tarifas ni sus paraderos. Por tanto, sirven como referencia inicial para los **buses** y para preparar consultas, pero no resuelven la falta de una fuente de colectivos de Quilpué. No se cargan coordenadas estimadas a partir de distancias caminables ni se marca ninguna fila como verificada solo por aparecer en Moovit.

**Siguiente verificación recomendada:** consultar en Red Regional el mismo origen, destino y hora de las pruebas, guardar la pantalla de resultado/fecha y cotejar servicio y parada con las fichas de Moovit. Si difieren, conservar ambos registros y no escoger uno sin una verificación independiente. Para Haversine todavía se necesita obtener coordenadas explícitas de cada parada y validar el lado/sentido; las distancias peatonales en Moovit no se convierten en coordenadas.

## Referencias de radiotaxis de Quilpué

Se recopilaron cinco **candidatos** a partir de sitios de operadores y directorios: [Radio Taxi Mercurio](https://radiotaximercurio.cl/contacto-y-reservas/), [Radio Taxi Vicenexpress](https://www.amarillas.cl/fichas/radio-taxi-vicenexpress_15457643/), [Radio Taxi Transporte Privado 24 Horas](https://www.amarillas.cl/fichas/radio-taxi-transporte-privado-24-horas_15670403), [Radio Taxis Raul Estay](https://www.amarillas.cl/b/taxis/quilpue) y [Call Taxi Express Ejecutivo](https://chiletaxis.cl/transporte/call-taxi-express-ejecutivo-vina-del-mar-4486). La evidencia recopilada no confirma autorización vigente en el RNSTP ni tarifas. En particular, el directorio de Transporte Privado 24 Horas muestra un horario de lunes a viernes que contradice su nombre; la ficha de Call Taxi Express también requiere confirmar que el operador y la comuna correspondan.

Los cinco se prepararon en [poblar-radiotaxis.ts](../../src/scripts/poblar-radiotaxis.ts) únicamente como candidatos, con `activo = false`, `autorizada = false` y `verificado = false`; las tarifas quedan sin publicar. **No se presentan como centrales autorizadas ni se habilita el discado**. El servicio solo muestra filas activas, autorizadas y verificadas que además incluyan URL HTTPS, evidencia y fecha de verificación.

La base Supabase existente debe recibir primero la migración aditiva [migrar-verificacion-fuentes.sql](../../src/scripts/migrar-verificacion-fuentes.sql); no crea ni reemplaza la base. La consulta previa confirmó que a `servicio_radiotaxi` le faltan columnas de procedencia (`42703`), así que el seed no se ha ejecutado y no se ha modificado la base remota. Después de aplicar la migración se podrá ejecutar `npm run db:populate-radiotaxis` desde `backend`; la carga usa upsert por identificador y conserva los candidatos desactivados. Ningún candidato debe activarse hasta confirmar directamente los datos y obtener evidencia vigente de autorización.

### Hallazgos sobre los datos existentes

- [poblar-colectivos.ts](../../src/scripts/poblar-colectivos.ts) contenía líneas 1-6 y 8, recorridos, frecuencias y tarifas con nombres y valores muy específicos, pero sin fuente por fila. Esos datos no quedan acreditados por haber sido cargados en Supabase ni por haber sido producidos con IA.
- [extraer-tarifas-puppeteer.ts](../../src/scripts/extraer-tarifas-puppeteer.ts) consultaba una página del MTT, pero después insertaba valores escritos en el código para colectivos y radiotaxis; la página visitada no era evidencia de esos importes. La extracción ahora no sincroniza valores cuando no obtiene un tarifario oficial verificable.
- [paradas-catalogo.ts](../../src/transport/geo/paradas-catalogo.ts) incluye puntos y asociaciones de líneas que tampoco tienen fuente/fecha de validación. Por eso están marcados como no verificados.
- Los importes de colectivo encontrados en el código no son consistentes entre archivos (por ejemplo, se usaban tanto $800/$550 como $900/$650 según la línea). No deben usarse como tarifas reales.

## Revisión de Haversine

- `calculateDistance` usa radio terrestre medio de 6.371.000 m, fórmula Haversine y redondeo a décimas. El cálculo es válido para estimar la distancia geodésica sobre la superficie.
- Se limita el argumento intermedio de la fórmula a `[0, 1]` para evitar errores de redondeo en casos extremos.
- Las pruebas anteriores comparaban puntos distintos a los que describían como Estación y Hospital; se corrigieron las coordenadas de las referencias. Una prueba unitaria de Haversine comprueba la matemática, no la exactitud física del paradero.
- El valor no es una ruta peatonal. Para distancia real caminando se debe validar con un recorrido de mapas o terreno; no se debe rotular la distancia Haversine como distancia a pie.
- Para recomendaciones al Hospital se buscan únicamente paraderos verificados que estén asociados a una línea marcada y verificada para ese destino; los resultados se ordenan por distancia y se limitan a tres.

## Cambios de confianza aplicados

1. Los registros de recorrido, colectivo y paradero tienen campos de estado, URL, evidencia textual y fecha de verificación.
2. La extracción con IA acepta sólo dominios institucionales incluidos en una lista permitida y descarta cada campo que no esté respaldado por un fragmento literal de la página fuente. La IA estructura la evidencia; no se considera por sí sola una fuente.
3. Las consultas de usuario excluyen filas sin `verificado = true`, URL HTTPS y evidencia asociada. No hay tarifas, recorridos, paraderos o líneas de respaldo inventados.
4. Los botones de simulación quedan ocultos y deshabilitados en `NODE_ENV=production`. Una ubicación lejana ya no se reemplaza silenciosamente por Plaza de Quilpué.
5. Se agregó la migración [migrar-verificacion-fuentes.sql](../../src/scripts/migrar-verificacion-fuentes.sql). Debe aplicarse en Supabase antes de desplegar esta versión. Los registros existentes quedarán no verificados por defecto.

## Pendiente antes de considerar HU 1 y HU 2 aprobadas

- Aplicar la migración de procedencia en Supabase.
- Solicitar/publicar un documento oficial vigente de líneas de colectivos de Quilpué y cargar, por cada dato, URL, fragmento probatorio y fecha de revisión.
- Verificar en terreno o contra un mapa oficial las coordenadas, lados de calle y líneas que efectivamente atiende cada paradero.
- Incorporar los paraderos oficiales de Limache si se espera recomendar el punto de partida de una usuaria que vive allí; no sustituir su ubicación por una de Quilpué.
- Ejecutar pruebas de extremo a extremo con Telegram/Supabase y aceptación con personas mayores. Las pruebas unitarias no demuestran el umbral real de 1,5 segundos ni la usabilidad de 4 toques.

### Advertencia sobre el informe de sistema HU3 existente

El archivo histórico `backend/test/system/hu3-resultados-sistema.csv` no es evidencia válida de exactitud: calculaba la “distancia de referencia” llamando al mismo método Haversine usado para obtener la distancia, por lo que el error reportado era cero por construcción. Además, sus paraderos y asociaciones no tenían procedencia verificada. El script se corrigió para comparar Haversine con una implementación independiente de Vincenty y marcar como no evaluables los casos sin paradero verificado; el informe anterior no debe citarse como resultado aprobado.
