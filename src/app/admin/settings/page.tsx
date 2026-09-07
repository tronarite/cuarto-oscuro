import { getSettings } from "@/lib/settings";
import {
  updateWatermarkSettings,
  updateSiteText,
  updateAboutText,
  updateAboutEnabled,
  updateAboutButtonLabel,
  updateColorPack,
  updatePhotoCorner,
} from "@/app/admin/settings-actions";
import { WatermarkSettingsForm } from "@/components/WatermarkSettingsForm";
import { ReprocessPhotosButton } from "@/components/ReprocessPhotosButton";
import { AdminCredentialsForm } from "@/components/AdminCredentialsForm";
import { SiteTextForm } from "@/components/SiteTextForm";
import { AboutMeForm } from "@/components/AboutMeForm";
import { ColorPackForm } from "@/components/ColorPackForm";
import { PhotoCornerForm } from "@/components/PhotoCornerForm";

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
    <section className="grid gap-4 border-t border-neutral-200 py-8 first:border-t-0 first:pt-0 md:grid-cols-[240px_1fr] md:gap-8">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-5xl px-8 py-16">
      <h1 className="text-2xl font-medium">Ajustes</h1>

      <div className="mt-6">
        <SettingsSection title="Portada">
          <SiteTextForm
            initialTitle={settings.siteTitle}
            initialSubtitle={settings.siteSubtitle ?? ""}
            onChange={updateSiteText}
          />
        </SettingsSection>

        <SettingsSection
          title="Sobre mí"
          description='Se muestra en una página propia, enlazada desde la portada.'
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

        <SettingsSection title="Marca de agua">
          <WatermarkSettingsForm
            initialEnabled={settings.watermarkEnabled}
            initialText={settings.watermarkText}
            onChange={updateWatermarkSettings}
          />
        </SettingsSection>

        <SettingsSection
          title="Reprocesar fotos"
          description="Las fotos ya subidas no cambian solas al tocar estos ajustes o la calidad: pulsa aquí para regenerarlas todas a partir de su original, aplicando la marca de agua y la calidad actuales."
        >
          <ReprocessPhotosButton />
        </SettingsSection>

        <SettingsSection title="Credenciales de administrador">
          <AdminCredentialsForm initialUsername={settings.adminUsername ?? ""} />
        </SettingsSection>
      </div>
    </main>
  );
}
