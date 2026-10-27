$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$previewRoot = $PSScriptRoot
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $previewRoot '../../..'))

function Get-PreviewImageData {
  param([string]$RelativePath, [int]$Width, [int]$Height, [bool]$Jpeg = $false)
  $source = [System.Drawing.Image]::FromFile((Join-Path $projectRoot $RelativePath))
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $stream = New-Object System.IO.MemoryStream
  try {
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($source, 0, 0, $Width, $Height)
    if ($Jpeg) {
      $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
      try {
        $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]75)
        $bitmap.Save($stream, $encoder, $parameters)
      } finally { $parameters.Dispose() }
      $mime = 'image/jpeg'
    } else {
      $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
      $mime = 'image/png'
    }
    return 'data:' + $mime + ';base64,' + [Convert]::ToBase64String($stream.ToArray())
  } finally {
    $stream.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
    $source.Dispose()
  }
}

$fragment = [System.IO.File]::ReadAllText((Join-Path $previewRoot 'laser-animations.template.html'))
$fragment = $fragment.Replace('__VS_BACKGROUND__', (Get-PreviewImageData 'public/assets/game/stages/crystal-gates/boss-background.png' 960 540 $true))
$fragment = $fragment.Replace('__VS_BOSS__', (Get-PreviewImageData 'public/assets/game/stages/crystal-gates/boss.png' 288 192))
$fragment = $fragment.Replace('__VS_SHIP__', (Get-PreviewImageData 'public/assets/game/aircraft/default.png' 132 88))
$target = Join-Path $previewRoot 'laser-animations.html'
[System.IO.File]::WriteAllText($target, $fragment, (New-Object System.Text.UTF8Encoding($false)))
$size = (Get-Item -LiteralPath $target).Length
if ($size -ge 1MB) { throw 'Preview exceeds the inline visualization size limit.' }
Write-Output "Preview built: $size bytes"
$shell = [System.IO.File]::ReadAllText((Join-Path $previewRoot 'standalone-shell.html'))
$standalone = $shell.Replace('__VS_PREVIEW_FRAGMENT__', $fragment)
$standaloneTarget = Join-Path $previewRoot 'preview.html'
[System.IO.File]::WriteAllText($standaloneTarget, $standalone, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Standalone preview built: $standaloneTarget"
