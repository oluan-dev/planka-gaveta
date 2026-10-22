// Importa o JSON do Trello num projeto do Planka pelo importador interno (sem HTTP, sem login).
// uso: node importar-trello.js <arquivo.json> <projectId> <userId> <nome do quadro>
const path = require('path');
const fs = require('fs');

const [file, projectId, userId, name] = process.argv.slice(2);
const trelloBoard = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));

process.chdir(path.join(__dirname, 'planka'));
require(path.join(process.cwd(), 'node_modules', 'dotenv')).config({ quiet: true });
const sails = require(path.join(process.cwd(), 'node_modules', 'sails'));
const rc = require(path.join(process.cwd(), 'node_modules', 'sails', 'accessible', 'rc'));

sails.load({ ...rc('sails'), port: 1338, log: { level: 'warn' } }, async (err) => {
  if (err) throw err;
  try {
    const project = await Project.qm.getOneById(projectId);
    const actorUser = await User.qm.getOneById(userId);
    const { board } = await sails.helpers.boards.createOne.with({
      values: { position: 65536, name, project },
      import: { type: 'trello', board: trelloBoard },
      actorUser,
    });
    console.log('quadro criado:', board.id);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
  sails.lower(() => process.exit());
});
