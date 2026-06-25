## VoiceCook

Estructura base de un proyecto **Next.js (App Router)** para una app de cocina manoslibres.

### Scripts

- `npm run dev`: arranca el servidor de desarrollo.
- `npm run dev:https`: arranca el servidor de desarrollo con HTTPS (certificado autofirmado).
- `npm run dev:https:host`: arranca HTTPS en `0.0.0.0` para pruebas desde otros dispositivos.
- `npm run build`: genera el build de producción.
- `npm run start`: ejecuta el servidor en modo producción.
- `npm run lint`: ejecuta ESLint.

### Micrófono y permisos (muy importante)

Las APIs de voz del navegador requieren contexto seguro. Si abres la app en HTTP no seguro, el permiso de micrófono puede quedar bloqueado o no mostrarse.

Pasos recomendados:

1. Ejecuta `npm run dev:https`.
2. Abre la URL HTTPS que imprime Next.js (por ejemplo `https://localhost:3000`).
3. Acepta el certificado local si el navegador lo solicita.
4. En el icono del candado del navegador, configura **Micrófono = Permitir**.
5. Recarga la página y vuelve a activar voz.

Si ya estaba bloqueado:

1. Abre configuración del sitio (candado en la barra de direcciones).
2. Restablece permisos del sitio o cambia micrófono a permitir.
3. Recarga la pestaña.

### Generación de recetas con IA

La acción de servidor `inspireRecipeAction` genera recetas dinámicas usando tu prompt de ingredientes/idea.

**Entrada por voz:** el modal "Inspirar Nueva Receta" usa la Web Speech API del navegador para dictar tu idea (sin servicios externos de transcripción).

**Generación de contenido:** usa **Gemini** (`GEMINI_API_KEY`) en el servidor. Clave gratuita en [Google AI Studio](https://aistudio.google.com/apikey).

Configuración:

1. Crea tu archivo `.env` o `.env.local` (si no existe).
2. Agrega `GEMINI_API_KEY`.
3. Reinicia el servidor (`npm run dev` o `npm run dev:https`).

Importante:

1. La clave de Gemini debe quedarse solo en backend (Server Actions).
2. No uses `NEXT_PUBLIC_` para esa clave.
3. La app valida que la respuesta de IA cumpla el esquema JSON de receta antes de mostrarla.