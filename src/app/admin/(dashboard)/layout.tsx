import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-8 py-5">
        <Link href="/admin" className="font-medium">
          Panel de administración
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="text-sm text-neutral-500 transition-all hover:text-neutral-900 active:scale-95"
          >
            Ajustes
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="text-sm text-neutral-500 transition-all hover:text-neutral-900 active:scale-95"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
