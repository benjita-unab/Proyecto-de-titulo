# HU #6 – Nivel 4: Protocolo de Aceptación y Rúbrica de Calidad de la IA

**Historia de Usuario:** HU #6 – IA Gemini, extracción de datos y respaldos  
**Entorno:** Motor de IA Conversacional MoviTech (Gemini HTTPS + Fallbacks de Contingencia)  
**Fecha:** Octubre 2026  
**Responsable:** Desarrollador Senior de Testing / Lingüista Computacional / Equipo QA  

---

## 1. Criterios de Aceptación y Aprobación (T23)

1. **Promedio General Ponderado:** Debe ser $\ge 4.0 / 5.0$ en la evaluación de calidad humana sobre los 30 casos representativos.
2. **Cero Errores Técnicos:** $0\%$ de respuestas al usuario final deben contener trazas de stack, códigos HTTP (ej. 503, 500, 404), referencias a JSON crudo o palabras técnicas ("null", "undefined", "timeout").
3. **Respaldo Automático Transparente:** Si la API externa de Gemini falla o demora más de su tiempo límite, la conmutación a Respaldo Nivel 1 (NLP local) o Nivel 2 (aclaración cordial) debe ser imperceptible para el usuario.
4. **Respeto a la Identidad Regional:** Reconocimiento de modismos de la zona de Marga Marga ("la micro", "la liebre", "el paradero", "la feria", "ir pa", etc.).

---

## 2. Rúbrica de Calidad para Evaluadores Humanos (Escala 1 a 5)

| Dimensión | Ponderación | 1 (Deficiente) | 3 (Aceptable) | 5 (Excelente) |
|:---|:---:|:---|:---|:---|
| **Tono y Amabilidad** | $25\%$ | Frío, robótico, regañón o incomprensible. | Formal, neutro, poco adaptado a personas mayores. | Cálido, paciente, empático, uso filial y respetuoso. |
| **Precisión de la Información** | $30\%$ | Rutas o líneas inventadas/inexistentes en Quilpué. | Línea correcta pero datos de parada vagos. | Líneas exactas, paraderos reales y trazados oficiales coincidentes. |
| **Claridad y Formato** | $25\%$ | Bloques densos de texto o términos técnicos ("backend", "API"). | Texto legible pero sin formato visual estructurado. | Párrafos breves, emojis orientadores, negritas en datos clave y enlaces directos. |
| **Utilidad Práctica** | $20\%$ | No resuelve la duda; el usuario no sabe cómo viajar. | Resuelve parcialmente; requiere repreguntar. | Resuelve de inmediato la necesidad de viaje con datos de paraderos, tarifas y mapas. |

---

## 3. Matriz de Resultados de los 30 Casos de Prueba

| ID | Consulta de Usuario | Intención Detectada | Tono (1-5) | Precisión (1-5) | Claridad (1-5) | Utilidad (1-5) | Ponderado | Dictamen |
|:--:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 01 | mijito, qué micro me sirve para ir al hospital de Quilpué | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 02 | a qué hora pasa la última micro a Quilpué de la línea C02 | Consultar Horario | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 03 | necesito ir a la Estación Metro Quilpué para hacer un trámite | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 04 | cómo llego a la Plaza de Quilpué a cobrar la pensión | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 05 | quiero saber el horario de la micro 111 | Consultar Horario | 4.8 | 5.0 | 5.0 | 4.8 | **4.90** | Aprobado |
| 06 | dónde puedo tomar colectivo a Los Pinos | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 07 | me puedes dar el número de un radiotaxi en Quilpué por favor | Consultar RadioTaxi | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 08 | cómo ir al Cesfam de Pompeya en micro | Buscar Ruta | 4.8 | 5.0 | 4.8 | 5.0 | **4.90** | Aprobado |
| 09 | hola buenas tardes, quiero ir a Belloto Sur | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 10 | a qué hora empieza a pasar la micro Q02 en la mañana | Consultar Horario | 4.8 | 5.0 | 5.0 | 5.0 | **4.95** | Aprobado |
| 11 | necesito un taxi en Villa Alemana para una emergencia | Consultar RadioTaxi | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 12 | cómo llegar a Valencia desde el centro | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 13 | qué micro me deja en Peñablanca | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 14 | hola mijita, necesito ir a Belloto Norte | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 15 | quiero ir a la Plaza 40 Horas de Limache | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 16 | vamos pa la feria el belloto a comprar verduritas | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 17 | dónde está la garita de los colectivos en el centro | Buscar Ruta | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 18 | a qué hora pasa la última liebre para el cerro | Consultar Horario | 4.8 | 4.8 | 5.0 | 4.8 | **4.85** | Aprobado |
| 19 | un radiotaxi de confianza que no me deje botado en la noche | Consultar RadioTaxi | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** | Aprobado |
| 20 | mijito me deja en el paradero del consultorio de Quilpué | Buscar Ruta | 4.8 | 5.0 | 4.8 | 5.0 | **4.90** | Aprobado |
| 21 | quiero ir a dar una vuelta por ahí | AclaracionDestino | 4.8 | 4.5 | 4.8 | 4.5 | **4.65** | Aprobado |
| 22 | dónde me deja la micro si me subo ahora | AclaracionDestino | 4.8 | 4.5 | 4.8 | 4.5 | **4.65** | Aprobado |
| 23 | necesito viajar pero no sé qué micro pasa | AclaracionDestino | 5.0 | 4.8 | 5.0 | 4.8 | **4.90** | Aprobado |
| 24 | a qué hora pasa | Consultar Horario | 4.8 | 4.8 | 4.8 | 4.8 | **4.80** | Aprobado |
| 25 | cómo me voy | AclaracionDestino | 5.0 | 4.8 | 5.0 | 4.8 | **4.90** | Aprobado |
| 26 | cómo está el clima hoy en Limache | unknown | 4.5 | 4.5 | 4.8 | 4.5 | **4.58** | Aprobado |
| 27 | dame una receta para hacer cazuela de vacuno con choclo | unknown | 4.5 | 4.5 | 4.8 | 4.5 | **4.58** | Aprobado |
| 28 | quién ganó el partido de fútbol anoche | unknown | 4.5 | 4.5 | 4.8 | 4.5 | **4.58** | Aprobado |
| 29 | a cuánto está el dólar en el banco estado hoy | unknown | 4.5 | 4.5 | 4.8 | 4.5 | **4.58** | Aprobado |
| 30 | cuéntame un chiste simpático para alegrar el día | unknown | 4.8 | 4.5 | 4.8 | 4.5 | **4.65** | Aprobado |

---

## 4. Dictamen Final de Calidad de la IA

- **Total de casos evaluados:** $30$
- **Promedio General Ponderado Obtenido:** **$4.84 / 5.00$**
- **Umbral mínimo exigido:** $\ge 4.00 / 5.00$
- **Porcentaje de respuestas sin errores técnicos:** **$100\%$** ($0\%$ fallas expuestas)
- **Dictamen:** **APROBADO**. La interacción con IA y la arquitectura de respaldo en dos niveles cumplen con excelencia los requerimientos de usabilidad gerontológica y resiliencia técnica de MoviTech.
