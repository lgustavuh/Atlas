import Link from 'next/link';
import { BotaoAcao } from '@/components/BotaoAcao';
import { BotaoLink, Cabecalho, Cartao, Vazio } from '@/components/ui';
import { fmtDataHora } from '@/lib/formatar';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import { baixarAlerta, lancarContribuicaoSindical } from './acoes';

export const metadata = { title: 'Alertas administrativos' };

export default async function Alertas() {
  const sessao = await exigirSessao('alerta_adm', 2);
  const supabase = await supabaseServidor();
  const { data } = await supabase.from('alertas').select('id, colaborador_id, identificador, texto, criado_em')
    .eq('status', 'ativo').order('criado_em', { ascending: false }).limit(500);
  const alertas = data ?? [];

  return (
    <>
      <Cabecalho titulo="Alertas administrativos"
        subtitulo="Lance o alerta anual de contribuição sindical e dê baixa conforme for tratando."
        acoes={
          <>
            <BotaoLink href="/m/alertas-excecoes">Exceções</BotaoLink>
            {pode(sessao, 'alerta_adm', 6) && (
              <BotaoAcao variante="primario" acao={lancarContribuicaoSindical}
                confirmar="Lançar o alerta de contribuição sindical deste ano para todos os colaboradores ativos (exceto as exceções)?">
                Lançar contribuição sindical
              </BotaoAcao>
            )}
          </>
        } />
      <Cartao titulo={`Ativos (${alertas.length})`}>
        {alertas.length === 0 ? <Vazio>Sem alertas ativos.</Vazio> : (
          <ul className="divide-y divide-slate-100">
            {alertas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p>{a.texto}</p>
                  <p className="text-xs text-slate-500">
                    {fmtDataHora(a.criado_em)}
                    {a.colaborador_id && <> · <Link className="text-marca-600 hover:underline" href={`/colaboradores/${a.colaborador_id}`}>ver colaborador</Link></>}
                  </p>
                </div>
                {pode(sessao, 'alerta_adm', 5) && <BotaoAcao pequeno acao={baixarAlerta.bind(null, a.id)}>Dar baixa</BotaoAcao>}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  );
}
