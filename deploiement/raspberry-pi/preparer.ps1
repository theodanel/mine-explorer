# Prépare l'envoi du serveur vers le Raspberry Pi : compile le jar sur ce PC, puis rassemble tout dans
# mine-explorer-api.tar.gz. Le Pi n'a ainsi rien à compiler.
# Lancement, depuis ce dossier : powershell -ExecutionPolicy Bypass -File .\preparer.ps1

$ErrorActionPreference = 'Stop'

$ici = $PSScriptRoot
$backend = Resolve-Path (Join-Path $ici '..\..\backend')
$archive = Join-Path $ici 'mine-explorer-api.tar.gz'

Write-Host "`n=== Compilation du serveur ===" -ForegroundColor Cyan
Push-Location $backend
try {
    # Les tests tournent en CI ; ici on ne fait que produire le jar
    .\mvnw.cmd -B -ntp package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Échec de la compilation du serveur (code $LASTEXITCODE)" }
}
finally { Pop-Location }

$jars = @(Get-ChildItem (Join-Path $backend 'target') -Filter '*.jar' | Where-Object Extension -eq '.jar')
if ($jars.Count -ne 1) { throw "Un seul jar attendu dans backend\target, trouvé : $($jars.Count)" }
Copy-Item $jars[0].FullName (Join-Path $ici 'backend\app.jar') -Force

Write-Host "`n=== Archive ===" -ForegroundColor Cyan
# tar.exe est fourni par Windows 10 et 11 ; le .env n'y est jamais : il reste sur le Pi
tar -czf $archive -C $ici docker-compose.yml .env.example LISEZMOI.md backend/Dockerfile backend/app.jar db/01-compte-appli.sh
if ($LASTEXITCODE -ne 0) { throw "Échec de la création de l'archive (code $LASTEXITCODE)" }

$taille = [math]::Round((Get-Item $archive).Length / 1MB, 1)
Write-Host "`nPrêt : $archive ($taille Mo). Étape suivante : l'envoyer sur le Pi (LISEZMOI.md, étape 3)." -ForegroundColor Green
