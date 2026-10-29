import { BotaoAcao } from '@/components/BotaoAcao';
import { Cabecalho, Cartao, Selo, Vazio } from '@/components/ui';
import { buscarOpcoes } from '@/lib/crud';
import { fmtDataHora, fmtTamanho } from '@/lib/formatar';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import { NovoCompartilhamento } from './NovoCompartilhamento';
import { removerCompartilhamento } from './acoes';

export const metadata = { title: 'Compartilhamento de arquivos' };

export default async function Arquivos() {
  const sessao = await exigirSessao('compartilhamentos', 2);
  const supabase = await supabaseServidor();
  const { data } = await supabase.from('compartilhamentos').select('*').eq('status', 'ativo').order('criado_em', { ascending: false }).limit(200);
  const lista = data ?? [];
  const ids = [...new Set(lista.flatMap((a) => [a.de_usuario_id, a.para_usuario_id]).filter(Boolean))] as string[];
  const nomes = Object.fromEntries((await buscarOpcoes('usuarios', undefined, ids)).map((o) => [o.valor, o.rotulo]));
  const recebidos = lista.filter((a) => a.de_usuario_id !== sessao.id);
  const enviados = lista.filter((a) => a.de_usuario_id === sessao.id);

  const Tabela = ({ itens, enviado }: { itens: typeof lista; enviado?: boolean }) =>
    itens.length === 0 ? <Vazio>Nenhum arquivo.</Vazio> : (
      <ul className="divide-y divide-slate-100">
        {itens.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <div className="min-w-0">
              <a className="font-medium text-marca-700 hover:underline" href={`/api/arquivo?path=${encodeURIComponent(a.arquivo_path)}`} target="_blank" rel="noreferrer">{a.arquivo_nome}</a>
              <p className="text-xs text-slate-500">
                {enviado ? (a.para_usuario_id ? `para ${nomes[a.para_usuario_id] ?? ''}` : 'para todos') : `de ${nomes[a.de_usuario_id] ?? ''}`}
                {' · '}{fmtDataHora(a.criado_em)} · {fmtTamanho(a.arquivo_tamanho)}{a.descricao && ` · ${a.descricao}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!a.para_usuario_id && <Selo cor="azul">todos</Selo>}
              {(enviado || pode(sessao, 'compartilhamentos', 5)) && <BotaoAcao pequeno variante="fantasma" acao={removerCompartilhamento.bind(null, a.id)} confirmar="Remover este compartilhamento?">remover</BotaoAcao>}
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <Cabecalho titulo="Compartilhamento de arquivos" subtitulo="Envie arquivos para um colega ou para todos os usuários do sistema." />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Cartao titulo={`Recebidos (${recebidos.length})`}><Tabela itens={recebidos} /></Cartao>
          <Cartao titulo={`Enviados por mim (${enviados.length})`}><Tabela itens={enviados} enviado /></Cartao>
        </div>
        {pode(sessao, 'compartilhamentos', 4) && <Cartao titulo="Compartilhar arquivo"><NovoCompartilhamento /></Cartao>}
      </div>
    </>
  );
}
