import Link from 'next/link';
import { Cabecalho, Cartao, Selo, Vazio } from '@/components/ui';
import { exigirSessao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Busca rápida' };

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirSessao('colaboradores', 2);
  const q = (await searchParams).q?.trim() ?? '';
  const supabase = await supabaseServidor();

  let resultados: any[] = [];
  if (q.length >= 2) {
    const digitos = q.replace(/\D/g, '');
    const termo = q.replace(/[,()%]/g, ' ');
    const filtros = [`nome.ilike.%${termo}%`, `apelido.ilike.%${termo}%`];
    if (digitos.length >= 3) filtros.push(`cpf.ilike.%${digitos.length === 11 ? `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}` : termo}%`);
    const { data } = await supabase.from('colaboradores')
      .select('id, nome, apelido, cpf, status, etapa_recrutamento, profissionais(situacao, status, obras(codigo, razao_social))')
      .or(filtros.join(',')).order('nome').limit(50);
    resultados = data ?? [];
  }

  return (
    <>
      <Cabecalho titulo="Busca rápida" subtitulo="Procure colaboradores por nome, apelido ou CPF." />
      <Cartao>
        <form className="mb-4 flex gap-2">
          <input name="q" defaultValue={q} autoFocus placeholder="Nome, apelido ou CPF" aria-label="Termo de busca" className="campo-input max-w-md" />
          <button className="rounded-md bg-marca-600 px-4 text-sm font-medium text-white">Buscar</button>
        </form>
        {q.length >= 2 && resultados.length === 0 && <Vazio>Nenhum colaborador encontrado para “{q}”.</Vazio>}
        {resultados.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {resultados.map((r) => {
              const vinculo = (r.profissionais ?? []).find((p: any) => p.status === 'ativo');
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <Link href={`/colaboradores/${r.id}`} className="font-medium text-marca-700 hover:underline">{r.nome}</Link>
                    <p className="text-xs text-slate-500">
                      {[r.apelido, r.cpf, vinculo?.obras && `Obra ${vinculo.obras.codigo} - ${vinculo.obras.razao_social}`, vinculo?.situacao].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {r.etapa_recrutamento && <Selo cor="roxo">candidato</Selo>}
                    {r.status !== 'ativo' && <Selo>{r.status}</Selo>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </>
  );
}
