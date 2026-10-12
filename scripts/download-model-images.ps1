# Downloads only the researched manufacturer product photos. Does not change catalogue records.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$modelData = Get-Content -LiteralPath (Join-Path $taskRoot 'src/data/researchedProducts.ts') -Raw
$photoEntries = [regex]::Matches($modelData, "image: '([^']+)', sourceUrl: '([^']+)'")
$assetDirectory = Join-Path $taskRoot 'public/assets/products/models'
New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
Add-Type -AssemblyName System.Drawing
foreach ($entry in $photoEntries) {
  $destination = Join-Path (Join-Path $taskRoot 'public') $entry.Groups[1].Value.TrimStart('/')
  $sourcePage = $entry.Groups[2].Value
  if (Test-Path -LiteralPath $destination) { continue }
  try { $response = Invoke-WebRequest -Uri $sourcePage -TimeoutSec 40 } catch { throw "Manufacturer page unavailable: $sourcePage" }
  $ogImage = [regex]::Match($response.Content, '<meta[^>]+property="og:image"[^>]+content="([^"]+)"')
  if (-not $ogImage.Success) { throw "No manufacturer image found for $sourcePage" }
  $imageUrl = [System.Net.WebUtility]::HtmlDecode($ogImage.Groups[1].Value)
  $download = Invoke-WebRequest -Uri $imageUrl -TimeoutSec 40
  $memory = [System.IO.MemoryStream]::new([byte[]]$download.Content)
  $original = [System.Drawing.Image]::FromStream($memory)
  $scale = [Math]::Min(1.0, 1100.0 / [Math]::Max($original.Width, $original.Height))
  $bitmap = [System.Drawing.Bitmap]::new([int]($original.Width * $scale), [int]($original.Height * $scale))
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($original, 0, 0, $bitmap.Width, $bitmap.Height)
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
  $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
  $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]86)
  $bitmap.Save($destination, $codec, $parameters)
  $graphics.Dispose(); $bitmap.Dispose(); $original.Dispose(); $memory.Dispose(); $parameters.Dispose()
  Write-Output "Downloaded $([System.IO.Path]::GetFileName($destination)) from $imageUrl"
}
