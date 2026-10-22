// Coloca os anexos baixados do Trello nos cartoes ja importados (casa cartao por nome + posicao).
// uso: node importar-anexos.js <trello.json> <pasta anexos com mapa.json> <boardId> <userId>
const path = require('path');
const fs = require('fs');

const [trelloFile, dir, boardId, userId] = process.argv.slice(2).map((a, i) => (i < 2 ? path.resolve(a) : a));
const trello = JSON.parse(fs.readFileSync(trelloFile, 'utf8'));
const mapa = JSON.parse(fs.readFileSync(path.join(dir, 'mapa.json'), 'utf8'));
const trelloCards = Object.fromEntries(trello.cards.map((c) => [c.id, c]));

process.chdir(path.join(__dirname, 'planka'));
require(path.join(process.cwd(), 'node_modules', 'dotenv')).config({ quiet: true });
const sails = require(path.join(process.cwd(), 'node_modules', 'sails'));
const rc = require(path.join(process.cwd(), 'node_modules', 'sails', 'accessible', 'rc'));

sails.load({ ...rc('sails'), port: 1338, log: { level: 'warn' } }, async (err) => {
  if (err) throw err;
  const creatorUser = await User.qm.getOneById(userId);
  let ok = 0;
  const falhas = [];
  for (const item of mapa) {
    const t = trelloCards[item.trelloCardId];
    try {
      const card = await Card.findOne({ boardId, name: t.name, position: t.pos });
      if (!card) throw new Error('cartao nao achado');
      const pathTo = await sails.helpers.cards.getPathToProjectById(card.id);

      // processUploadedFile move o arquivo: trabalha numa copia temporaria
      const tmp = path.join(sails.config.custom.uploadsTempPath || require('os').tmpdir(), `anexo-${Date.now()}-${ok}`);
      fs.mkdirSync(path.dirname(tmp), { recursive: true });
      fs.copyFileSync(path.join(dir, item.arquivo), tmp);
      const data = await sails.helpers.attachments.processUploadedFile({
        fd: tmp, filename: item.nome, size: fs.statSync(tmp).size, type: item.mime,
      });

      await sails.helpers.attachments.createOne.with({
        project: pathTo.project, board: pathTo.board, list: pathTo.list,
        values: { type: Attachment.Types.FILE, name: item.nome, data, card: pathTo.card, creatorUser },
      });
      ok += 1;
    } catch (e) {
      falhas.push(`${item.nome}: ${e.message}`);
    }
  }
  console.log('anexos criados:', ok, 'falhas:', falhas);
  sails.lower(() => process.exit());
});

