# Roda os cartoes recorrentes quando o Postgres do Planka estiver de pe (espera ate 5 min).
$b = "$env:LOCALAPPDATA\PlankaLocal"
for ($i = 0; $i -lt 60; $i++) { if ((Test-NetConnection localhost -Port 5433 -WarningAction SilentlyContinue).TcpTestSucceeded) { break }; Start-Sleep 5 }
node "$b\recorrentes.js" *>> "$b\recorrentes.log"
