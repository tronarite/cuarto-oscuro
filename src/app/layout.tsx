import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Segunda fuente, solo para titulares (portada, nombre de galería,
// "Sobre mí"...): una serif cálida y con carácter, para diferenciar la
// galería del resto de webs del propio dominio (tronarite.net), que son
// solo Geist — ver clase utilitaria "font-display" en globals.css.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

// Título/descripción de la pestaña vienen del siteTitle/siteSubtitle que
// se configuran en Ajustes > Portada, no de un texto fijo: ninguna otra
// página define su propio `metadata`, así que este es el único sitio
// donde hace falta tocarlo.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    // Base para que las URLs relativas de imagen en openGraph (las
    // fotos destacadas, ver page.tsx y galeria/[slug]/page.tsx) se
    // resuelvan a absolutas — sin esto, next build falla en cuanto
    // algún generateMetadata use una ruta relativa en openGraph.images.
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: settings.siteTitle,
    description: settings.siteSubtitle || "Galería fotográfica personal",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html
      lang="es"
      data-pack={settings.colorPack.toLowerCase()}
      data-photo-corner={settings.photoCorner.toLowerCase()}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem('theme');
              if (t === 'light' || t === 'dark') {
                document.documentElement.setAttribute('data-theme', t);
              }
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          {children}
          <PoweredByBadge />
        </ToastProvider>
      </body>
    </html>
  );
}
