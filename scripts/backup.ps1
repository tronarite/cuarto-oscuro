# Copia de seguridad para el despliegue con Docker en Windows.
#
# Hace una instantánea consistente de la base SQLite (a través del propio
# contenedor, con el backup online de SQLite: no bloquea a la app) y la
# empaqueta junto con la carpeta uploads/ en un .tar.gz con fecha.
#
# Uso (desde la carpeta del proyecto o con ruta completa):
#   powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
#
# Parámetros opcionales:
#   -Service   nombre del servicio en docker-compose.yml   (photo-gallery)
#   -BackupDir carpeta donde dejar las copias               (.\backups)
#   -Keep      cuántas copias conservar                     (14)
#
# Programarlo con el Programador de tareas de Windows (diario a las 4:00):
#   schtasks /Create /TN "Cuarto Oscuro backup" /SC DAILY /ST 04:00 ^
#     /TR "powershell -ExecutionPolicy Bypass -File C:\OtroProgramas\PhotoPorfolio-VirtualGallery\scripts\backup.ps1"

param(
  [string]$Service = "photo-gallery",
  [string]$BackupDir = "",
  [int]$Keep = 14
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

if (-not $BackupDir) { $BackupDir = Join-Path $ProjectDir "backups" }
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$snapshotHost = Join-Path $ProjectDir "data\_snapshot.db"
if (Test-Path $snapshotHost) { Remove-Item $snapshotHost -Force }

# Backup online de SQLite desde dentro del contenedor (el script está en
# la imagen porque el Dockerfile copia todo el repo): escribe la
# instantánea en /app/data, que está montado en .\data del host.
docker compose exec -T $Service node /app/scripts/db-online-backup.cjs /app/data/_snapshot.db
if ($LASTEXITCODE -ne 0) { throw "El backup dentro del contenedor falló (código $LASTEXITCODE)" }
if (-not (Test-Path $snapshotHost)) { throw "No apareció data\_snapshot.db tras el backup" }

$archive = Join-Path $BackupDir "backup-$stamp.tar.gz"

# tar viene con Windows 10/11 (bsdtar). Se mete la instantánea como
# db.sqlite y la carpeta uploads/ tal cual.
Push-Location $ProjectDir
try {
  Copy-Item $snapshotHost (Join-Path $ProjectDir "db.sqlite") -Force
  if (Test-Path (Join-Path $ProjectDir "uploads")) {
    tar -czf $archive db.sqlite uploads
  } else {
    Write-Warning "No existe .\uploads, guardo solo la base de datos"
    tar -czf $archive db.sqlite
  }
} finally {
  Remove-Item (Join-Path $ProjectDir "db.sqlite") -Force -ErrorAction SilentlyContinue
  Remove-Item $snapshotHost -Force -ErrorAction SilentlyContinue
  Pop-Location
}

$sizeMB = [math]::Round((Get-Item $archive).Length / 1MB, 1)
Write-Host "backup: creado $archive ($sizeMB MB)"

# Retención: conservar solo las $Keep más recientes.
$all = Get-ChildItem $BackupDir -Filter "backup-*.tar.gz" | Sort-Object LastWriteTime -Descending
if ($all.Count -gt $Keep) {
  $all | Select-Object -Skip $Keep | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "backup: eliminado antiguo $($_.Name)"
  }
}
