import { getSettings } from "@/lib/settings";
import {
  updateWatermarkSettings,
  updateSiteText,
  updateAboutText,
  updateAboutEnabled,
} from "@/app/admin/settings-actions";
import { WatermarkSettingsForm } from "@/components/WatermarkSettingsForm";
import { ReprocessPhotosButton } from "@/components/ReprocessPhotosButton";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { SiteTextForm } from "@/components/SiteTextForm";
import { AboutMeForm } from "@/components/AboutMeForm";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-medium">Ajustes</h1>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">
          Portada
        </h2>
        <div className="mt-3">
          <SiteTextForm
            initialTitle={settings.siteTitle}
            initialSubtitle={settings.siteSubtitle ?? ""}
            onChange={updateSiteText}
          />
        </div>
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Sobre mí
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Se muestra en una página propia, enlazada desde la portada.
        </p>
        <div className="mt-3">
          <AboutMeForm
            initialText={settings.aboutText ?? ""}
            hasPhoto={Boolean(settings.aboutPhotoPath)}
            initialEnabled={settings.aboutEnabled}
            onTextChange={updateAboutText}
            onEnabledChange={updateAboutEnabled}
          />
        </div>
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Marca de agua
        </h2>
        <div className="mt-3">
          <WatermarkSettingsForm
            initialEnabled={settings.watermarkEnabled}
            initialText={settings.watermarkText}
            onChange={updateWatermarkSettings}
          />
        </div>
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Reprocesar fotos
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Las fotos ya subidas no cambian solas al tocar estos ajustes o la
          calidad: pulsa aquí para regenerarlas todas a partir de su
          original, aplicando la marca de agua y la calidad actuales.
        </p>
        <div className="mt-3">
          <ReprocessPhotosButton />
        </div>
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Contraseña de administrador
        </h2>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}
