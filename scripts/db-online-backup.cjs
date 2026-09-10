// Instantánea consistente de la base SQLite usando el backup online de
// SQLite (vía better-sqlite3, que ya es dependencia de la app). No
// bloquea a la aplicación mientras se ejecuta.
//
// Uso:  node scripts/db-online-backup.cjs <ruta-destino>
// Lee la ruta de origen de DATABASE_URL (formato "file:...").

const Database = require("better-sqlite3");

const dest = process.argv[2];
if (!dest) {
  console.error("uso: node scripts/db-online-backup.cjs <ruta-destino>");
  process.exit(2);
}

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("file:")) {
  console.error(`DATABASE_URL no es un fichero SQLite: ${url ?? "(vacío)"}`);
  process.exit(2);
}

const src = url.replace(/^file:/, "");
const db = new Database(src, { readonly: true });
db.backup(dest)
  .then(() => {
    db.close();
    console.log(`snapshot ok -> ${dest}`);
  })
  .catch((err) => {
    console.error(String(err));
    process.exit(1);
  });
