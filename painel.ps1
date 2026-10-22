# Painel de um quadro do Planka como gaveta lateral de vidro, sempre por cima das janelas.
# Janela propria (WinForms + WebView2, o motor do Edge) com fundo transparente e desfoque do Windows por
# SetWindowCompositionAttribute (acrylic): funciona sem foco, ao contrario do backdrop do Win11, que fica cinza.
# Fechada: a janela vira so a faixa na borda. Mouse 250 ms em cima abre; 500 ms fora fecha.
# A pagina (local-gaveta.js) informa a faixa pelo titulo "QUADRO g42x212r0.75sd" (px da tela, escala, estado
# que ela esta mostrando) e recebe o estado por data-g no <html>: e/d = faixa naquela borda, a = aberta.
# Mover: arrastar a faixa (ou o titulo QUADRO aberta); solta perto da borda esquerda/direita de qualquer monitor.
# Redimensionar aberta: cantos de baixo. Posicao em painel-posicao.txt: lado,borda,y,largura,altura (px fisicos).
param(
  [string]$url = 'http://localhost:3000/?painel',
  [string]$perfil = "$env:LOCALAPPDATA\PlankaPainel\webview2",
  [string]$posicao = "$env:LOCALAPPDATA\PlankaLocal\painel-posicao.txt",
  [string]$nome = 'QUADRO',
  [int]$y = 120
)
# uma gaveta de cada nome por vez (atalho do menu Iniciar clicado com ela ja aberta): a segunda sai calada
$trava = New-Object System.Threading.Mutex($false, "Local\gaveta-$nome")
if (-not $trava.WaitOne(0)) { exit }
$dll    = "$env:LOCALAPPDATA\PlankaLocal\webview2"   # SDK do WebView2 (nuget Microsoft.Web.WebView2 1.0.3240.44)
$zoom = 0.75   # mesmo tamanho do painel antigo no Edge
$tinta = 0x01f5f3f0   # cor por tras da pagina, AABBGGRR; o branco do vidro quem poe e a pagina (engrenagem > Opacidade do fundo)
$topoLivre = 56; $baseLivre = 84   # aberta, nao cobre a barra do Seelen nem o dock

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -Path "$dll\Microsoft.Web.WebView2.Core.dll"
Add-Type -Path "$dll\Microsoft.Web.WebView2.WinForms.dll"
Add-Type -ReferencedAssemblies System.Windows.Forms, System.Drawing @'
using System; using System.Runtime.InteropServices; using System.Windows.Forms;
public class Gaveta : Form {
  protected override bool ShowWithoutActivation { get { return true; } }
  protected override CreateParams CreateParams { get { var c = base.CreateParams; c.ExStyle |= 0x80 | 0x8; return c; } }   // TOOLWINDOW (fora do Alt+Tab) | TOPMOST. Vidro por janela em camada nao serve aqui: WebView2 nao desenha em janela em camada (layered)
}
public static class P {
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] public struct PT { public int X, Y; }
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int k);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out PT p);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint c);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h, System.Text.StringBuilder s, int n);
  [StructLayout(LayoutKind.Sequential)] struct R { public int L, T, Rt, B; }
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out R r);
  // alguma janela visivel acima desta na ordem (GW_HWNDPREV) encosta nela?
  public static bool Coberta(IntPtr h) {
    R eu; GetWindowRect(h, out eu);
    for (IntPtr p = GetWindow(h, 3); p != IntPtr.Zero; p = GetWindow(p, 3)) {
      if (!IsWindowVisible(p)) continue;
      var cls = new System.Text.StringBuilder(128); GetClassName(p, cls, 128);
      if (cls.ToString().Contains("QuickLook")) continue;   // preview de foto/PDF aberto pela gaveta: pode ficar na frente
      R r; GetWindowRect(p, out r);
      if (r.L < eu.Rt && r.Rt > eu.L && r.T < eu.B && r.B > eu.T) return true;
    }
    return false;
  }
  [StructLayout(LayoutKind.Sequential)] struct A { public int estado, flags, cor, anim; }
  [StructLayout(LayoutKind.Sequential)] struct W { public int attr; public IntPtr dados; public int tam; }
  [DllImport("user32.dll")] static extern int SetWindowCompositionAttribute(IntPtr h, ref W w);
  [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int a, ref int v, int s);
  public static void Vidro(IntPtr h, int estado, int tinta) {   // estado 4 = acrilico (desfocado), 2 = transparente sem desfoque
    A a = new A { estado = estado, flags = 2, cor = tinta };
    int n = Marshal.SizeOf(a); IntPtr p = Marshal.AllocHGlobal(n); Marshal.StructureToPtr(a, p, false);
    W w = new W { attr = 19, dados = p, tam = n }; SetWindowCompositionAttribute(h, ref w); Marshal.FreeHGlobal(p);
    int v = 2; DwmSetWindowAttribute(h, 33, ref v, 4);   // cantos redondos
  }
}
'@
[P]::SetProcessDPIAware() | Out-Null
$TOPO = [IntPtr]::new(-1)   # HWND_TOPMOST

