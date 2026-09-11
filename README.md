# Finca Criolla — tienda virtual

Proyecto listo para subir a GitHub y publicar en internet (Vercel o Netlify).

## 1. Probar en tu computador (opcional pero recomendado)

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 18 o más reciente).

```bash
npm install
npm run dev
```

Esto te da una URL local (normalmente `http://localhost:5173`) donde puedes ver
y probar la tienda antes de publicarla.

## 2. Subirlo a GitHub

1. Crea una cuenta en [github.com](https://github.com) si no tienes.
2. Crea un repositorio nuevo (botón verde "New repository"), por ejemplo
   llamado `finca-criolla-store`. Déjalo vacío, sin README ni licencia.
3. En tu computador, dentro de esta carpeta, corre:

```bash
git init
git add .
git commit -m "Primera versión de la tienda"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/finca-criolla-store.git
git push -u origin main
```

(Reemplaza `TU-USUARIO` por tu usuario de GitHub — lo verás en la página del
repositorio que acabas de crear, en el botón "Code").

## 3. Publicarla en internet — la forma más fácil: Vercel

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta con tu mismo
   usuario de GitHub ("Continue with GitHub").
2. Clic en "Add New… → Project".
3. Selecciona el repositorio `finca-criolla-store`.
4. Vercel detecta solo que es un proyecto Vite — no cambies nada, solo dale
   "Deploy".
5. En 1-2 minutos te da una URL pública como `finca-criolla-store.vercel.app`,
   ya funcionando y con HTTPS.

Cada vez que hagas `git push` a GitHub con cambios, Vercel vuelve a publicar
la página automáticamente. No tienes que repetir estos pasos.

**Alternativa:** [netlify.com](https://netlify.com) funciona casi igual
(conectas GitHub, eliges el repo, comando de build `npm run build`, carpeta
de salida `dist`).

## 4. Dominio propio (opcional)

Tanto Vercel como Netlify te dejan conectar un dominio propio
(por ejemplo `www.fincacriolla.co`) gratis desde su panel, en la sección
"Domains" del proyecto — solo apuntas los DNS del dominio que compres
(GoDaddy, Namecheap, etc.) a lo que te indiquen.

## Importante: sobre el panel administrativo y los datos

Este proyecto guarda los productos, combos y la configuración en
**localStorage del navegador** (lo edité así porque el `window.storage` que
usaba dentro del chat de Claude solo existe ahí, no en internet en general).

Eso significa:

- Puedes usar el panel admin (candado 🔒) normalmente y los cambios se ven
  al instante en ESE navegador/computador.
- Un cliente que entra desde su celular **no verá** los productos que tú
  agregaste desde tu computador — cada navegador tiene su propio
  almacenamiento.

Para una tienda que ya reciba clientes reales, el siguiente paso natural es
conectar una base de datos real para que el panel admin actualice la tienda
para todo el mundo. Dos opciones sencillas y con plan gratuito:

- **[Supabase](https://supabase.com)** — base de datos + API lista para usar,
  buena documentación en español, se integra fácil con React.
- **[Firebase](https://firebase.google.com)** (Firestore) — similar, de
  Google.

Si quieres, puedo ayudarte a hacer ese cambio cuando estés listo — es
cuestión de reemplazar las funciones `storageGet` / `storageSet` en
`src/App.jsx` por llamadas a Supabase o Firebase; el resto de la tienda
(carrito, combos, WhatsApp, panel admin) no cambia.

## Cambiar el número de WhatsApp y contraseña del admin

Puedes hacerlo desde el panel admin de la tienda una vez publicada
(Configuración), o directamente en el código, en el objeto
`DEFAULT_CONFIG` dentro de `src/App.jsx`.
# Finca-criolla-store
