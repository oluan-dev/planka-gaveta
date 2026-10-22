// Calendario dos prazos do Planka: http://localhost:3001 (pagina) e /prazos.ics (assinar no Outlook).
// Le direto do Postgres local; sobe junto com o Planka (iniciar.ps1).
const http = require('http');
const path = require('path');
const { Client } = require(path.join(__dirname, 'planka', 'node_modules', 'pg'));

const PLANKA = 'http://localhost:3000';
const SQL = `
  select c.id, c.name, c.due_date, c.is_due_completed, l.name as lista, b.name as quadro
  from card c join list l on l.id = c.list_id join board b on b.id = c.board_id
  where c.due_date is not null and l.type = 'active'`;

async function prazos() {
  const db = new Client({ connectionString: 'postgresql://postgres@localhost:5433/planka' });
  await db.connect();
  try {
    return (await db.query(SQL)).rows;
  } finally {
    await db.end();
  }
}

const icsData =(d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
const icsTexto = (s) => String(s).replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

function ics(cards) {
  const ev = cards.map((c) => [
    'BEGIN:VEVENT', `UID:${c.id}@planka-local`, `DTSTAMP:${icsData(Date.now())}`,
    `DTSTART:${icsData(c.due_date)}`, `DTEND:${icsData(new Date(c.due_date).getTime() + 30 * 60000)}`,
    `SUMMARY:${c.is_due_completed ? '✔ ' : ''}${icsTexto(c.name)}`,
    `DESCRIPTION:${icsTexto(`${c.quadro} › ${c.lista}`)}`, `URL:${PLANKA}/cards/${c.id}`, 'END:VEVENT',
  ].join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//planka-local//prazos//PT', 'X-WR-CALNAME:Prazos Planka', ...ev, 'END:VCALENDAR'].join('\r\n');
}

const PAGINA = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Prazos</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js" integrity="sha384-B1OFx8Gy9GjPu8UbUyXbGQpzll9ubAUQ9agInFJ8NnD7nYG1u/CLR+Sqr5yifl4q" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/locales/pt-br.global.min.js" integrity="sha384-5ZKV+/cv//O+XOm9Hm6MvziRN8uPpyTzw+CpJ/rLYmcpTwagAELqBitMMNBRcqDk" crossorigin="anonymous"></script>
<style>body{font-family:system-ui,sans-serif;margin:16px;background:#f6f5f1;color:#16181d}
#cal{max-width:1200px;margin:auto;background:#fff;padding:16px;border-radius:12px}
.feito{opacity:.5;text-decoration:line-through}.atrasado{background:#c0392b!important;border-color:#c0392b!important}
a.ics{display:block;max-width:1200px;margin:0 auto 12px;color:#555}</style></head><body>
<a class="ics" href="/prazos.ics">Assinar no Outlook: http://localhost:3001/prazos.ics</a><div id="cal"></div>
<script>
fetch('/prazos.json').then(r=>r.json()).then(cards=>{
  const agora=Date.now();
  new FullCalendar.Calendar(document.getElementById('cal'),{
    locale:'pt-br',initialView:'dayGridMonth',height:'auto',
    headerToolbar:{left:'prev,next today',center:'title',right:'dayGridMonth,listMonth'},
    events:cards.map(c=>({title:c.name,start:c.due_date,url:'${PLANKA}/cards/'+c.id,
      classNames:c.is_due_completed?['feito']:(new Date(c.due_date)<agora?['atrasado']:[]),
      extendedProps:{onde:c.quadro+' › '+c.lista}})),
    eventDidMount:i=>{i.el.title=i.event.extendedProps.onde}
  }).render();
});
</script></body></html>`;

http.createServer(async (req, res) => {
  try {
    if (req.url === '/prazos.json') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(await prazos()));
    }
    if (req.url === '/claude.json') { // uso do Claude + maquina, repassado do servidor do Claude Usage (sem CORS la)
      const r = await fetch('http://127.0.0.1:8787/all.json');
      res.writeHead(r.status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': 'http://localhost:3000' });
      return res.end(await r.text());
    }
    if (req.url === '/prazos.ics') {
      res.writeHead(200, { 'content-type': 'text/calendar; charset=utf-8' });
      return res.end(ics(await prazos()));
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(PAGINA);
  } catch (e) {
    res.writeHead(500);
    return res.end(String(e));
  }
}).listen(3001, '127.0.0.1');

