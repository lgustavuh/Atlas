import { Paginacao } from '@/components/Paginacao';
import { Cabecalho, Cartao, Selo, Vazio } from '@/components/ui';
import { buscarOpcoes } from '@/lib/crud';
import { fmtDataHora } from '@/lib/formatar';
import { exigirSessao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Auditoria' };
const POR_PAGINA = 50;
const COR = { INSERT: 'verde', UPDATE: 'azul', DELETE: 'vermelho' } as const;

function diferencas(antes: Record<string, unknown> | null, depois: Record<string, unknown> | null) {
  if (!antes || !depois) return null;
  return Object.keys(depois).filter((k) => !['atualizado_em'].includes(k) && JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
    .map((k) => `${k}: ${antes[k] ?? '∅'} → ${depois[k] ?? '∅'}`);
}

export default async function Auditoria({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirSessao('logs', 2);
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const supabase = await supabaseServidor();
  let q = supabase.from('auditoria').select('*', { count: 'exact' });
  if (sp.tabela) q = q.eq('tabela', sp.tabela);
  if (sp.registro) q = q.eq('registro_id', sp.registro);
  const { data, count } = await q.order('criado_em', { ascending: false }).range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const linhas = data ?? [];
  const nomes = Object.fromEntries((await buscarOpcoes('usuarios', undefined, [...new Set(linhas.map((l) => l.usuario_id).filter(Boolean))])).map((o) => [o.valor, o.rotulo]));

  return (
    <>
      <Cabecalho titulo="Auditoria" subtitulo="Toda inclusão, alteração e exclusão fica registrada automaticamente pelo banco." />
      <Cartao>
        <form className="mb-3 flex flex-wrap gap-2">
          <input name="tabela" defaultValue={sp.tabela} placeholder="Tabela (ex.: colaboradores)" className="campo-input w-60" />
          <input name="registro" defaultValue={sp.registro} placeholder="Nº do registro" className="campo-input w-36" />
          <button className="rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-50">Filtrar</button>
        </form>
        {linhas.length === 0 ? <Vazio>Nenhum registro.</Vazio> : (
          <div className="-mx-4 overflow-x-auto">
            <table className="tabela">
              <thead><tr><th>Quando</th><th>Usuário</th><th>Operação</th><th>Tabela</th><th>Registro</th><th>Alterações</th></tr></thead>
              <tbody>
                {linhas.map((l) => {
                  const dif = diferencas(l.antes, l.depois);
                  return (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap">{fmtDataHora(l.criado_em)}</td>
                      <td>{l.usuario_id ? nomes[l.usuario_id] ?? '—' : 'sistema'}</td>
                      <td><Selo cor={COR[l.operacao as keyof typeof COR]}>{l.operacao}</Selo></td>
                      <td>{l.tabela}</td>
                      <td>{l.registro_id}</td>
                      <td className="max-w-lg text-xs text-slate-600">{dif ? (dif.length ? dif.slice(0, 6).join(' · ') + (dif.length > 6 ? ' …' : '') : '—') : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={pagina} total={count ?? 0} porPagina={POR_PAGINA} params={{ tabela: sp.tabela, registro: sp.registro }} />
      </Cartao>
    </>
  );
}
