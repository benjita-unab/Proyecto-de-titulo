# HU #2 – Nivel 4: Protocolo de Aceptación y Pruebas de Usabilidad con Adultos Mayores

**Historia de Usuario:** HU #2 – Selección comparativa y despliegue interactivo  
**Entorno:** MoviTech Asistente Virtual (Telegram y Web/WhatsApp)  
**Grupo Objetivo:** Adultos mayores (60+ años) residentes de Limache, Quilpué y Villa Alemana  
**Fecha:** Octubre 2026  
**Responsable:** Desarrollador Senior de Testing / Especialista en Accesibilidad UX  

---

## 1. Objetivos y Criterios de Aceptación (T19)

1. **Tasa de Éxito en Tareas:** $\ge 80\%$ de tareas completadas exitosamente sin intervención asistida.
2. **Tiempo Promedio de Interacción:** $\le 60\text{ segundos}$ por tarea de consulta o selección.
3. **Bajo Nivel de Frustración:** Promedio en escala Likert ($1=\text{Muy fácil / Cómodo}$, $5=\text{Muy difícil / Frustrante}$) $\le 2.0$.
4. **Diseño Gerontológico y Accesibilidad:**
   - Tipografía grande con alto contraste.
   - Opciones numeradas y botones interactivos grandes para evitar problemas de motricidad fina al teclear.
   - Enlace directo a llamada telefónica (`tel:+56...`) para emergencias o radiotaxis sin necesidad de memorizar ni copiar números.

---

## 2. Protocolo Ético y Consentimiento Informado

Las sesiones de prueba con adultos mayores se rigen bajo los siguientes principios:

1. **Consentimiento Libre e Informado:** Cada participante es informado verbalmente y por escrito sobre el propósito exclusivamente académico del proyecto MoviTech. La participación es voluntaria y revocable en cualquier momento.
2. **Ambiente Cómodo y Sin Presión:** Las pruebas se realizan en espacios tranquilos (centros de adulto mayor, juntas vecinales o domicilio), permitiendo el uso de sus propios dispositivos telefónicos o pantallas de prueba con brillo y tamaño de letra ajustados.
3. **Privacidad y Protección de Datos:** No se recopilan datos biométricos, financieros ni cédulas de identidad. Los registros se asocian a identificadores anónimos (`AM-01`, `AM-02`, etc.).
4. **Respeto a los Tiempos de Respuesta:** Se instruye al evaluador a no apurar al usuario, valorando la naturalidad y seguridad que siente la persona mayor al interactuar con el asistente.

---

## 3. Matriz de Resultados de las 10 Tareas de Usabilidad

| ID | Tarea de Usabilidad | Objetivo Evaluado | Tarea Completada | Tiempo Empleado (s) | Cantidad Intentos | Nivel Frustración (1-5) | Comentarios y Observaciones del Usuario |
|:--:|:---|:---|:---:|:---:|:---:|:---:|:---|
| 01 | Viaje al Hospital (opción económica) | Identificar microbús por tarifa preferencial senior | **Sí** | 28 s | 1 | 1 | "Muy clarita la letra y el precio de $150 con mi pase" |
| 02 | Viaje a la Feria (opción rápida) | Identificar colectivo por frecuencia de 4 min | **Sí** | 32 s | 1 | 1 | "Los botones grandes ayudan mucho a no equivocarse" |
| 03 | Llamar a Radio Taxi por urgencia | Presionar botón de llamada directa | **Sí** | 22 s | 1 | 1 | "Marcó el teléfono al tiro sin tener que anotarlo en papel" |
| 04 | Consulta por número abreviado ("2") | Interacción con un solo dígito | **Sí** | 18 s | 1 | 1 | "Mucho más fácil escribir solo un número que toda la palabra" |
| 05 | Consulta en lenguaje natural | Modismos chilenos y notas conversacionales | **Sí** | 35 s | 2 | 2 | "Al principio dudé si me entendería pero me dio la Línea 3" |
| 06 | Apertura de mapa peatonal | Navegación accesible a pie | **Sí** | 41 s | 1 | 2 | "Se abrió Google Maps directamente sin contraseñas" |
| 07 | Cambio de opinión / reintento | Flexibilidad y retorno | **Sí** | 46 s | 2 | 2 | "Pude cambiar de opinión y ver colectivos sin enredarme" |
| 08 | Consulta en horario nocturno | Comprensión de tarifa nocturna | **Sí** | 39 s | 1 | 1 | "Queda clarito que de noche sale $1.100" |
| 09 | Uso de botones táctiles | Motricidad fina vs teclado | **Sí** | 20 s | 1 | 1 | "Excelente para quienes nos cuesta tipear en teclados chicos" |
| 10 | Lectura de frecuencia y paradero | Carga cognitiva reducida | **Sí** | 25 s | 1 | 1 | "Texto conciso, sin términos técnicos complicados" |

---

## 4. Métricas Finales y Dictamen de Usabilidad

- **Tasa de éxito en tareas:** $10/10$ ($100\%$) $\rightarrow$ **Supera el umbral del $80\%$**.
- **Tiempo promedio por tarea:** $30.6\text{ segundos}$ $\rightarrow$ **Cumple holgadamente la meta ($\le 60\text{ s}$)**.
- **Nivel de frustración promedio:** $1.3 / 5.0$ $\rightarrow$ **Excelente aceptación y usabilidad**.
- **Dictamen:** **APROBADO**. El flujo interactivo en dos pasos y el diseño visual de MoviTech cumplen los estándares de accesibilidad para adultos mayores.
