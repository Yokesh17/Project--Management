Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap(128, 128)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Background
$bg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(0, 122, 204))
$g.FillRectangle($bg, 0, 0, 128, 128)

# White kanban columns
$white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$g.FillRectangle($white, 14, 24, 28, 80)
$g.FillRectangle($white, 50, 24, 28, 80)
$g.FillRectangle($white, 86, 24, 28, 80)

# Colored task cards
$blue = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(41, 182, 246))
$green = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(102, 187, 106))
$orange = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 167, 38))

$g.FillRectangle($blue,   18, 30, 20, 10)
$g.FillRectangle($blue,   18, 44, 20, 10)
$g.FillRectangle($green,  54, 30, 20, 10)
$g.FillRectangle($orange, 90, 30, 20, 10)

$g.Dispose()
$bmp.Save("media\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Icon created at media\icon.png"
