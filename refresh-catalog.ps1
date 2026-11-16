param(
    [Parameter(Mandatory)][string]$Cache,
    [Parameter(Mandatory)][string]$Model,
    [Parameter(Mandatory)][string]$Tokenizer
)

$ErrorActionPreference = 'Stop'
$cacheDirectory = [IO.Directory]::CreateDirectory($Cache).FullName
$release = Invoke-RestMethod 'https://api.github.com/repos/cedya77/anime-offline-database/releases/latest' -TimeoutSec 30
$archive = $release.assets | Where-Object name -eq 'anime-offline-database-minified.json' | Select-Object -First 1
if (-not $archive) { throw 'The upstream release does not have the catalogue asset.' }
$snapshot = Join-Path $cacheDirectory ($release.tag_name + '-upstream.json')
$metadata = Join-Path $cacheDirectory 'kitsu-metadata.json'
$continuations = Join-Path $cacheDirectory 'kitsu-directed.json'
$catalog = Join-Path $cacheDirectory 'anime-catalog-3.json'
$stories = Join-Path $cacheDirectory 'anime-story-3.json'

if (-not (Test-Path -LiteralPath $snapshot)) {
    $pending = $snapshot + '.download'
    curl.exe -fLsS --retry 2 --max-time 150 -o $pending $archive.browser_download_url
    if ($LASTEXITCODE -ne 0 -or (Get-Item -LiteralPath $pending).Length -ne $archive.size) {
        throw 'The upstream catalogue download is incomplete.'
    }
    Move-Item -LiteralPath $pending -Destination $snapshot
}

node (Join-Path $PSScriptRoot 'fetch-catalog-metadata.cjs') $snapshot $cacheDirectory
if ($LASTEXITCODE -ne 0) { throw 'Could not refresh Kitsu metadata.' }
node (Join-Path $PSScriptRoot 'build-catalog.cjs') $snapshot $catalog $metadata
if ($LASTEXITCODE -ne 0) { throw 'Could not build the catalogue.' }
node (Join-Path $PSScriptRoot 'fetch-continuations.cjs') $catalog $continuations 35
if ($LASTEXITCODE -ne 0) { throw 'Could not check continuations.' }
node (Join-Path $PSScriptRoot 'build-catalog.cjs') $snapshot $catalog $metadata $continuations
if ($LASTEXITCODE -ne 0) { throw 'Could not build the catalogue with continuations.' }
python (Join-Path $PSScriptRoot 'build-story-index.py') $catalog $metadata $Tokenizer $Model $stories
if ($LASTEXITCODE -ne 0) { throw 'Could not build the story index.' }
Get-Item -LiteralPath $catalog,$stories
