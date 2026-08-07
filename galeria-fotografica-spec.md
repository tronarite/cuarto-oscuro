# Galería fotográfica personal — spec para PMV

## Contexto

Web personal para mostrar fotos de cámara (amateur, pero con nivel) organizadas por galerías (viajes o conjuntos de fotos). El objetivo es tener un enlace que enseñar a la gente en vez de mandar fotos sueltas por WhatsApp. No es una red social ni tiene usuarios múltiples: solo el dueño sube contenido, los visitantes solo ven.

Referencia conceptual: recorrer un museo (salas, progresión, cambio de "ambiente"), pero sin literalidad 3D en el PMV — se resuelve con scrollytelling 2D.

## Stack sugerido

- Next.js + Tailwind
- Framer Motion (transiciones/scroll)
- SQLite o Postgres (metadata)
- Sharp (procesado de imagen: watermark, resize, WebP/AVIF)
- exifr (extracción EXIF/GPS al subir)
- Leaflet o Mapbox GL (mapa del viaje, estilo monocromo)
- Despliegue en homelab propio (Debian con IP pública + Nginx Proxy Manager ya disponibles)

## Modelo de datos (mínimo)

**Gallery**
- id, título, slug, descripción, fecha/rango de viaje
- privacidad: pública / con contraseña / con enlace único no listado
- contador de visitas

**Photo**
- id, gallery_id, orden
- archivo procesado (con watermark, varias resoluciones) — el original sin marca se guarda aparte, nunca se sirve
- descripción (texto libre, editable)
- EXIF: cámara, objetivo, ISO, apertura, velocidad, focal
- GPS (lat/lng) si existe, para el mapa del viaje

## Features del PMV

### 1. Panel de administración (privado, solo tú)
- Crear galería (título, descripción, privacidad)
- Subir fotos a una galería (batch)
- Al subir: extracción automática de EXIF/GPS, generación de watermark, generación de tamaños responsive
- Editar descripción de cada foto tras subirla
- Reordenar fotos dentro de una galería
- Ver contador de visitas por galería

### 2. Vista pública de galería
- Layout adaptativo según cantidad de fotos (plantillas por rango: pocas / medias / muchas fotos) — cambia estructura de "salas"/secciones, no solo el grid
- Scrollytelling: transiciones entre secciones (fade, parallax leve) que dan sensación de progresión/paseo
- Al hacer clic en una foto: overlay con descripción + datos EXIF (cámara, objetivo, ISO, apertura, velocidad)
- Mapa del viaje (si hay fotos con GPS) con la ruta marcada, estilo monocromo acorde a la estética
- Modo oscuro (toggle, respeta preferencia del sistema por defecto)

### 3. Privacidad
- Galerías públicas listadas normalmente
- Galerías con enlace único no listado (slug no adivinable)
- Galerías con contraseña simple

### 4. Protección de imagen
- Watermark discreto incrustado en servidor al subir (nunca en cliente, nunca se sirve el original)
- Fricción anti-descarga: deshabilitar clic derecho/arrastre en imágenes, servir solo resoluciones de visualización (no el archivo a máxima calidad)
- Nota: no existe protección infalible contra captura de pantalla: el objetivo es fricción para el usuario casual, la protección real es el watermark

### 5. Estética visual

**Base:** blanco roto (~#F3F1EC / #F0EEE7), minimalista, nunca blanco puro. Las fotos son las protagonistas.

**Textura ambiental (capas independientes, mezcladas por un controlador central):**
- Grano fino tipo carrete analógico, siempre activo, muy sutil, se mueve despacio
- Parallax de profundidad: 2-3 capas (fondo/fotos) a distinta velocidad de scroll, da sensación de espacio real
- Blobs orgánicos muy suaves y grandes, gris clarito sobre blanco roto, desplazamiento lentísimo tipo nubes
- Luz tipo scanner: gradiente de luz muy tenue recorriendo la pantalla poco a poco, aparición ocasional

Estas capas no están todas al mismo peso todo el rato: cada sala/sección de la galería tiene una combinación predominante distinta (ej. sala 1 con más peso de blobs, sala 2 con más peso de luz), y dentro de una misma sala los ciclos de cada capa van desincronizados entre sí (periodos distintos y no sincronizados) para que no se sienta repetitivo ni robótico. Una función central recibe scroll/tiempo y devuelve el peso de opacidad de cada capa.

Sin elementos gráficos que compitan con las fotos (nada de estelas de tinta ni efectos protagonistas — la textura es ambiental, de fondo).

## Fuera de alcance del PMV (ideas para después)

- Recorrido 3D real con Three.js/WebGL
- Libro de visitas / comentarios
- Multi-idioma

## Prioridad de desarrollo sugerida

1. Modelo de datos + panel admin básico (crear galería, subir fotos, extracción EXIF/GPS)
2. Vista pública simple (grid + overlay con descripción/EXIF), sin textura ni scrollytelling todavía
3. Watermark + protección anti-descarga
4. Privacidad de galerías + contador de visitas
5. Layout adaptativo por cantidad de fotos + scrollytelling
6. Mapa del viaje
7. Capas de textura ambiental + modo oscuro
