// Aplica supabase/migrations/*.sql no banco do Supabase, em ordem, uma única vez cada.
// Uso: preencha DATABASE_URL em .env.local e rode `npm run migrar`.
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => /^\s*[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const url = process.env.DATABASE_URL || env.DATABASE_URL;
if (!url) {
  console.error('Preencha DATABASE_URL em .env.local (Supabase → Connect → Session pooler).');
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cliente.connect();
await cliente.query(`create table if not exists public._migracoes_atlas (arquivo text primary key, aplicada_em timestamptz default now())`);
await cliente.query(`alter table public._migracoes_atlas enable row level security`);
const feitas = new Set((await cliente.query('select arquivo from public._migracoes_atlas')).rows.map((r) => r.arquivo));

const pasta = 'supabase/migrations';
for (const arquivo of fs.readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()) {
  if (feitas.has(arquivo)) {
    console.log('já aplicada  ', arquivo);
    continue;
  }
  const sql = fs.readFileSync(path.join(pasta, arquivo), 'utf8');
  const inicio = Date.now();
  try {
    // a carga de dados já tem begin/commit próprios
    if (!/^\s*begin;/m.test(sql)) await cliente.query('begin');
    await cliente.query(sql);
    if (!/^\s*begin;/m.test(sql)) await cliente.query('commit');
    await cliente.query('insert into public._migracoes_atlas (arquivo) values ($1)', [arquivo]);
    console.log('aplicada     ', arquivo, `(${Date.now() - inicio} ms)`);
  } catch (e) {
    await cliente.query('rollback').catch(() => {});
    console.error('ERRO em', arquivo, '→', e.message);
    process.exit(1);
  }
}
await cliente.end();
console.log('Banco pronto.');
