import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const galleries = await prisma.gallery.findMany({
    where: { privacy: "PUBLIC" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Galería fotográfica</h1>
        <ThemeToggle />
      </div>

      <ul className="mt-10 space-y-4">
        {galleries.map((gallery) => (
          <li key={gallery.id}>
            <Link
              href={`/galeria/${gallery.slug}`}
              className="text-lg underline decoration-border underline-offset-4 hover:decoration-muted-foreground"
            >
              {gallery.title}
            </Link>
          </li>
        ))}
        {galleries.length === 0 && (
          <li className="text-muted-foreground">
            Todavía no hay galerías públicas.
          </li>
        )}
      </ul>
    </main>
  );
}
