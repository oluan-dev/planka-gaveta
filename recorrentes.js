// Cartoes que se repetem: todo cartao numa lista "Recorrentes" (qualquer quadro) com uma linha
//   repetir: diario | seg,qua,sex | dia 5
// na descricao vira uma copia (etiquetas, checklists, anexos) no topo da lista de destino
//   lista: Pendencias        (opcional; sem ela vai pra primeira lista do quadro)
// Roda 1x por dia (tarefa agendada). Dia perdido com o PC desligado e criado na proxima execucao.
const path = require('path');
const fs = require('fs');

const ESTADO = path.join(__dirname, 'recorrentes-estado.json');
const DIAS = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const isoDia = (d) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD no fuso local

// regra -> funcao(Date) => bool; null se nao entendeu
function lerRegra(texto) {
  const r = semAcento(texto);
  if (/^(diario|todo dia|todos os dias)$/.test(r)) return () => true;
  const mes = r.match(/^dia (\d{1,2})$/);
  if (mes) {
    const n = Number(mes[1]);
    // dia 31 em mes de 30 dias cai no ultimo dia do mes
    return (d) => d.getDate() === Math.min(n, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
  }
  const dias = r.split(/[\s,]+/).map((p) => DIAS[p.slice(0, 3)]);
  if (dias.length && dias.every((x) => x !== undefined)) return (d) => dias.includes(d.getDay());
  return null;
}

function lerDescricao(desc) {
  const linhas = (desc || '').split(/\r?\n/);
  const pega = (chave) => {
    const l = linhas.find((x) => semAcento(x).startsWith(`${chave}:`));
    return l ? l.slice(l.indexOf(':') + 1).trim() : null;
  };
  const resto = linhas.filter((x) => !/^(repetir|lista):/.test(semAcento(x))).join('\n').trim();
  return { repetir: pega('repetir'), lista: pega('lista'), resto: resto || null };
}

// dias entre ultimaVerificacao (exclusivo) e hoje (inclusivo)
function diasPendentes(ultima, hoje) {
  const out = [];
  const d = new Date(`${ultima}T12:00:00`);
  for (d.setDate(d.getDate() + 1); isoDia(d) <= isoDia(hoje); d.setDate(d.getDate() + 1)) out.push(new Date(d));
  return out;
}

if (require.main === module && process.argv[2] === 'teste') {
  const assert = require('assert');
  const seg = new Date('2026-10-05T12:00:00'); // segunda
  assert(lerRegra('seg,qua')(seg) && !lerRegra('ter')(seg));
  assert(lerRegra('Segunda, Sexta')(seg));
  assert(lerRegra('diário')(seg));
  assert(lerRegra('dia 5')(seg) && !lerRegra('dia 6')(seg));
  assert(lerRegra('dia 31')(new Date('2026-09-30T12:00:00')));
  assert(lerRegra('qualquer coisa') === null);
  assert.deepStrictEqual(lerDescricao('repetir: seg\nLista: Pendências\nfazer X'), { repetir: 'seg', lista: 'Pendências', resto: 'fazer X' });
  assert.deepStrictEqual(diasPendentes('2026-10-03', seg).map(isoDia), ['2026-10-04', '2026-10-05']);
  console.log('ok');
  process.exit();
}

process.chdir(path.join(__dirname, 'planka'));
require(path.join(process.cwd(), 'node_modules', 'dotenv')).config({ quiet: true });
const sails = require(path.join(process.cwd(), 'node_modules', 'sails'));
const rc = require(path.join(process.cwd(), 'node_modules', 'sails', 'accessible', 'rc'));

sails.load({ ...rc('sails'), port: 1338, log: { level: 'warn' } }, async (err) => {
  if (err) throw err;
  const estado = fs.existsSync(ESTADO) ? JSON.parse(fs.readFileSync(ESTADO, 'utf8')) : {};
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const listasRec = (await List.find({ type: 'active' })).filter((l) => semAcento(l.name || '') === 'recorrentes');
  for (const rec of listasRec) {
    const listasDoQuadro = (await List.find({ boardId: rec.boardId, type: 'active' }).sort('position ASC')).filter(
      (l) => l.id !== rec.id,
    );
    for (const modelo of await Card.find({ listId: rec.id })) {
      const { repetir, lista, resto } = lerDescricao(modelo.description);
      const regra = repetir && lerRegra(repetir);
      if (!regra) continue;

      const ultima = estado[modelo.id] || isoDia(ontem); // modelo novo: comeca a contar hoje
      if (diasPendentes(ultima, hoje).some(regra)) {
        const destino = (lista && listasDoQuadro.find((l) => semAcento(l.name) === semAcento(lista))) || listasDoQuadro[0];
        if (!destino) continue;
        const { card, list, board, project } = await sails.helpers.cards.getPathToProjectById(modelo.id);
        const primeiro = await Card.find({ listId: destino.id }).sort('position ASC').limit(1);
        const { card: copia } = await sails.helpers.cards.duplicateOne.with({
          project, board, list, record: card,
          values: { position: primeiro.length ? primeiro[0].position / 2 : 65536, name: modelo.name, list: destino, creatorUser: await User.qm.getOneById(modelo.creatorUserId) },
        });
        await Card.updateOne({ id: copia.id }).set({ description: resto });
        console.log(`${isoDia(hoje)} criado "${modelo.name}" em ${destino.name}`);
      }
      estado[modelo.id] = isoDia(hoje);
    }
  }
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 1));
  sails.lower(() => process.exit());
});

