import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Subida de fotos en batch vía Server Action: varias fotos de cámara
      // en una sola petición pueden superar fácilmente el límite por defecto (1 MB).
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
