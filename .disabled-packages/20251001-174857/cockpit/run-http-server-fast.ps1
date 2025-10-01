# Script rápido para arrancar http-server con npx en Windows
$ErrorActionPreference = 'Stop'
$dist = (Resolve-Path '.dev/cockpit/dist').Path
$ports = @(5173,5500,8080)
${bindHost} = '127.0.0.1'
foreach($p in $ports){
  Write-Host "Intentando puerto $p..."
  try{
    $proc = Start-Process -PassThru -FilePath 'npx' -ArgumentList @('--yes','http-server',$dist,'-p',$p,'-a',$host,'-c','-1') -WindowStyle Hidden
  } catch {
    Write-Host "Start-Process falló para npx: $_" -ForegroundColor Yellow
    continue
  }
  Start-Sleep -Milliseconds 700
  try{
  $tcp = New-Object System.Net.Sockets.TcpClient
  $tcp.Connect(${bindHost},[int]$p)
  $tcp.Close()
  Write-Host "Servidor estático iniciado: http://${bindHost}:${p}/ (PID $($proc.Id))" -ForegroundColor Green
    exit 0
  } catch {
  Write-Host "Puerto $p no responde, matando proceso $($proc.Id)" -ForegroundColor Yellow
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    continue
  }
}
Write-Error 'No se pudo iniciar el servidor en ningún puerto probado'
exit 1
