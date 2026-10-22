// local: modo "empilhado" do quadro — cada lista vira uma secao que abre/fecha (▼/▶), uma embaixo da outra,
// cartoes em linhas. Cor por assunto. Botao no canto alterna colunas/empilhado; escolhas ficam no navegador.
// Classes com hash do bundle v2.2.1: mudam a cada versao do Planka.
(() => {
  const E = 'html.empilhado #app';
  const L = '._innerWrapper_hsqrn_131';
  const CORES = ['#4a90d9', '#2fa36b', '#e0a030', '#d9534f', '#9b59b6', '#1abc9c', '#e67e22', '#5c7cfa'];

  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem storage: so nesta aba */ } };
  const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch (e) { return padrao; } };

  const style = document.createElement('style');
  style.textContent = `
    ${E} ._lists_11uup_41{display:flex!important;flex-direction:column;gap:8px;width:calc(100vw - 40px);max-width:1100px;padding-bottom:80px}
    ${E} ${L}{width:100%!important;margin:0!important}
    ${E} ._outerWrapper_hsqrn_135{max-height:none;border-left:4px solid #4a90d9;border-radius:6px}
    ${E} ._header_hsqrn_79{padding:4px 4px 2px;display:flex;align-items:center}
    ${E} ._headerName_hsqrn_116{font-size:15px;letter-spacing:.3px;text-transform:uppercase;flex:0 1 auto}
    ${E} ._cardsInnerWrapper_hsqrn_51,${E} ._cardsOuterWrapper_hsqrn_74{overflow:visible;max-height:none}
    ${E} ._cardsInnerWrapper_hsqrn_51,${E} ._cardsOuterWrapper_hsqrn_74,${E} ._cardsOuterWrapper_hsqrn_74>div,${E} ._cards_hsqrn_48{width:100%!important;box-sizing:border-box}
    ${E} ._cards_hsqrn_48{min-height:0!important}
    ${E} ._card_hsqrn_45{width:100%!important}
    ${E} ._addCardButtonWrapper_hsqrn_42{width:272px}
    ${CORES.map((c, i) => `${E} ${L}:nth-child(8n+${i + 1}) ._outerWrapper_hsqrn_135{border-left-color:${c}}
    ${E} ${L}:nth-child(8n+${i + 1}) ._headerName_hsqrn_116, ${E} ${L}:nth-child(8n+${i + 1}) .local-seta{color:${c}}`).join('\n')}
    .local-seta{display:none;background:none;border:none;cursor:pointer;font:700 14px system-ui,sans-serif;padding:4px 8px 4px 2px;flex:none}
    html.empilhado .local-seta{display:inline-block}
    .local-qtd{display:none;margin-left:8px;color:#9aa4ad;font:600 12px system-ui,sans-serif}
    html.empilhado .local-qtd{display:inline}
    .local-modo{position:fixed;right:150px;bottom:16px;z-index:9999;background:#3a3f47;color:#fff;border:none;padding:10px 16px;
      border-radius:24px;font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}
    .local-modo:hover{background:#4a505a}`;
  document.head.appendChild(style);

  // visual estilo ClickUp/Todoist: grupo = etiqueta colorida + contagem; tarefa = linha fina com circulo
  // de concluir a esquerda e colunas fixas (etiquetas | progresso | prazo/icones). Sobrepoe o bloco acima.
  const visual = document.createElement('style');
  visual.textContent = `
    ${E} ._lists_11uup_41{max-width:1000px!important;gap:22px!important}
    ${E} ._outerWrapper_hsqrn_135{background:transparent!important;border-left:none!important;padding:0}
    ${E} ._header_hsqrn_79{padding:0 0 6px!important;border-bottom:1px solid #2e333a;margin-bottom:2px}
    ${E} ._headerName_hsqrn_116{font-size:13px!important;font-weight:700;letter-spacing:.5px;padding:3px 10px!important;border-radius:5px;color:#fff!important}
    ${CORES.map((c, i) => `${E} ${L}:nth-child(8n+${i + 1}) ._headerName_hsqrn_116{background:${c}}`).join('\n')}
    ${E} .local-qtd{color:#8b949e!important;font-size:12px}
    ${E} ._cards_hsqrn_48{gap:0!important}
    ${E} ._card_hsqrn_45{margin:0!important}
    ${E} ._card_hsqrn_45 ._wrapper_36a26_43{background:transparent!important;box-shadow:none!important;border-radius:0;border-bottom:1px solid #2a2f36}
    ${E} ._card_hsqrn_45 ._wrapper_36a26_43:hover{background:#262b32!important}
    ${E} ._wrapper_i28lr_90{display:flex;align-items:center;gap:10px;padding:9px 40px 9px 38px!important}
    ${E} ._wrapper_i28lr_90>*{margin:0!important;flex:none}
    ${E} ._wrapper_i28lr_90 ._coverWrapper_i28lr_47{display:none!important}   /* capa grande nao cabe na linha */
    ${E} ._wrapper_i28lr_90 ._name_i28lr_66{order:0;flex:1 1 auto;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    ${E} ._wrapper_i28lr_90 ._labels_i28lr_59{order:1;width:170px;display:flex;justify-content:flex-end;flex-wrap:nowrap;overflow:hidden}
    ${E} ._wrapper_i28lr_90 ._progressRow_kjg3m_31{order:2;width:110px;padding:0!important;align-items:center}
    ${E} ._wrapper_i28lr_90 ._progressWrapper_kjg3m_38{padding:0}
    ${E} ._wrapper_i28lr_90 ._attachments_i28lr_30{order:3;width:150px;display:flex;justify-content:flex-start}
    ${E} .local-concluir{opacity:1!important;left:10px;right:auto!important;top:50%!important;transform:translateY(-50%);width:18px!important;height:18px!important;
      background:transparent!important;border:2px solid #5b636e!important;color:transparent!important;font-size:11px!important;line-height:14px!important}
    ${E} .local-concluir:hover{border-color:#2fa36b!important;background:#2fa36b!important;color:#fff!important}
    ${E} ._actionsButton_36a26_5{top:50%!important;transform:translateY(-50%)}
    ${E} ._addCardButtonWrapper_hsqrn_42{width:auto;padding:0}
    ${E} ._addCardButton_hsqrn_8{background:transparent!important;height:34px;padding-left:36px!important;color:#6b737d!important;justify-content:flex-start}
    ${E} ._addCardButton_hsqrn_8:hover{color:#e8eaed!important}`;
  document.head.appendChild(visual);
  const datas = document.createElement('style');
  datas.textContent = `
    #app [class*="_wrapper_1y12g_17"]{background:#21a147!important;color:#fff!important}
    #app [class*="_wrapperDueSoon_1y12g"]{background:#f2c200!important;color:#1f2328!important}
    #app [class*="_wrapperOverdue_1y12g"]{background:#db2828!important;color:#fff!important}
    #app [class*="_wrapperCompleted_1y12g"]{background:#9aa1ab!important;color:#fff!important}`;
  document.head.appendChild(datas);

  // modo painel (janela fixa na area de trabalho): abre com ?painel na URL e fica valendo nesta aba.
  // Sem cabecalho/menus do Planka, sempre empilhado, barra propria com atualizar e abrir no Planka.
  let painel = false;
  let painelVisao = null;
  try {
    if (/[?&]painel\b/.test(location.search)) {
      sessionStorage.setItem('local-painel', '1');
      localStorage.setItem('local-painel-quadro', location.pathname); // o Edge as vezes reabre a ultima pagina
    }
    painel = sessionStorage.getItem('local-painel') === '1';
  } catch (e) { painel = /[?&]painel\b/.test(location.search); }
  if (painel) {
    // painel sempre no quadro: se cair na tela inicial (Edge restaurou outra pagina), volta pro quadro
    const voltar = () => {
      let q = null;
      try { q = localStorage.getItem('local-painel-quadro'); } catch (e) { /* sem storage */ }
      if (q && location.pathname === '/') location.replace(q);
    };
    voltar();
    window.addEventListener('popstate', voltar);
    const P = 'html.painel #app';
    const PE = 'html.painel.empilhado #app';
    const ps = document.createElement('style');
    ps.textContent = `
      ${P} ._wrapper_1o9kk_5{display:none!important}
      html.painel body,html.painel #app{background:#16181d!important}
      ${P} ._wrapperBoard_amg4a_35,${P} ._wrapper_amg4a_31{margin-top:46px!important}
      html.painel .local-modo,html.painel a[href="http://localhost:3001"]{display:none!important}
      ${PE} ._wrapper_11uup_46{padding-left:12px!important}
      ${PE} ._wrapper_11uup_46,${PE} ._lists_11uup_41{padding-top:6px!important;margin-top:0!important}
      ${PE} ._lists_11uup_41{width:calc(100vw - 36px)!important;max-width:none!important;gap:14px!important;padding-bottom:30px!important}
      html.painel.empilhado,html.painel.empilhado body,${PE} ._wrapper_11uup_46{overflow-x:hidden!important}
      ${PE} ._wrapper_i28lr_90{padding:7px 30px 7px 34px!important;gap:6px}
      ${PE} ._wrapper_i28lr_90 ._progressRow_kjg3m_31,${PE} ._wrapper_i28lr_90 ._attachments_i28lr_30 ._attachmentContent_i28lr_12{display:none!important}
      ${PE} ._wrapper_i28lr_90 ._labels_i28lr_59{width:auto;max-width:170px}
      ${PE} ._wrapper_i28lr_90 ._attachments_i28lr_30{width:auto}
      ${PE} ._wrapper_i28lr_90 ._name_i28lr_66{font-size:13px}
      ${PE} ._addCardButtonWrapper_hsqrn_42{display:none}
      ${PE} ._outerWrapper_hsqrn_135:hover ._addCardButtonWrapper_hsqrn_42{display:block}
      ${P} ._addCardButton_hsqrn_8{height:28px!important}
      .local-topo{position:fixed;top:0;left:0;right:0;height:42px;display:flex;align-items:center;gap:10px;padding:0 14px;background:#16181d;
        z-index:50;border-bottom:1px solid #2a2f36;color:#e8eaed;font:700 15px 'Segoe UI',system-ui,sans-serif;letter-spacing:1px;user-select:none}
      .local-topo .sp{flex:1}
      .local-pega{cursor:move}
      .local-canto{position:fixed;right:2px;bottom:2px;width:14px;height:14px;z-index:60;cursor:nwse-resize;
        background:linear-gradient(135deg,transparent 50%,#b4bac2 50%,#b4bac2 60%,transparent 60%,transparent 75%,#b4bac2 75%,#b4bac2 85%,transparent 85%)}
      .local-topo button{background:none;border:none;color:#9aa4ad;cursor:pointer;font:600 13px system-ui,sans-serif;padding:4px 6px;border-radius:4px}
      .local-topo button:hover{background:#2a2f36;color:#e8eaed}
      /* painel claro (Windows no modo claro); vence o tema escuro do index.ejs pela especificidade html.painel */
      html.painel body,html.painel #app{background:#f4f5f7!important}
      .local-topo{background:#ffffff;color:#1f2328;border-bottom-color:#e3e6ea}
      .local-topo button{color:#5b6470} .local-topo button:hover{background:#eef0f3;color:#1f2328}
      ${P} ._header_hsqrn_79{border-bottom-color:#dfe3e8!important}
      ${P} .local-qtd{color:#6b7280!important}
      ${P} ._card_hsqrn_45 ._wrapper_36a26_43{border-bottom-color:#e6e9ed!important}
      ${P} ._card_hsqrn_45 ._wrapper_36a26_43:hover{background:#e9ecf0!important}
      ${P} ._wrapper_36a26_43 :not([class*="_background"]):not([class*="_background"] *):not([class*="_notification"]){color:#3d444d}
      ${P} ._wrapper_36a26_43 [class*="_name_"]{color:#1f2328!important}
      ${P} .local-concluir{border-color:#9aa1ab!important}
      ${P} ._addCardButton_hsqrn_8{color:#7a828c!important} ${P} ._addCardButton_hsqrn_8:hover{color:#1f2328!important}`;
    document.head.appendChild(ps);
    // seletor de visualizacao na barra (como o do Planka): Secoes = quadro empilhado; Kanban/Grade/Lista = visoes do Planka
    const vs = document.createElement('style');
    vs.textContent = `
      .local-visoes{display:flex;gap:2px;margin-left:14px;background:#eef0f3;border-radius:6px;padding:2px}
      .local-topo .local-visoes button{font:600 12px system-ui,sans-serif;letter-spacing:0;padding:3px 8px;color:#5b6470}
      .local-topo .local-visoes button.ativa{background:#ffffff;color:#1f2328;box-shadow:0 1px 2px rgba(0,0,0,.12)}
      /* grade e lista do Planka no painel claro */
      ${P} ._card_1utaf_45,${P} ._card_1bbow_46,${P} ._segment_1bbow_56{background:#ffffff!important}
      ${P} ._addCardButton_1utaf_5,${P} ._addCardButton_1bbow_5{background:#ffffff!important;color:#7a828c!important}`;
    document.head.appendChild(vs);
    document.documentElement.classList.add('painel');

    const VISOES = [['secoes', '☰ Seções', 'columns'], ['kanban', '▥ Kanban', 'columns'], ['grade', '▦ Grade', 'th'], ['lista', '≡ Lista', 'unordered list']];
    let visao = 'secoes';
    try { visao = localStorage.getItem('local-painel-visao') || 'secoes'; } catch (e) { /* sem storage */ }

    const topo = document.createElement('div');
    topo.className = 'local-topo';
    topo.innerHTML = '<span class="local-pega" title="Arrastar para mover o painel">QUADRO</span><span class="local-visoes"></span><span class="sp"></span><button title="Atualizar">⟳</button><button title="Abrir no Planka">↗ Planka</button>';
    const grupo = topo.querySelector('.local-visoes');
    VISOES.forEach(([id, rotulo]) => {
      const b = document.createElement('button');
      b.textContent = rotulo;
      b.dataset.v = id;
      b.addEventListener('click', () => aplicarVisao(id, true));
      grupo.appendChild(b);
    });
    const [atualizar, abrir] = topo.querySelectorAll(':scope > button');
    atualizar.addEventListener('click', () => location.reload());
    abrir.addEventListener('click', () => window.open(location.origin + location.pathname, '_blank'));

    // troca a visao do Planka clicando no botao original dele (fica escondido junto com o cabecalho)
    const botaoPlanka = (icone) => {
      const i = document.querySelector(`._wrapper_1o9kk_5 i.${icone.split(' ').join('.')}.icon`);
      return i && i.closest('button, a');
    };
    function aplicarVisao(id, clicou) {
      visao = id;
      try { localStorage.setItem('local-painel-visao', id); } catch (e) { /* so nesta aba */ }
      document.documentElement.classList.toggle('empilhado', id === 'secoes');
      grupo.querySelectorAll('button').forEach((b) => b.classList.toggle('ativa', b.dataset.v === id));
      const icone = VISOES.find((v) => v[0] === id)[2];
      let tentativas = clicou ? 1 : 40; // ao abrir, espera o quadro carregar os botoes do Planka
      const tentar = () => {
        const b = botaoPlanka(icone);
        if (b) b.click(); else if (--tentativas > 0) setTimeout(tentar, 250);
      };
      tentar();
    }
    document.documentElement.classList.toggle('empilhado', visao === 'secoes'); // antes do quadro desenhar
    painelVisao = () => aplicarVisao(visao, false);
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(topo);
      const canto = document.createElement('div'); // alca de redimensionar (quem redimensiona e o painel.ps1)
      canto.className = 'local-canto';
      canto.title = 'Arrastar para redimensionar';
      document.body.appendChild(canto);
      painelVisao();
    });
  }

  // secoes fechadas: regra por id da lista (o React nao apaga, ao contrario de classe posta no elemento)
  const recolher = document.createElement('style');
  document.head.appendChild(recolher);
  let fechadas = new Set(ler('local-recolhidas', []));
  const aplicarRecolhidas = () => {
    const css = [...fechadas].map((id) => `${E} [data-rbd-draggable-id="list:${id}"] :is(._cardsInnerWrapper_hsqrn_51,._addCardButtonWrapper_hsqrn_42){display:none}`).join('\n');
    if (recolher.textContent !== css) recolher.textContent = css;
    document.querySelectorAll(L).forEach((sec) => {
      const id = (sec.dataset.rbdDraggableId || '').replace('list:', '');
      const seta = sec.querySelector('.local-seta');
      const s = fechadas.has(id) ? '▶' : '▼';
      if (seta && seta.textContent !== s) seta.textContent = s; // so muda se diferente: senao o observer entra em loop
      const qtd = sec.querySelector('.local-qtd');
      const n = `(${sec.querySelectorAll('._card_hsqrn_45').length})`;
      if (qtd && qtd.textContent !== n) qtd.textContent = n;
      const pz = sec.querySelector('.local-prazos');
      const c = prazosPorLista[id] || { atrasados: 0, breve: 0 };
      const chave = `${c.atrasados}|${c.breve}`;
      if (pz && pz.dataset.chave !== chave) { // so mexe no DOM se mudou: senao o observer entra em loop
        pz.dataset.chave = chave;
        pz.replaceChildren();
        if (c.atrasados) pz.append(selo('atrasado', c.atrasados, 'atrasado'));
        if (c.breve) pz.append(selo('breve', c.breve, `vence em ate ${DIAS_BREVE} dias`));
      }
    });
  };

  // selos de prazo por lista: atrasados e vencendo em DIAS_BREVE dias (cartoes nao concluidos, fora da
  // lista fechada). Vem da API do proprio quadro, com o token da sessao; atualiza a cada minuto.
  const DIAS_BREVE = 3;
  let prazosPorLista = {};
  // so o numero, na cor (vermelho = atrasado, amarelo = vence logo); o significado fica na dica do mouse
  const selo = (tipo, n, dica) => {
    const s = document.createElement('span');
    s.className = `local-selo local-selo-${tipo}`;
    s.textContent = `(${n})`;
    s.title = `${n} ${dica}`;
    return s;
  };
  const seloCss = document.createElement('style');
  seloCss.textContent = `
    .local-prazos{display:none;gap:4px;margin-left:6px}
    html.empilhado .local-prazos{display:inline-flex}
    .local-selo{font:700 12px system-ui,sans-serif;white-space:nowrap}
    .local-selo-atrasado{color:#db2828}
    .local-selo-breve{color:#e0a800}`;
  document.head.appendChild(seloCss);
  async function lerPrazos() {
    const m = location.pathname.match(/\/boards\/(\d+)/);
    const tk = decodeURIComponent((document.cookie.match(/(?:^|; )accessToken=([^;]*)/) || [])[1] || '');
    if (!m || !tk) return;
    try {
      const r = await fetch(`${window.BASE_PATH || ''}/api/boards/${m[1]}`, { headers: { Authorization: `Bearer ${tk}` } });
      if (!r.ok) return;
      const { included } = await r.json();
      const ativas = new Set(included.lists.filter((l) => l.type === 'active').map((l) => l.id));
      const agora = Date.now();
      const limite = agora + DIAS_BREVE * 864e5;
      const novo = {};
      included.cards.forEach((c) => {
        if (!c.dueDate || c.isDueCompleted || !ativas.has(c.listId)) return;
        const t = new Date(c.dueDate).getTime();
        const p = novo[c.listId] || (novo[c.listId] = { atrasados: 0, breve: 0 });
        if (t < agora) p.atrasados += 1; else if (t <= limite) p.breve += 1;
      });
      prazosPorLista = novo;
      included.lists.forEach((l) => { posicaoLista[l.id] = l.position; });
      aplicarRecolhidas();
    } catch (e) { /* sem rede/sessao: tenta de novo no proximo ciclo */ }
  }
  setInterval(lerPrazos, 60000);
  const posicaoLista = {};
  const ordemCss = document.createElement('style');
  ordemCss.textContent = `
    .local-alca{display:none;cursor:grab;color:#9aa1ab;font:700 14px system-ui,sans-serif;padding:0 2px 0 0;user-select:none;touch-action:none}
    html.empilhado .local-alca{display:inline-block}
    html.local-arrastando,html.local-arrastando *{cursor:grabbing!important;user-select:none}
    .local-solta-antes{box-shadow:0 -3px 0 #2185d0}
    .local-solta-depois{box-shadow:0 3px 0 #2185d0}
    .local-movendo{opacity:.45}`;
  document.head.appendChild(ordemCss);
  function arrastarLista(alca, sec, id) {
    alca.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      alca.setPointerCapture(e.pointerId);
      document.documentElement.classList.add('local-arrastando');
      sec.classList.add('local-movendo');
      let alvo = null;
      let antes = true;
      let ultimo = e;
      // rola sozinho perto da borda de cima/baixo: da para levar a secao do fim ate o topo
      let rolador = sec.parentElement;
      while (rolador && rolador !== document.body && !(rolador.scrollHeight > rolador.clientHeight && /auto|scroll/.test(getComputedStyle(rolador).overflowY))) rolador = rolador.parentElement;
      if (!rolador || rolador === document.body) rolador = document.scrollingElement;
      const rolar = setInterval(() => {
        const passo = ultimo.clientY < 90 ? -25 : (ultimo.clientY > window.innerHeight - 50 ? 25 : 0);
        if (passo) { rolador.scrollTop += passo; mover(ultimo); }
      }, 30);
      const limpar = () => document.querySelectorAll('.local-solta-antes,.local-solta-depois').forEach((x) => x.classList.remove('local-solta-antes', 'local-solta-depois'));
      const mover = (ev) => {
        ultimo = ev;
        // solta antes da primeira secao cujo cabecalho fica abaixo do cursor; nenhuma = depois da ultima
        const outras = [...document.querySelectorAll(L)].filter((x) => x !== sec);
        limpar();
        alvo = outras.find((x) => ev.clientY < x.getBoundingClientRect().top + 30) || outras[outras.length - 1] || null;
        if (!alvo) return;
        antes = ev.clientY < alvo.getBoundingClientRect().top + 30;
        alvo.classList.add(antes ? 'local-solta-antes' : 'local-solta-depois');
      };
      const soltar = async () => {
        alca.removeEventListener('pointermove', mover);
        clearInterval(rolar);
        document.documentElement.classList.remove('local-arrastando');
        sec.classList.remove('local-movendo');
        limpar();
        if (!alvo) return;
        const secs = [...document.querySelectorAll(L)].filter((x) => x !== sec);
        const i = secs.indexOf(alvo) + (antes ? 0 : 1);
        const pos = (x) => posicaoLista[(x.dataset.rbdDraggableId || '').replace('list:', '')];
        const a = i > 0 ? pos(secs[i - 1]) : 0;
        const b = i < secs.length ? pos(secs[i]) : undefined;
        if (a === undefined || (i < secs.length && b === undefined)) return; // posicoes ainda nao lidas
        const nova = b === undefined ? a + 65536 : (a + b) / 2;
        const tk = decodeURIComponent((document.cookie.match(/(?:^|; )accessToken=([^;]*)/) || [])[1] || '');
        await fetch(`${window.BASE_PATH || ''}/api/lists/${id}`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ position: nova }),
        }).catch(() => {});
        lerPrazos();
      };
      alca.addEventListener('pointermove', mover);
      alca.addEventListener('pointerup', soltar, { once: true });
      alca.addEventListener('pointercancel', soltar, { once: true });
    });
  }

  let ultimoQuadro = '';

  const enfeitar = () => {
    document.querySelectorAll(`${L} ._header_hsqrn_79:not([data-seta])`).forEach((h) => {
      h.dataset.seta = '1';
      const sec = h.closest(L);
      const id = (sec.dataset.rbdDraggableId || '').replace('list:', '');
      const seta = document.createElement('button');
      seta.className = 'local-seta';
      seta.title = 'Abrir/fechar';
      ['mousedown', 'pointerdown', 'touchstart'].forEach((ev) => seta.addEventListener(ev, (e) => e.stopPropagation(), true));
      seta.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (fechadas.has(id)) fechadas.delete(id); else fechadas.add(id);
        guardar('local-recolhidas', [...fechadas]);
        aplicarRecolhidas();
      });
      h.prepend(seta);
      const alca = document.createElement('span');
      alca.className = 'local-alca';
      alca.textContent = '⠿';
      alca.title = 'Arrastar para mudar a ordem';
      ['mousedown', 'touchstart'].forEach((ev) => alca.addEventListener(ev, (e) => e.stopPropagation(), true));
      arrastarLista(alca, sec, id);
      h.prepend(alca);
      const nome = h.querySelector('._headerName_hsqrn_116');
      const qtd = document.createElement('span');
      qtd.className = 'local-qtd';
      if (nome) nome.after(qtd); else h.append(qtd);
      const pz = document.createElement('span');
      pz.className = 'local-prazos';
      qtd.after(pz);
    });
    if (location.pathname !== ultimoQuadro) { ultimoQuadro = location.pathname; lerPrazos(); } // entrou num quadro
    aplicarRecolhidas();
  };

  const btn = document.createElement('button');
  btn.className = 'local-modo';
  const modo = (emp) => {
    document.documentElement.classList.toggle('empilhado', emp);
    btn.textContent = emp ? '▥ Colunas' : '☰ Empilhar';
    btn.title = emp ? 'Voltar para colunas lado a lado' : 'Listas uma embaixo da outra, abrindo e fechando';
  };
  btn.addEventListener('click', () => {
    const emp = !document.documentElement.classList.contains('empilhado');
    guardar('local-modo', emp ? 'empilhado' : 'colunas');
    modo(emp);
  });
  if (!painel) modo(ler('local-modo', 'colunas') === 'empilhado'); // no painel quem manda e o seletor de visao

  let agendado = false;
  new MutationObserver(() => {
    if (agendado) return;
    agendado = true;
    setTimeout(() => { agendado = false; enfeitar(); }, 30); // rAF para em aba de fundo
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
})();






