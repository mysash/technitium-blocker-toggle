#Requires -Version 5.1
# Baut dist\chrome und dist\firefox inkl. ZIP-Paketen.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$vc = (Get-Content platform\chrome\manifest.json  -Raw | ConvertFrom-Json).version
$vf = (Get-Content platform\firefox\manifest.json -Raw | ConvertFrom-Json).version
if ($vc -ne $vf) { throw "Versionskonflikt: chrome=$vc firefox=$vf" }

Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
foreach ($p in 'chrome', 'firefox') {
    $out = "dist\$p"
    New-Item $out -ItemType Directory -Force | Out-Null
    Copy-Item src\* $out -Recurse
    Copy-Item "platform\$p\manifest.json" $out
    Compress-Archive -Path "$out\*" -DestinationPath "dist\technitium-blocker-$p-$vc.zip"
}
Write-Host "Version $vc gebaut:"
Get-ChildItem dist\*.zip | ForEach-Object { "  $($_.Name)" }
