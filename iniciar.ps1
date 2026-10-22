# Sobe o Planka local no login: Postgres portatil (porta 5433) + calendario/repasse (3001) + servidor Node (porta 3000).
# Pula o que ja estiver no ar: as gavetas (painel.ps1) chamam este script de novo quando o 3000 ou o 3001 cai.
$b = "$env:LOCALAPPDATA\PlankaLocal"
$noAr = { param($porta) $c = New-Object Net.Sockets.TcpClient; try { $c.ConnectAsync('127.0.0.1', $porta).Wait(500) -and $c.Connected } catch { $false } finally { $c.Close() } }
& "$b\pgsql\bin\pg_ctl.exe" -D "$b\pgdata" status *> $null
if ($LASTEXITCODE -ne 0) { Start-Process "$b\pgsql\bin\pg_ctl.exe" -ArgumentList '-D', "`"$b\pgdata`"", '-l', "`"$b\pg.log`"", '-o', '"-c listen_addresses=localhost -p 5433"', 'start' -WindowStyle Hidden; Start-Sleep 5 }
if (-not (& $noAr 3001)) { Start-Process node -ArgumentList "`"$b\calendario.js`"" -WindowStyle Hidden }
if (& $noAr 3000) { exit }
Set-Location "$b\planka"
$env:NODE_ENV = 'production'; node app.js --prod *> "$b\planka.log"   # direto, sem nodemon (que vigia arquivos)
