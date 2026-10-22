// Gaveta lateral de vidro do painel (so dentro da janela do painel.ps1, que e um WebView2 com fundo transparente).
// Fechada (data-g="e"/"d" no <html>, posto pelo painel.ps1): so a faixa, com hora, uso do Claude e um ponto por
// prazo (vermelho atrasado, amarelo ate 3 dias, verde depois). Aberta (data-g="a"): bloco do Claude/maquina + quadro.
// Pelo titulo o painel.ps1 le a faixa em px da tela, a escala e o estado que a pagina esta mostrando:
// "QUADRO g32x150r0.75sd".
(() => {
  if (!(window.chrome && window.chrome.webview)) return;
  let painel = false;
  try { painel = sessionStorage.getItem('local-painel') === '1'; } catch (e) { /* sem storage */ }
  if (!painel) return;

  const CFG = 'local-gaveta';
  const ESTILOS = [[1, 'Relógio empilhado'], [2, 'Barra de uso'], [4, 'Texto em pé']];
  const cfg = { estilo: 1, largura: 42, vidro: 'l', branco: 15 };   // vidro: d = desfocado, l = transparente limpo
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CFG))); } catch (e) { /* padrao */ }
  const salvar = () => { try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch (e) { /* so nesta aba */ } };
  const raiz = document.documentElement;
  raiz.classList.add('gaveta');
  if (!raiz.dataset.g) raiz.dataset.g = 'd';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => `&#${m.charCodeAt(0)};`);

  const F = 'html.painel.gaveta';
  const css = document.createElement('style');
  css.textContent = `
    html.gaveta{--faixa:42px;--p:0;--cor:#1fa463;color-scheme:light}
    /* vidro claro: a janela desfoca o que esta atras; a pagina deixa leitoso por cima */
    ${F},${F} body,${F} #app{background:transparent!important}
    ${F} body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:rgb(255 255 255 / calc(var(--b) * 1%))}
    ${F}::after{content:"";position:fixed;inset:0;border:1px solid #ffffffcc;border-radius:8px;pointer-events:none;z-index:999}
    ${F}:is([data-g=e],[data-g=d]) :is(#root,.local-topo,.local-claude,.local-canto,.local-cfg){display:none!important}
    ${F}:is([data-g=e],[data-g=d]),${F}:is([data-g=e],[data-g=d]) body{overflow:hidden!important}
    ${F}[data-g=a] .local-faixa{visibility:hidden}

    ${F} .local-topo{background:rgb(255 255 255 / calc(var(--b) * .8%));border-bottom-color:#0000001a;color:#1f2328}
    ${F} .local-topo button{color:#3d444d} ${F} .local-topo button:hover{background:#0000000f;color:#1f2328}
    ${F} .local-visoes{background:#0000000d} ${F} .local-topo .local-visoes button{color:#3d444d}
    ${F} .local-topo .local-visoes button.ativa{background:#ffffffd9;color:#1f2328;box-shadow:0 1px 2px #0000001f}
    ${F} #app ._wrapperBoard_amg4a_35,${F} #app ._wrapper_amg4a_31{margin-top:calc(56px + var(--claude-h, 64px))!important}
    ${F} #app ._header_hsqrn_79{border-bottom-color:#0000001a!important;color:#1f2328}
    ${F} #app .local-qtd{color:#5b6470!important}
    ${F} #app ._card_hsqrn_45 ._wrapper_36a26_43{background:rgb(255 255 255 / calc(15% + var(--b) * 1%))!important;border:1px solid #ffffff99!important;border-radius:10px;margin-bottom:6px}
    ${F} #app ._card_hsqrn_45 ._wrapper_36a26_43:hover{background:#ffffffa6!important}
    ${F} #app ._wrapper_36a26_43 :not([class*="_background"]):not([class*="_background"] *):not([class*="_notification"]){color:#3d444d}
    ${F} #app ._wrapper_36a26_43 [class*="_name_"]{color:#1f2328!important}
    ${F} #app ._addCardButton_hsqrn_8{color:#5b6470!important;background:transparent!important}
    ${F} #app ._addCardButton_hsqrn_8:hover{color:#1f2328!important}

    .local-faixa{position:fixed;top:0;left:0;width:var(--faixa);z-index:200;display:flex;flex-direction:column;align-items:center;gap:7px;
      padding:10px 0 12px;color:#1f2328;cursor:grab;user-select:none;font:600 12px 'Segoe UI Variable','Segoe UI',system-ui,sans-serif;
      text-shadow:0 1px 0 #ffffff99}
    .local-faixa .gp{color:#00000066;font-size:13px;line-height:1}
    .local-faixa .hh{font-size:13px;font-weight:700;line-height:1.05;text-align:center}
    .local-faixa .vert{writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:.04em}
    .local-faixa .pct{color:var(--cor)}
    .local-faixa .sep{width:60%;height:1px;background:#00000026;flex:none}
    .local-faixa .pt{width:8px;height:8px;border-radius:50%;flex:none;box-shadow:0 0 0 1px #ffffffb3}
    .local-faixa small{font-size:10px;color:#3d444d}
    .local-faixa .barra{position:absolute;top:12px;bottom:12px;left:3px;width:3px;border-radius:3px;background:#0000001a;overflow:hidden}
    html[data-g=e] .local-faixa .barra{left:auto;right:3px}
    .local-faixa .barra::after{content:"";position:absolute;left:0;right:0;bottom:0;height:calc(var(--p) * 1%);background:var(--cor)}
    .local-faixa .vert.hora{margin-top:4px;font-size:11px;color:#1f2328}
    .local-anel{--s:min(26px, calc(var(--faixa) - 10px));width:var(--s);height:var(--s);position:relative;display:grid;place-items:center;
      font-size:9px;font-weight:700;flex:none}
    .local-anel::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(var(--cor) calc(var(--p) * 1%),#0000001f 0);
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 3px))}

    .local-claude{position:fixed;top:48px;left:10px;right:10px;z-index:49;padding:10px 14px;border-radius:14px;
      background:rgb(255 255 255 / calc(10% + var(--b) * 1.2%));border:1px solid #ffffff99;color:#1f2328;font:13px 'Segoe UI Variable','Segoe UI',system-ui,sans-serif}
    .local-claude .linha{display:flex;align-items:center;gap:10px}
    .local-claude .local-anel{--s:30px}
    .local-claude .uso{display:flex;align-items:center;gap:8px}
    .local-claude .pc{font-size:24px;font-weight:600;line-height:1;color:var(--cor);font-variant-numeric:tabular-nums}
    .local-claude .dim{color:#5b6470;font-size:11px;line-height:1.35}
    .local-claude .relogio{margin-left:auto;text-align:right;font-size:24px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
    .local-claude .relogio .dim{display:block;margin-top:3px}
    .local-claude .sis{display:flex;justify-content:space-between;margin-top:9px;padding-top:8px;border-top:1px solid #0000001a;
      font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
    .local-claude .sis i{font-style:normal;font-weight:400;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#5b6470;margin-right:2px}
    .local-claude .gasto{margin-top:8px;padding:4px 10px;border-radius:8px;background:#0000000a;color:#3d444d;font-size:11px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    .local-cfg{position:fixed;top:46px;right:10px;z-index:300;width:230px;padding:12px;border-radius:12px;background:#fffffff2;
      border:1px solid #0000001a;color:#1f2328;box-shadow:0 8px 30px #0003;font:13px 'Segoe UI',system-ui,sans-serif;letter-spacing:0}
    .local-cfg[hidden]{display:none}
    .local-cfg b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 6px}
    .local-cfg label{display:flex;align-items:center;gap:6px;padding:2px 0;cursor:pointer;font-weight:400}
    .local-cfg input[type=range]{width:100%}
    ${F} .local-canto{right:2px!important}
    ${F} .local-canto.esq{right:auto!important;left:2px;transform:scaleX(-1);cursor:nesw-resize}`;
  document.head.appendChild(css);

  const faixa = document.createElement('div');
  faixa.className = 'local-faixa';
  faixa.title = 'Passe o mouse para abrir · arraste para mover';
  const bloco = document.createElement('div');
  bloco.className = 'local-claude';

  let claude = null;
  let pontos = [];
  function desenhar() {
    raiz.style.setProperty('--faixa', `${cfg.largura}px`);
    raiz.style.setProperty('--b', cfg.branco);
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const p = claude ? claude.pct : null;
    raiz.style.setProperty('--p', p ?? 0);
    // mesma regua do widget do Rainmeter: amarelo a partir de 80, vermelho a partir de 95 ou se vai estourar antes do reset
    raiz.style.setProperty('--cor', p == null ? '#9aa1ab' : (claude.estoura || p >= 95) ? '#d63046' : p >= 80 ? '#e0a800' : '#1fa463');
    const pt = pontos.slice(0, 10).map((c) => `<i class="pt" style="background:${c};color:${c}"></i>`).join('')
      + (pontos.length > 10 ? `<small>+${pontos.length - 10}</small>` : '');
    const n = esc(p ?? '–');
    const html = {
      1: `<span class="gp">⠿</span><b class="hh">${hh}<br>${mm}</b><i class="local-anel">${n}</i><i class="sep"></i>${pt}`,
      2: `<i class="barra"></i><span class="gp">⠿</span>${pt}<span class="vert hora">${hh}:${mm}</span>`,
      4: `<span class="gp">⠿</span><span class="vert">${hh}:${mm}</span><span class="vert pct">${n}%</span><i class="sep"></i>${pt}`,
    }[cfg.estilo] || '';
    if (faixa.innerHTML !== html) faixa.innerHTML = html;
    const dia = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '');
    const c = claude || {};
    const sis = [['CPU', c.cpu != null ? `${c.cpu}%` : null], ['RAM', c.ramTexto], ['GPU', c.gpuTexto], ['Disco', c.discoTexto]];
    bloco.innerHTML = `<div class="linha"><i class="local-anel"></i>
      <div class="uso"><span class="pc">${n}%</span><span class="dim">Claude · semana ${esc(c.pctSemana ?? '–')}%<br>reset ${esc(c.resetTexto || '–')} · ${esc(c.ritmo || '')}</span></div>
      <div class="relogio">${hh}:${mm}<span class="dim">${esc(dia)}</span></div></div>
      <div class="sis">${sis.map(([k, v]) => `<span><i>${k}</i> ${esc(v ?? '–')}</span>`).join('')}</div>
      ${c.faixaTexto ? `<div class="gasto">${esc(c.faixaTexto)}</div>` : ''}`;
    bloco.title = c.detalhe || '';
    if (bloco.offsetHeight) raiz.style.setProperty('--claude-h', `${bloco.offsetHeight}px`); // quadro logo abaixo; fechada mede 0
    titulo();
  }
  // cursor num campo de texto: o painel.ps1 nao fecha a gaveta enquanto ela estiver em foco
  const digitando = () => { const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); };
  // o Planka troca o titulo sozinho, entao reafirma
  function titulo() {
    const r = window.devicePixelRatio || 1;
    const h = Math.round(faixa.offsetHeight * r);
    const t = `QUADRO g${Math.round(cfg.largura * r)}x${h}r${r.toFixed(2)}s${raiz.dataset.g || ''}v${cfg.vidro}k${digitando() ? 1 : 0}`;
    if (h && document.title !== t) document.title = t;
  }
  setInterval(titulo, 300);

  async function lerClaude() {
    try { claude = await (await fetch('http://localhost:3001/claude.json')).json(); } catch (e) { claude = null; }
    desenhar();
  }
  async function lerPontos() {
    const m = location.pathname.match(/\/boards\/(\d+)/);
    const tk = decodeURIComponent((document.cookie.match(/(?:^|; )accessToken=([^;]*)/) || [])[1] || '');
    if (!m || !tk) return;
    try {
      const r = await fetch(`${window.BASE_PATH || ''}/api/boards/${m[1]}`, { headers: { Authorization: `Bearer ${tk}` } });
      if (!r.ok) return;
      const { included } = await r.json();
      const ativas = new Set(included.lists.filter((l) => l.type === 'active').map((l) => l.id));
      const agora = Date.now();
      const breve = agora + 3 * 864e5;
      pontos = included.cards.filter((c) => c.dueDate && !c.isDueCompleted && ativas.has(c.listId))
        .map((c) => new Date(c.dueDate).getTime()).sort((a, b) => a - b)
        .map((t) => (t < agora ? '#d63046' : t <= breve ? '#e0a800' : '#1fa463'));
      desenhar();
    } catch (e) { /* sem sessao: tenta de novo no proximo ciclo */ }
  }

  function montarConfig(topo) {
    const bt = document.createElement('button');
    bt.textContent = '⚙';
    bt.title = 'Configurar a gaveta';
    topo.insertBefore(bt, topo.querySelector(':scope > button'));
    const caixa = document.createElement('div');
    caixa.className = 'local-cfg';
    caixa.hidden = true;
    caixa.innerHTML = `<b>Faixa fechada</b>${ESTILOS.map(([v, r]) => `<label><input type="radio" name="g-estilo" value="${v}"> ${r}</label>`).join('')}
      <b style="margin-top:10px">Largura da faixa: <span class="g-lv"></span></b><input type="range" class="g-larg" min="22" max="56" step="2">
      <b style="margin-top:10px">Vidro</b><label><input type="radio" name="g-vidro" value="l"> Transparente (fundo nítido)</label><label><input type="radio" name="g-vidro" value="d"> Desfocado</label>
      <b style="margin-top:10px">Opacidade do fundo: <span class="g-bv"></span></b><input type="range" class="g-branco" min="0" max="100" step="5">`;
    const largura = caixa.querySelector('.g-larg');
    const branco = caixa.querySelector('.g-branco');
    const marcar = () => {
      caixa.querySelectorAll('input[name=g-estilo]').forEach((r) => { r.checked = +r.value === cfg.estilo; });
      caixa.querySelectorAll('input[name=g-vidro]').forEach((r) => { r.checked = r.value === cfg.vidro; });
      largura.value = cfg.largura;
      branco.value = cfg.branco;
      caixa.querySelector('.g-lv').textContent = `${cfg.largura}px`;
      caixa.querySelector('.g-bv').textContent = `${cfg.branco}%`;
    };
    branco.addEventListener('input', () => { cfg.branco = +branco.value; marcar(); desenhar(); salvar(); });
    caixa.addEventListener('change', (e) => {
      if (e.target.name === 'g-estilo') cfg.estilo = +e.target.value;
      if (e.target.name === 'g-vidro') cfg.vidro = e.target.value;
      salvar(); desenhar();
    });
    largura.addEventListener('input', () => { cfg.largura = +largura.value; marcar(); desenhar(); salvar(); });
    bt.addEventListener('click', (e) => { e.stopPropagation(); marcar(); caixa.hidden = !caixa.hidden; });
    document.addEventListener('pointerdown', (e) => { if (!caixa.contains(e.target) && e.target !== bt) caixa.hidden = true; });
    document.body.appendChild(caixa);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(faixa);
    document.body.appendChild(bloco);
    const canto = document.createElement('div'); // segunda alca: com a gaveta na borda direita, cresce para a esquerda
    canto.className = 'local-canto esq';
    canto.title = 'Arrastar para redimensionar';
    document.body.appendChild(canto);
    const topo = document.querySelector('.local-topo');
    if (topo) montarConfig(topo);
    desenhar();
    lerClaude(); lerPontos();
    setInterval(lerClaude, 3000);
    setInterval(lerPontos, 60000);
  });
})();
