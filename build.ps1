#Requires -Version 5.1
# Builds dist\chrome and dist\firefox including the ZIP packages.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Compress-Archive and ZipFile::CreateFromDirectory both write backslashes into
# the entry names on Windows PowerShell 5.1. The ZIP spec mandates forward
# slashes and the extension stores reject packages that use backslashes, so the
# entries are added one by one with normalised names.
function New-ExtensionZip {
    param([string]$SourceDir, [string]$ZipPath)

    Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
    $root = (Resolve-Path $SourceDir).Path.TrimEnd('\') + '\'
    $zip = [IO.Compression.ZipFile]::Open($ZipPath, 'Create')
    try {
        foreach ($file in Get-ChildItem $SourceDir -Recurse -File) {
            $entry = $file.FullName.Substring($root.Length).Replace('\', '/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip, $file.FullName, $entry) | Out-Null
        }
    } finally {
        $zip.Dispose()
    }
}

$vc = (Get-Content platform\chrome\manifest.json  -Raw | ConvertFrom-Json).version
$vf = (Get-Content platform\firefox\manifest.json -Raw | ConvertFrom-Json).version
if ($vc -ne $vf) { throw "Version mismatch: chrome=$vc firefox=$vf" }

Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
foreach ($p in 'chrome', 'firefox') {
    $out = "dist\$p"
    New-Item $out -ItemType Directory -Force | Out-Null
    Copy-Item src\* $out -Recurse
    Copy-Item "platform\$p\manifest.json" $out
    New-ExtensionZip -SourceDir $out -ZipPath "dist\technitium-blocker-$p-$vc.zip"
}
Write-Host "Built version ${vc}:"
Get-ChildItem dist\*.zip | ForEach-Object { "  $($_.Name)" }
