// local: botao ✓ no cartao (aparece no hover) que move o cartao pra lista fechada (Concluido) do quadro.
// Usa a API do proprio Planka com o token da sessao; a tela atualiza sozinha pelo socket.
(() => {
  const CARD = '._wrapper_36a26_43'; // classe com hash do bundle v2.2.1

  const token = () => decodeURIComponent((document.cookie.match(/(?:^|; )accessToken=([^;]*)/) || [])[1] || '');
  const api = (method, url, body) =>
    fetch(`${window.BASE_PATH || ''}/api${url}`, {
      method,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${url}`))));

  // id do cartao: sobe a arvore do React a partir do elemento ate achar props.id
  const cardId = (el) => {
    const k = Object.keys(el).find((x) => x.startsWith('__reactFiber$'));
    for (let f = k && el[k]; f; f = f.return) {
      if (f.memoizedProps && typeof f.memoizedProps.id === 'string') return f.memoizedProps.id;
    }
    return null;
  };

  async function concluir(el, btn) {
    const id = cardId(el);
    if (!id) return;
    btn.textContent = '…';
    try {
      const { item: card } = await api('GET', `/cards/${id}`);
      const { included } = await api('GET', `/boards/${card.boardId}`);
      const fechada = included.lists.find((l) => l.type === 'closed');
      if (!fechada) throw new Error('quadro sem lista fechada');
      await api('PATCH', `/cards/${id}`, { listId: fechada.id, position: 65536 });
    } catch (e) {
      btn.textContent = '!';
      btn.title = String(e.message || e);
      return;
    }
    btn.textContent = '✓';
  }

  const style = document.createElement('style');
  style.textContent = `
    ${CARD} .local-concluir{position:absolute;top:4px;right:32px;z-index:2;width:24px;height:24px;border:none;border-radius:50%;
      background:#2f8f4e;color:#fff;font:700 14px/24px system-ui,sans-serif;cursor:pointer;opacity:0;transition:opacity .1s}
    ${CARD}:hover .local-concluir{opacity:1}
    ${CARD} .local-concluir:hover{background:#38a85c}`;
  document.head.appendChild(style);

  const enfeitar = () =>
    document.querySelectorAll(`${CARD}:not([data-concluir])`).forEach((el) => {
      el.dataset.concluir = '1';
      const btn = document.createElement('button');
      btn.className = 'local-concluir';
      btn.title = 'Concluir (mover para Concluído)';
      btn.textContent = '✓';
      // captura: o clique nao abre o cartao nem inicia arraste
      ['mousedown', 'pointerdown', 'touchstart'].forEach((ev) => btn.addEventListener(ev, (e) => e.stopPropagation(), true));
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); concluir(el, btn); });
      el.appendChild(btn);
    });

  new MutationObserver(enfeitar).observe(document.documentElement, { childList: true, subtree: true });
})();
