import Link from 'next/link';
import { Cabecalho, Cartao, Vazio } from '@/components/ui';
import { buscarOpcoes } from '@/lib/crud';
import { exigirSessao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Lista de cipeiros' };

export default async function Cipeiros() {
  await exigirSessao('seguranca', 2);
  const supabase = await supabaseServidor();
  const { data } = await supabase.from('seguranca')
    .select('id, colaborador_id, cipa_representa, cipa_cargo')
    .eq('status', 'ativo').eq('cipeiro', true);
  // nomes pela função do banco: quem é da Segurança não precisa ver o cadastro pessoal completo
  const nomes = Object.fromEntries((await buscarOpcoes('colaboradores', undefined, (data ?? []).map((r) => String(r.colaborador_id)))).map((o) => [o.valor, o.rotulo]));
  const lista = (data ?? []).map((r) => ({ ...r, nome: nomes[String(r.colaborador_id)] ?? '' })).sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <>
      <Cabecalho titulo="Lista de cipeiros" subtitulo="Colaboradores ativos que fazem parte da CIPA." />
      <Cartao>
        {lista.length === 0 ? <Vazio>Nenhum cipeiro cadastrado.</Vazio> : (
          <table className="tabela">
            <thead><tr><th>Colaborador</th><th>Representa</th><th>Cargo na CIPA</th></tr></thead>
            <tbody>
              {lista.map((r) => (
                <tr key={r.id}>
                  <td><Link className="text-marca-700 hover:underline" href={`/colaboradores/${r.colaborador_id}`}>{r.nome}</Link></td>
                  <td>{r.cipa_representa}</td>
                  <td>{r.cipa_cargo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Cartao>
    </>
  );
}
