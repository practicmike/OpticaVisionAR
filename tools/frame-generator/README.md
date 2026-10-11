# Armazón Wayfarer — catálogo 3D para simulador AR

Modelos GLB generados por código (Python + numpy, sin dependencias externas). Diseño genérico de forma "wayfarer"; sin logotipos ni marcas.

## Archivos

| Archivo | Descripción | Triángulos |
|---|---|---|
| `wayfarer_negro_humo.glb` | Negro brillante, lente humo | ~57 k |
| `wayfarer_carey_cafe.glb` | Carey (textura 1024², incluida), lente café | ~57 k |
| `wayfarer_azul_marino_cristal.glb` | Azul marino, lente transparente (graduado) | ~57 k |
| `wayfarer_vino_verde.glb` | Vino, lente verde | ~57 k |
| `wayfarer_negro_humo_lite.glb` | Misma forma con menos polígonos (para móviles de gama baja) | ~15 k |

Medidas reales del modelo: lente 50.2 × 42.2 mm, puente 18 mm, ancho frontal 140.1 mm, varilla 134 mm, profundidad total ≈ 151 mm.

## Convenciones (importantes para el AR)

- Unidades: **metros**. Ejes: **+Y arriba, +Z hacia adelante** (lejos de la cara), +X a la derecha de quien mira el armazón de frente (= lado izquierdo de quien lo usa).
- **Origen**: centro del puente, en el plano frontal del armazón. Las varillas se extienden hacia −Z.
- Estructura de nodos: `wayfarer_*` (raíz) → `frente` (aros, puente, plaquetas, lentes), `temple_L` y `temple_R` (cada una con su **pivote en la bisagra**: puedes girarlas en Y para adaptarlas al ancho de cabeza), `anchor_nose_rest`, `anchor_ear_L`, `anchor_ear_R`.
- Las anclas son **referencias aproximadas**: `anchor_nose_rest` ≈ punto de apoyo de las plaquetas (alinéalo con el landmark 168 o 6 de MediaPipe y ajusta con un offset propio tras probarlo en un rostro real); `anchor_ear_*` marca el inicio de la curva retroauricular.
- `extras` del nodo raíz incluye las medidas del armazón en mm.

## Materiales

- `acetato`: PBR con `KHR_materials_clearcoat` (`MeshPhysicalMaterial` en three.js; GLTFLoader lo soporta de serie).
- `lente`: `alphaMode: BLEND` (transparencia por alfa). En el cristal transparente el alfa es 0.10.
- `metal` y `metal_oscuro`: tornillo y bisagra.

## Uso rápido en three.js

```js
const gltf = await new GLTFLoader().loadAsync('wayfarer_carey_cafe.glb');
const frame = gltf.scene.children[0];
// escala: compara el ancho frontal (extras.front_width_mm) con la distancia entre sienes del rostro
// pose: aplica la matriz de transformación facial de MediaPipe a `frame` y suma un offset desde anchor_nose_rest
frame.getObjectByName('temple_L').rotation.y = -0.05; // ejemplo de ajuste fino
```

## Qué NO incluye

- **Oclusor de cabeza**: para que las varillas desaparezcan detrás de las orejas y las sienes, usa la malla canónica de MediaPipe (o tu propio mesh de cabeza) como oclusor con `material.colorWrite = false`.
- Reflejos del entorno: el aspecto final depende de tu iluminación / mapa de entorno.

## Regenerar o crear nuevos estilos

`python3 build_catalog.py salida/` regenera todo. Los parámetros del diseño están al inicio de `wayfarer.py` (diccionario `P`): tamaño de lente, puente, grosor de aros, largo de varillas, curvatura envolvente, etc. Para otros estilos (redondo, aviador, cat-eye) se cambia el contorno en `lens_contour()` y se reutilizan el resto de las piezas.

`validate.py` revisa cada GLB (índices, min/max, normales, simetría) y `render.py` lo rasteriza para una vista previa sin motor 3D.

## Cómo entra un modelo nuevo al catálogo del sitio

1. Genera el GLB (`cd tools/frame-generator && python3 build_catalog.py out`) y revísalo con `python3 validate.py out`.
2. Copia el `.glb` a `client/public/frames/models/` y una miniatura 600×400 (fondo `#f4f4f2`, vista 3/4) a `client/public/frames/thumbs/`.
3. Agrega el armazón a `framesSeed` en `server/seed-data.ts` (se identifica por `modelUrl`).
4. Al desplegar, el build lo inserta en la base si no existe; no toca los que ya están ni tus ediciones.

El renderer usa el nodo `frente` para centrar el armazón; si un modelo no lo tiene, usa la caja completa.
