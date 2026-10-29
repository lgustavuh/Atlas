import Link from 'next/link';
import { BotaoAcao } from '@/components/BotaoAcao';
import { BotaoLink, Cabecalho, Cartao, Vazio } from '@/components/ui';
import { fmtData } from '@/lib/formatar';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import { avancarEtapa } from './acoes';

export const metadata = { title: 'Recrutamento e seleção' };

const ETAPAS = [
  { valor: 'etapa1', titulo: 'Etapa 1 — Triagem', proximo: 'Enviar para entrevista' },
  { valor: 'etapa2', titulo: 'Etapa 2 — Entrevista', proximo: 'Aprovar para documentação' },
  { valor: 'etapa3', titulo: 'Etapa 3 — Documentação', proximo: 'Efetivar colaborador' },
] as const;

export default async function Recrutamento() {
  const sessao = await exigirSessao('recrutamento_selecao', 2);
  const supabase = await supabaseServidor();
  const [{ data: candidatos }, { data: param }] = await Promise.all([
    supabase.from('colaboradores').select('id, nome, recrutamento_funcao, recrutamento_projeto, criado_em, etapa_recrutamento')
      .not('etapa_recrutamento', 'is', null).eq('status', 'ativo').order('criado_em'),
    supabase.from('recrutamento_parametros').select('*').eq('usuario_id', sessao.id).maybeSingle(),
  ]);
  const podeEtapa = (i: number) => sessao.admin || (pode(sessao, 'recrutamento_selecao', 3) && !!param?.[`etapa${i === 2 ? 4 : i + 1}`]);

  return (
    <>
      <Cabecalho titulo="Recrutamento e seleção" subtitulo="Candidatos passam pelas 3 etapas e, ao final, viram colaboradores."
        acoes={pode(sessao, 'colaboradores', 4) && <BotaoLink variante="primario" href="/m/colaboradores/novo?etapa_recrutamento=etapa1&voltar=/recrutamento">Novo candidato</BotaoLink>} />
      <div className="grid gap-5 lg:grid-cols-3">
        {ETAPAS.map((e, i) => {
          const lista = (candidatos ?? []).filter((c) => c.etapa_recrutamento === e.valor);
          return (
            <Cartao key={e.valor} titulo={`${e.titulo} (${lista.length})`}>
              {lista.length === 0 ? <Vazio>Nenhum candidato.</Vazio> : (
                <ul className="space-y-2">
                  {lista.map((c) => (
                    <li key={c.id} className="rounded-md border border-slate-200 p-3">
                      <Link href={`/colaboradores/${c.id}`} className="font-medium text-marca-700 hover:underline">{c.nome}</Link>
                      <p className="text-xs text-slate-500">{[c.recrutamento_funcao, c.recrutamento_projeto, `desde ${fmtData(c.criado_em)}`].filter(Boolean).join(' · ')}</p>
                      {podeEtapa(i) && (
                        <div className="mt-2">
                          <BotaoAcao acao={avancarEtapa.bind(null, c.id)} variante={i === 2 ? 'sucesso' : 'secundario'}
                            confirmar={i === 2 ? `Efetivar ${c.nome} como colaborador?` : undefined}>
                            {e.proximo} →
                          </BotaoAcao>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          );
        })}
      </div>
    </>
  );
}
