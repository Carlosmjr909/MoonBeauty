# Pruebas de carga — Moon Beauty

Herramienta: **k6**. Script: `k6-browse.js`. Datos del catálogo real (IDs de producto, categorías): `data.js`.

## Qué prueba y qué NO prueba

Solo navegación pública de solo lectura (`GET`). **Nunca** llama a:
- `/api/enviar-pedido/crear-pedido` (crearía pedidos reales)
- `/api/enviar-pedido` (mandaría correos reales)
- `/api/enviar-cupon` (mandaría correos reales, requiere admin)
- `/admin/*`, `/account` (requieren autenticación/rol; no aportan nada probarlos sin sesión real)
- Ningún `POST`/`PUT`/`DELETE`

`/checkout` sí se visita, pero solo con `GET` (la página se renderiza para cualquier visitante, incluso sin cuenta) — nunca se envía el formulario.

Hay un contador (`solicitudes_a_rutas_prohibidas`) con threshold `count==0` que corta la prueba si el script alguna vez tocara una de esas rutas por error.

## Uso

```bash
# Windows: k6 se instaló con winget, normalmente en:
#   C:\Program Files\k6\k6.exe

BASE_URL=http://127.0.0.1:5175 PROFILE=smoke k6 run loadtest/k6-browse.js
```

Perfiles disponibles (`PROFILE=...`): `smoke`, `load25`, `load50`, `load100`, `stress250`, `stress500`, `prod50`, `prod100`, `prod250`, `prod500`, `prod1000`, `prod2000`.

También se puede correr un escalón suelto sin perfil:
```bash
BASE_URL=... VUS=10 DURATION=1m k6 run loadtest/k6-browse.js
```

## Importante sobre "local"

El servidor local (`npm run dev`) sigue leyendo el catálogo real de Firestore (no hay una base de datos "de mentira" separada) — así que probar contra `localhost` genera lecturas reales, pero NUNCA escrituras, correos ni pedidos. El costo de esas lecturas es insignificante (Firestore cobra por cada 100,000 lecturas, no por cada una).

**Los tiempos medidos contra `npm run dev` no son representativos de producción** — el modo desarrollo de Vite no está optimizado (sin minificar, sin code-splitting, compila bajo demanda). Sirven para validar que el script funciona, no para estimar capacidad real. Para números realistas sin tocar el dominio de producción, la opción intermedia es un **deployment de vista previa de Vercel** (una URL de preview real, con el mismo build optimizado que producción, pero separada del tráfico de clientes reales).

## Antes de correr contra producción (`prod*`)

Ver el informe completo para el detalle, pero en resumen: nunca saltar directo a un escalón alto, avisar cuándo se va a correr, tener el dashboard de Firebase y Vercel abiertos en paralelo, y estar listo para cortar manualmente (`Ctrl+C`) además de los `abortOnFail` automáticos que ya trae el script.
