# VR Coaster Cabin - Three.js

Proyecto Three.js creado desde tu archivo `cabin.fbx`. La escena carga la cabina original y la mejora en tiempo real con materiales PBR, neones, luces, rieles, túnel futurista, partículas y movimiento de montaña rusa con soporte WebXR/VR.

## Cómo correrlo

1. Instala Node.js.
2. Abre una terminal dentro de esta carpeta.
3. Ejecuta:

```bash
npm install
npm run dev
```

4. Abre la URL local que muestra Vite.

## Controles

- `W`: subir velocidad.
- `S`: bajar velocidad.
- `Espacio`: pausar/reanudar.
- `C`: cambiar entre cámara cockpit, cámara externa e inspección.
- Botón `Enter VR`: entrar a VR si el navegador y visor lo soportan.

## Estructura

```text
public/assets/cabin.fbx   # Tu modelo original
src/main.js               # Escena Three.js y experiencia VR/coaster
src/style.css             # HUD y estilos
index.html                # Entrada del proyecto
package.json              # Dependencias y scripts
```

## Notas para VR

Para usar WebXR en un visor, normalmente necesitas servir el sitio por HTTPS o desde `localhost`. El modo `npm run dev` funciona bien para pruebas en computadora; para un visor autónomo, publica el `dist` generado con `npm run build` en un hosting HTTPS.
