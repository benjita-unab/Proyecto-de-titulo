# MoviTech — Asistente Virtual de Movilidad en Telegram para Adultos Mayores

Sistema backend desarrollado en **NestJS (TypeScript)** orientado a asistir a personas mayores de **Limache, Quilpué y Villa Alemana** en sus traslados hacia destinos prioritarios (como el **Hospital de Quilpué**), mediante **Telegram Bot API** (botones interactivos, ubicación GPS y notas de voz), cálculo geodésico con **Haversine**, persistencia en **Supabase (PostgreSQL)** con respaldo local en **SQLite** y desacoplamiento por **MQTT**.

---

## Arquitectura del Sistema

- **Canal único de interacción:** Bot de Telegram (`TelegramModule` / `TelegramController` / `TelegramService`) con teclado guiado por botones (`ReplyKeyboardMarkup` + `InlineKeyboardMarkup`), validación de ubicación GPS y soporte de notas de voz (`.ogg`).
- **Motor de flujo y georreferenciación:**
  - `ComparativeFlowService`: flujo conversacional guiado por estados (`destino` → `ubicacion` → `medio` → `algo_mas`).
  - `HaversineService`: cálculo exacto de distancias geodésicas, filtro por líneas que llegan al destino/hospital, prefiltro espacial de $500\text{ m}$ con expansión progresiva y ranking de hasta 3 opciones.
  - `GeminiService` + `NlpService`: interpretación de lenguaje natural y fallback local determinístico.
- **Persistencia y contingencia:**
  - Base primaria en **Supabase (PostgreSQL)** siguiendo el [Modelo Único Unificado](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/backend/src/scripts/modelo_unico_movitech.sql).
  - Réplica local de failover en **SQLite JSON** (`DatabaseManagerService`).

---

## Documentación Técnica

- [Diccionario de Datos (Modelo Único Unificado)](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/docs/DICCIONARIO_DE_DATOS.md)
- [Arquitectura de Datos, Extracción y Actualización](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/docs/ARQUITECTURA_DATOS_Y_EXTRACCION.md)
- [Registro de Pruebas Unitarias y Plan de Pruebas](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/DOCUMENTACION_PRUEBAS_UNITARIAS.md)
- [Guía de Despliegue en Render](file:///c:/Users/benja/Documents/GitHub/Proyecto-de-titulo/GUIA_DESPLIEGUE_RENDER.md)

---

## Ejecución y Pruebas (`backend/`)

```bash
cd backend
npm install
npm test
npm run start:dev
```
