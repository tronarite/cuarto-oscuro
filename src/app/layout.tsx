import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Título/descripción de la pestaña vienen del siteTitle/siteSubtitle que
// se configuran en Ajustes > Portada, no de un texto fijo: ninguna otra
// página define su propio `metadata`, así que este es el único sitio
// donde hace falta tocarlo.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
        {children}
        <PoweredByBadge />
      </body>
    </html>
  );
}
