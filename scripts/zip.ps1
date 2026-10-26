param([Parameter(Mandatory=$true)][string]$Source,[Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sourcePath=[IO.Path]::GetFullPath($Source).TrimEnd([IO.Path]::DirectorySeparatorChar)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Destination)))|Out-Null
if(Test-Path -LiteralPath $Destination){Remove-Item -LiteralPath $Destination}
[IO.Compression.ZipFile]::CreateFromDirectory($sourcePath,[IO.Path]::GetFullPath($Destination),[IO.Compression.CompressionLevel]::Optimal,$false)
