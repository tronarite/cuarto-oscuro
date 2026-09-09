import Link from "next/link";
import { AdminNavLinks } from "@/components/AdminNavLinks";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <Link href="/admin" className="font-medium">
          Panel de administración
        </Link>
        <AdminNavLinks />
      </header>
      {children}
    </div>
  );
}
