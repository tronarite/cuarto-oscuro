# Copia de seguridad para el despliegue con Docker en Windows.
#
# Detiene el contenedor unos segundos para copiar la base SQLite de forma
# consistente (la base es minúscula y solo escribe el panel de admin, así
# que la parada es de ~10-20 s), la empaqueta junto con la carpeta
# uploads/ en un .tar.gz con fecha y vuelve a levantar el contenedor.
#
# Uso (desde la carpeta del proyecto o con ruta completa):
#   powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
#
# Parámetros opcionales:
#   -BackupDir  carpeta donde dejar las copias   (.\backups)
#   -Keep       cuántas copias conservar          (14)
#   -NoStop     no parar el contenedor (copia en caliente; solo si te
#               vale con una copia no perfectamente atómica)
#
# Programarlo con el Programador de tareas de Windows (diario a las 4:00,
# corriendo en la sesión del usuario que tiene Docker Desktop):
#   schtasks /Create /TN "Cuarto Oscuro backup" /SC DAILY /ST 04:00 ^
#     /RL HIGHEST /RU "%USERDOMAIN%\%USERNAME%" /IT /F ^
#     /TR "powershell -ExecutionPolicy Bypass -NoProfile -File \"C:\OtroProgramas\PhotoPorfolio-VirtualGallery\scripts\backup.ps1\""

param(
  [string]$BackupDir = "",
  [int]$Keep = 14,
  [switch]$NoStop
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

if (-not $BackupDir) { $BackupDir = Join-Path $ProjectDir "backups" }
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dbHost = Join-Path $ProjectDir "data\dev.db"
if (-not (Test-Path $dbHost)) { throw "No encuentro data\dev.db" }

$archive = Join-Path $BackupDir "backup-$stamp.tar.gz"
$staged = $false

try {
  if (-not $NoStop) {
    Write-Host "backup: parando el contenedor…"
    docker compose stop | Out-Null
  }

  Copy-Item $dbHost (Join-Path $ProjectDir "db.sqlite") -Force
  $staged = $true

  if (-not $NoStop) {
    Write-Host "backup: levantando el contenedor…"
    docker compose start | Out-Null
  }

  # tar viene con Windows 10/11 (bsdtar). Mete la base como db.sqlite y la
  # carpeta uploads/ tal cual.
  if (Test-Path (Join-Path $ProjectDir "uploads")) {
    tar -czf $archive db.sqlite uploads
  } else {
    Write-Warning "No existe .\uploads, guardo solo la base de datos"
    tar -czf $archive db.sqlite
  }
} finally {
  if ($staged) {
    Remove-Item (Join-Path $ProjectDir "db.sqlite") -Force -ErrorAction SilentlyContinue
  }
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
