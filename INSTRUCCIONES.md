# Instrucciones para OpenCode / Agentes IA

Sigue estas instrucciones en todo trabajo sobre el proyecto LuxArs (version Node/Express).

## 1. Commits y Push

1. Cuando termines una tarea basada en un prompt, crea un commit descriptivo en espanol y haz `git push` a la rama actual.
2. Antes de pushear, muestra al usuario los archivos modificados y pide confirmacion si hay cambios destructivos.

## 2. Ramas

1. Para cambios experimentales o que puedan romper la pagina, crea una rama nueva: `git checkout -b feature/descripcion-breve`.
2. No pushees directamente a `main` sin preguntar si el cambio es mayor (por ejemplo, reestructuracion de HTML o cambios en el navbar).

## 3. Estilo de codigo

1. Respeta la estetica Swiss Design: fondos oscuros (#121212, #1E1E1E), acentos rojos (#FF0000), tipografia uppercase con letter-spacing y bordes rectos sin border-radius.
2. No uses emojis en el codigo ni en los commits.
3. Manten el HTML semantico y el CSS modulado por secciones con comentarios.

## 4. Estructura del proyecto (Node/Express)

```
luxars-node/
├── public/
│   ├── index.html      -> la pagina (SPA)
│   ├── css/styles.css  -> TODO el CSS en este unico archivo
│   └── js/script.js    -> TODO el JS en este unico archivo
├── supabase/migrations/ -> SQL que se pega en Supabase
├── server.js           -> sirve el frontend con Express
├── package.json
└── .env                -> credenciales Supabase y MongoDB (nunca subir)
```

1. No crees CSS/JS sueltos por cada uno. Todo el estilo va en `styles.css` y todo el script en `script.js`.
2. No subas `node_modules/` ni `.env` (estan en `.gitignore`).
3. El servidor inyecta `window.SUPABASE_URL` y `window.SUPABASE_ANON_KEY` desde `.env`.
4. Configura `MONGODB_URI` para persistir fotografos y reservas. Si no esta definida, la app conserva el modo demo en memoria.

## 5. Despliegue

1. No hay despliegue configurado por ahora. Se corre local con `npm install` y `npm start`.

## 6. Verificar antes de subir

1. Valida el JavaScript con `node --check public/js/script.js`.
2. Confirma que el servidor arranca con `npm start`.
3. Revisa con `git diff` lo que se va a subir antes de commitear.