# estado: lado (e/d), borda (x da borda da tela), y (topo), W/H (aberta), faixa fL x fA e escala r (vem da pagina)
$g = @{ lado = 'd'; borda = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Right; y = $y; W = 420; H = 760; fL = 32; fA = 150; r = $zoom; vidro = 'l'; k = '0'; aberta = $false }
if (Test-Path $posicao) {
  $v = (Get-Content $posicao) -split ','
  if ($v[0] -in 'e', 'd') { $g.lado = $v[0]; $g.borda, $g.y, $g.W, $g.H = $v[1..4] | ForEach-Object { [int]$_ } }
}
$tela = { # monitor cuja borda e a da gaveta (se o monitor sumiu, volta pra direita do principal)
  $s = [System.Windows.Forms.Screen]::AllScreens | Where-Object { ($g.lado -eq 'd' -and $_.Bounds.Right -eq $g.borda) -or ($g.lado -eq 'e' -and $_.Bounds.Left -eq $g.borda) } | Select-Object -First 1
  if (-not $s) { $s = [System.Windows.Forms.Screen]::PrimaryScreen; $g.lado = 'd'; $g.borda = $s.Bounds.Right }
  $s.Bounds
}
$visivel = {
  $b = & $tela
  if ($g.aberta) { $vw = $g.W; $vh = $g.H; $vy = [Math]::Max($b.Top + $topoLivre, [Math]::Min($g.y, $b.Bottom - $baseLivre - $vh)) }
  else { $vw = $g.fL; $vh = $g.fA; $vy = [Math]::Max($b.Top, [Math]::Min($g.y, $b.Bottom - $vh)) }
  $vx = if ($g.lado -eq 'd') { $g.borda - $vw } else { $g.borda }
  @{ X = $vx; Y = $vy; W = $vw; H = $vh }
}
$esperado = { if ($g.aberta) { 'a' } else { $g.lado } }
$estado = { if ($w.CoreWebView2) { $w.CoreWebView2.ExecuteScriptAsync("document.documentElement.dataset.g='$(& $esperado)'") | Out-Null } }
$aplicar = {   # abrindo: a pagina troca antes de a janela crescer; fechando: depois de encolher
  $v = & $visivel
  if ($g.aberta) { & $estado }
  # aberta sobe para o topo; recolhida nao mexe na ordem (NOZORDER): senao passa a frente da outra gaveta aberta e pisca
  [P]::SetWindowPos($f.Handle, $TOPO, $v.X, $v.Y, $v.W, $v.H, $(if ($g.aberta) { 0x10 } else { 0x14 })) | Out-Null   # NOACTIVATE
  if (-not $g.aberta) { & $estado }
}
$dentro = { param($c, $v) $c.X -ge $v.X -and $c.X -lt $v.X + $v.W -and $c.Y -ge $v.Y -and $c.Y -lt $v.Y + $v.H }
$guardar = { Set-Content $posicao "$($g.lado),$($g.borda),$($g.y),$($g.W),$($g.H)" }

