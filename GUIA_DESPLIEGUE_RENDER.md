# 🚀 Guía Paso a Paso: Despliegue del Backend en Render

Esta guía te explica cómo desplegar el backend de **MoviTech** en [Render.com](https://render.com) en su plan gratuito con HTTPS permanente. Con esto, el bot de Telegram y la API estarán funcionando 24/7 en la nube sin necesidad de tener tu computador encendido ni levantar túneles de Cloudflare.

---

## 📋 Requisitos Previos

1. **Subir los cambios a GitHub:**
   Asegúrate de haber hecho `git push` de tu rama con los últimos cambios a tu repositorio de GitHub.
2. **Cuenta en Render:**
   Inicia sesión o regístrate gratis en [dashboard.render.com](https://dashboard.render.com/) (puedes ingresar directamente con tu cuenta de GitHub).
3. **Variables de entorno a mano:**
   Ten a mano los valores de tu archivo `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET` (si lo utilizas)

---

## 🛠️ Paso 1: Crear el Nuevo Web Service en Render

1. En el Dashboard de Render, haz clic en el botón **"New +"** (arriba a la derecha) y selecciona **"Web Service"**.
2. Selecciona la opción **"Build and deploy from a Git repository"** y haz clic en **Next**.
3. Conecta tu cuenta de GitHub y busca tu repositorio: `Proyecto-de-titulo`. Haz clic en **"Connect"**.

---

## ⚙️ Paso 2: Configurar los Parámetros del Servicio

Configura los campos exactamente como se indica a continuación:

| Campo | Valor a Ingresar | Explicación |
| :--- | :--- | :--- |
| **Name** | `movitech-backend` *(o el nombre que prefieras)* | Nombre de tu servicio en Render. |
| **Region** | `Oregon (US West)` u `Ohio (US East)` | La región más cercana. |
| **Branch** | `correciones-HU-Y-Pruebas-generales` *(o tu rama activa)* | Rama desde donde Render descargará el código. |
| **Root Directory** | `backend` | **¡MUY IMPORTANTE!** Como el backend está dentro de la carpeta `backend`, debes indicarlo aquí para que ejecute los comandos en el directorio correcto. |
| **Runtime** | `Node` | Entorno de ejecución. |
| **Build Command** | `npm install && npm run build` | Instala dependencias y compila TypeScript a JavaScript (`dist/`). |
| **Start Command** | `npm run start:prod` | Ejecuta el servidor en producción (`node dist/main`). |
| **Instance Type** | `Free` ($0/month) | Plan gratuito. |

---

## 🔐 Paso 3: Agregar las Variables de Entorno (Environment Variables)

En la misma pantalla de configuración (o en la pestaña **Environment**), desplázate hacia abajo y agrega las siguientes variables:

1. **`NODE_ENV`**: `production`
2. **`PORT`**: `10000` *(Render asigna el puerto 10000 por defecto para servicios web)*
3. **`SUPABASE_URL`**: *(Pega aquí la URL de tu proyecto Supabase)*
4. **`SUPABASE_SERVICE_ROLE_KEY`**: *(Pega aquí tu Service Role Key de Supabase)*
5. **`TELEGRAM_BOT_TOKEN`**: *(Pega aquí el Token de tu bot entregado por @BotFather)*
6. *(Opcional)* **`TELEGRAM_WEBHOOK_SECRET`**: *(Si lo tienes configurado en tu `.env`)*

Haz clic en el botón inferior: **"Create Web Service"**.

---

## ⏳ Paso 4: Esperar el Despliegue y Obtener la URL Pública

1. Render comenzará a clonar el repositorio, ejecutar `npm install` y compilar el proyecto con `nest build`.
2. Verás en los logs de la consola:
   ```text
   ==> Uploading build...
   ==> Build successful 🎉
   ==> Deploying...
   ==> Starting service with 'npm run start:prod'
   [Nest] ... Nest application successfully started
   ==> Your service is live 🚀
   ```
3. En la parte superior izquierda, debajo del nombre de tu servicio, verás tu enlace público permanente HTTPS:
   ```text
   https://movitech-backend-xxxx.onrender.com
   ```
   *(Copia esa URL completa)*.

---

## 🤖 Paso 5: Conectar Telegram al Webhook de Render

Una vez que el servicio esté en estado **Live**, conecta tu bot de Telegram a la URL de Render para que reciba los mensajes en tiempo real.

Abre una terminal (PowerShell o Git Bash) en tu computador y ejecuta el siguiente comando reemplazando con tu Token y tu URL de Render:

### En PowerShell:
```powershell
$BOT_TOKEN = "TU_TELEGRAM_BOT_TOKEN_AQUI"
$RENDER_URL = "https://movitech-backend-xxxx.onrender.com"

Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$RENDER_URL/api/telegram/webhook" -Method Post
```

### O con cURL:
```bash
curl -X POST "https://api.telegram.org/botTU_TELEGRAM_BOT_TOKEN_AQUI/setWebhook?url=https://movitech-backend-xxxx.onrender.com/api/telegram/webhook"
```

### Respuesta esperada de Telegram:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

Para verificar que Telegram está sincronizado con Render, puedes consultar:
```bash
curl "https://api.telegram.org/botTU_TELEGRAM_BOT_TOKEN_AQUI/getWebhookInfo"
```

---

## 🎉 ¡Listo! Todo Funcionando 24/7

* Ya no necesitas ejecutar `npm run start:dev` ni levantar túneles de Cloudflare en tu máquina.
* Cada vez que hagas `git push` a tu rama de GitHub, **Render detectará automáticamente el cambio y re-desplegará la nueva versión** de forma transparente.
* El bot responderá en Telegram de inmediato con los filtros dinámicos de Quilpué y Villa Alemana.

> [!NOTE]
> **Nota sobre el Plan Free de Render:** Si el servicio pasa más de 15 minutos sin recibir ninguna solicitud, Render entra en modo reposo (*sleep*). Cuando alguien envía un mensaje al bot después de estar dormido, el primer mensaje puede tardar entre 20 y 30 segundos en reactivar el contenedor. Una vez despierto, todas las respuestas posteriores son instantáneas (< 1.5s).
