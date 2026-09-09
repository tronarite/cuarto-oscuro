import { getSettings } from "@/lib/settings";
import { SettingsNav } from "@/components/SettingsNav";
import {
  updateWatermarkSettings,
  updateSiteText,
  updateAboutText,
  updateAboutEnabled,
  updateAboutButtonLabel,
  updateColorPack,
  updatePhotoCorner,
  updateAutoCaption,
} from "@/app/admin/settings-actions";
import { WatermarkSettingsForm } from "@/components/WatermarkSettingsForm";
import { ReprocessPhotosButton } from "@/components/ReprocessPhotosButton";
import { AdminCredentialsForm } from "@/components/AdminCredentialsForm";
import { SiteTextForm } from "@/components/SiteTextForm";
import { AboutMeForm } from "@/components/AboutMeForm";
import { ColorPackForm } from "@/components/ColorPackForm";
import { PhotoCornerForm } from "@/components/PhotoCornerForm";
import { AutoCaptionForm } from "@/components/AutoCaptionForm";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-[240px_1fr] md:gap-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

// Con 8 secciones, una simple lista larga era difícil de escanear (había
// que hacer scroll a ciegas para encontrar algo). Se agrupan por tema:
// antes cada grupo solo tenía una etiqueta pequeña y gris, casi igual de
// discreta que el borde fino entre secciones de dentro del propio grupo
// — costaba distinguir "aquí empieza un grupo nuevo" de "aquí sigue el
// mismo". Ahora el corte de grupo lleva su propio borde grueso (no el
// fino de SettingsSection) y un título más marcado, para que se note a
// simple vista.`scroll-mt-24` en cada grupo para que un salto por ancla
// no deje el título tapado bajo la cabecera fija.
function SettingsGroup({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t-2 border-border pt-10 first:border-t-0 first:pt-0"
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const GROUPS = [
  { id: "contenido", label: "Contenido" },
  { id: "apariencia", label: "Apariencia" },
  { id: "fotos", label: "Fotos" },
  { id: "cuenta", label: "Cuenta" },
];

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-5xl px-8 py-16">
      <h1 className="text-2xl font-medium">Ajustes</h1>

      {/* Navegación rápida: con tantas secciones, saltar directo evita
          bajar a ciegas buscando una en concreto. */}
      <SettingsNav groups={GROUPS} />

      <div className="mt-10 flex flex-col">
        <SettingsGroup id="contenido" title="Contenido">
          <SettingsSection title="Portada">
            <SiteTextForm
              initialTitle={settings.siteTitle}
              initialSubtitle={settings.siteSubtitle ?? ""}
              onChange={updateSiteText}
            />
          </SettingsSection>

          <SettingsSection
            title="Sobre mí"
            description="Se muestra en una página propia, enlazada desde la portada."
          >
            <AboutMeForm
              initialText={settings.aboutText ?? ""}
              hasPhoto={Boolean(settings.aboutPhotoPath)}
              initialEnabled={settings.aboutEnabled}
              initialButtonLabel={settings.aboutButtonLabel}
              onTextChange={updateAboutText}
              onEnabledChange={updateAboutEnabled}
              onButtonLabelChange={updateAboutButtonLabel}
            />
          </SettingsSection>
        </SettingsGroup>

        <SettingsGroup id="apariencia" title="Apariencia">
          <SettingsSection
            title="Estilo de color"
            description="Se aplica a toda la web, para todo el mundo. El botón de claro/oscuro sigue funcionando dentro del pack elegido."
          >
            <ColorPackForm
              initialPack={settings.colorPack}
              onChange={updateColorPack}
            />
          </SettingsSection>

          <SettingsSection
            title="Bordes de las fotos"
            description="Esquina de las miniaturas en toda la web: portada, galerías y panel de administración."
          >
            <PhotoCornerForm
              initialCorner={settings.photoCorner}
              onChange={updatePhotoCorner}
            />
          </SettingsSection>

          <SettingsSection
            title="Marca de agua"
            description="Protege las fotos que se ven públicamente, con el método y estilo que elijas."
          >
            <WatermarkSettingsForm
              initialEnabled={settings.watermarkEnabled}
              initialText={settings.watermarkText}
              initialMethod={settings.watermarkMethod}
              initialStyle={settings.watermarkStyle}
              initialCorner={settings.watermarkCorner}
              onChange={updateWatermarkSettings}
            />
            {/* Reprocesar fotos vive aquí y no en su propia sección: hoy
                lo único que cambia al reprocesar es justo esto (método,
                estilo y calidad de la marca de agua), así que tiene más
                sentido junto al ajuste que de verdad afecta, no suelto
                en otro sitio. */}
            <div className="mt-6 max-w-md border-t border-border pt-6">
              <p className="mb-3 text-xs text-muted-foreground">
                Las fotos ya subidas no cambian solas al tocar estos
                ajustes: pulsa aquí para regenerarlas todas a partir de su
                original, aplicando la marca de agua actual.
              </p>
              <ReprocessPhotosButton />
            </div>
          </SettingsSection>
        </SettingsGroup>

        <SettingsGroup id="fotos" title="Fotos">
          <SettingsSection
            title="Identificación automática"
            description="Al subir una foto nueva, intenta rellenar el pie de foto solo."
          >
            <AutoCaptionForm
              initialEnabled={settings.autoCaptionEnabled}
              onChange={updateAutoCaption}
            />
          </SettingsSection>
        </SettingsGroup>

        <SettingsGroup id="cuenta" title="Cuenta">
          <SettingsSection
            title="Credenciales de administrador"
            description="El usuario y la contraseña con los que entras a este panel."
          >
            <AdminCredentialsForm initialUsername={settings.adminUsername ?? ""} />
          </SettingsSection>
        </SettingsGroup>
      </div>
    </main>
  );
}