# espera o Planka subir (no login ele sobe junto)
$ultimoSocorro = [DateTime]::MinValue; $recarregarEm = $null
# Planka (3000) ou repasse (3001) fora do ar: a gaveta fica vazia. Sobe de novo pelo iniciar.ps1 (pula o que ja esta no ar),
# via WMI para nao morrer junto com quem chamou. No maximo uma vez a cada 2 min.
$noAr = { param($porta) $c = New-Object Net.Sockets.TcpClient; try { $c.ConnectAsync('127.0.0.1', $porta).Wait(150) -and $c.Connected } catch { $false } finally { $c.Close() } }
$socorro = {
  if (([DateTime]::Now - $ultimoSocorro).TotalMinutes -lt 2) { return }
  if ((& $noAr 3000) -and (& $noAr 3001)) { return }
  $script:ultimoSocorro = [DateTime]::Now; $script:recarregarEm = [DateTime]::Now.AddSeconds(25)
  $ini = "$env:LOCALAPPDATA\PlankaLocal\iniciar.ps1"
  Invoke-CimMethod Win32_Process -MethodName Create -Arguments @{ CommandLine = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ini`"" } | Out-Null
}
for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest http://localhost:3000/ -UseBasicParsing -TimeoutSec 3 | Out-Null; break } catch { if ($i -eq 10) { & $socorro }; Start-Sleep 2 } }

$f = New-Object Gaveta
$f.FormBorderStyle = 'None'; $f.BackColor = [System.Drawing.Color]::Black; $f.StartPosition = 'Manual'; $f.Text = $nome
$w = New-Object Microsoft.Web.WebView2.WinForms.WebView2
$w.Dock = 'Fill'; $w.DefaultBackgroundColor = [System.Drawing.Color]::Transparent
$w.CreationProperties = New-Object Microsoft.Web.WebView2.WinForms.CoreWebView2CreationProperties
$w.CreationProperties.UserDataFolder = $perfil
$f.Controls.Add($w)
$f.Add_HandleCreated({ [P]::Vidro($f.Handle, 2, $tinta) })
$w.Add_CoreWebView2InitializationCompleted({
  $w.ZoomFactor = $zoom
  # "Abrir no Planka" e links externos vao para o navegador padrao, nao para uma janela solta do WebView2
  $w.CoreWebView2.add_NewWindowRequested({ param($s, $a) $a.Handled = $true; Start-Process $a.Uri })
  $w.CoreWebView2.Navigate($url)
})
$f.Add_Shown({ & $aplicar; $w.EnsureCoreWebView2Async($null) | Out-Null })

$antes = $false; $desde = $null; $arr = $null; $tique = 0
$t = New-Object System.Windows.Forms.Timer
$t.Interval = 15
# ponytail: polling do mouse a cada 15 ms; hook de eventos se algum dia pesar
$t.Add_Tick({
  $agora = ([P]::GetAsyncKeyState(1) -band 0x8000) -ne 0
  $c = New-Object P+PT; [P]::GetCursorPos([ref]$c) | Out-Null
  $v = & $visivel; $e = $g.r

  if ($arr) {   # arrastando: segue o cursor ate soltar
    if (-not $agora) { & $guardar; $script:arr = $null; $script:desde = $null; return }
    $dx = $c.X - $arr.c.X; $dy = $c.Y - $arr.c.Y
    if ($arr.modo -eq 'mover') {
      $s = [System.Windows.Forms.Screen]::FromPoint([System.Drawing.Point]::new($c.X, $c.Y)).Bounds
      $g.lado = if ($c.X -lt $s.Left + $s.Width / 2) { 'e' } else { 'd' }
      $g.borda = if ($g.lado -eq 'e') { $s.Left } else { $s.Right }
      $g.y = $arr.vy + $dy
    } else {
      $cresce = if ($arr.modo -eq 'direita') { $dx } else { -$dx }
      if (($arr.modo -eq 'direita') -eq ($g.lado -eq 'd')) { $cresce = 0 }   # o lado colado na borda nao estica
      $g.W = [Math]::Max(260, $arr.W + $cresce); $g.H = [Math]::Max(260, $arr.H + $dy)
    }
    & $aplicar; return
  }

  if ($agora -and -not $antes -and (& $dentro $c $v)) {
    $lx = $c.X - $v.X; $ly = $c.Y - $v.Y; $modo = ''
    if (-not $g.aberta -or ($ly -lt 42 * $e -and $lx -lt 125 * $e)) { $modo = 'mover' }   # faixa inteira, ou titulo QUADRO
    elseif ($ly -gt $v.H - 18 * $e -and $lx -gt $v.W - 18 * $e) { $modo = 'direita' }
    elseif ($ly -gt $v.H - 18 * $e -and $lx -lt 18 * $e) { $modo = 'esquerda' }
    if ($modo) { $script:arr = @{ modo = $modo; c = $c; vy = $v.Y; W = $g.W; H = $g.H } }
  }
  $script:antes = $agora

  # hover: fechada abre com 250 ms em cima; aberta fecha com 500 ms fora (nunca com o botao apertado)
  $em = & $dentro $c $v
  # aberta, em foco e com o cursor num campo de texto (k1 no titulo): nao fecha so porque o mouse saiu
  $digitando = $g.aberta -and $g.k -eq '1' -and [P]::GetForegroundWindow() -eq $f.Handle
  if ($agora -or ($em -ne $g.aberta -and -not $digitando)) {
    if ($agora) { $script:desde = $null }
    elseif (-not $desde) { $script:desde = [DateTime]::Now }
    elseif (([DateTime]::Now - $desde).TotalMilliseconds -ge $(if ($g.aberta) { 500 } else { 250 })) { $g.aberta = -not $g.aberta; & $aplicar; $script:desde = $null }
  } else { $script:desde = $null }

  # aberta fica por cima de tudo, sempre: outra janela "sempre por cima" passou na frente -> volta na hora
  if ($g.aberta -and [P]::Coberta($f.Handle)) { [P]::SetWindowPos($f.Handle, $TOPO, 0, 0, 0, 0, 0x13) | Out-Null }
  if (++$script:tique % 2000 -eq 0) { & $socorro }   # ~30 s
  if ($recarregarEm -and [DateTime]::Now -gt $recarregarEm -and $w.CoreWebView2) { $script:recarregarEm = $null; $w.CoreWebView2.Reload() }
  if ($tique % 27 -ne 0) { return }   # ~400 ms: tamanho da faixa, estado da pagina, sempre por cima
  if ($w.CoreWebView2 -and $w.CoreWebView2.DocumentTitle -match 'g(\d+)x(\d+)r([\d.]+)s([aed]?)v([dl])(?:k([01]))?') {
    $g.k = if ($Matches[6]) { $Matches[6] } else { '0' }
    $novo = [int]$Matches[1] -ne $g.fL -or [int]$Matches[2] -ne $g.fA
    $g.fL = [int]$Matches[1]; $g.fA = [int]$Matches[2]; $g.r = [double]$Matches[3]
    if ($Matches[4] -ne (& $esperado)) { & $estado }   # pagina recarregou ou perdeu o estado
    if ($Matches[5] -ne $g.vidro) { $g.vidro = $Matches[5]; [P]::Vidro($f.Handle, $(if ($g.vidro -eq 'd') { 4 } else { 2 }), $tinta) }   # engrenagem > Vidro
    if ($novo) { & $aplicar }
  }
  if ([P]::IsIconic($f.Handle)) { [P]::ShowWindow($f.Handle, 4) | Out-Null; & $aplicar }   # Win+D / minimizar: volta sem roubar foco
  # aberta: reafirma o topo. Recolhida: so recoloca o "sempre por cima" se alguem tirou (WS_EX_TOPMOST = 8)
  # aberta: quem traz para a frente e o Coberta, a cada tique (respeita o QuickLook)
  if (-not ([P]::GetWindowLong($f.Handle, -20) -band 8)) { [P]::SetWindowPos($f.Handle, $TOPO, 0, 0, 0, 0, 0x13) | Out-Null }   # NOACTIVATE|NOMOVE|NOSIZE
})
$t.Start()
[System.Windows.Forms.Application]::Run($f)
