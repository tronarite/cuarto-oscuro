import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Quita el indicador flotante de desarrollo (el círculo "N" abajo a la
  // izquierda); solo aparece con `next dev`, nunca en producción.
  devIndicators: false,
  // En desarrollo, Next.js bloquea por defecto las peticiones a recursos
  // dinámicos (como las fotos) que no vengan de localhost, para evitar
  // DNS rebinding. Para poder probar desde el móvil en la misma red
  // local hay que permitir esa IP explícitamente. Solo afecta a
  // `next dev`, no existe este bloqueo en producción.
  allowedDevOrigins: ["192.168.0.139"],
  experimental: {
    serverActions: {
      // Subida de fotos en batch vía Server Action: varias fotos de cámara
      // en una sola petición pueden superar fácilmente el límite por defecto (1 MB).
      bodySizeLimit: "100mb",
    },
    // El proxy (antes "middleware") trunca por su cuenta el cuerpo a 10 MB
    // antes de que llegue a la Server Action, aunque bodySizeLimit sea mayor.
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
