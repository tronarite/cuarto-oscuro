import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
