import { notFound } from 'next/navigation';
import { Formulario } from '@/components/Formulario';
import { Cabecalho, Cartao } from '@/components/ui';
import { resolverRotulos } from '@/lib/crud';
import { obterModulo } from '@/lib/modulos';
import { exigirSessao } from '@/lib/sessao';

type Props = { params: Promise<{ modulo: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function Novo({ params, searchParams }: Props) {
  const { modulo } = await params;
  const sp = await searchParams;
  const mod = obterModulo(modulo);
  if (!mod) notFound();
  await exigirSessao(mod.permissao, 4);

  // valores iniciais vindos da URL (ex.: ?colaborador_id=12 a partir da ficha)
  const valores: Record<string, any> = {};
  for (const c of mod.campos) if (sp[c.nome]) valores[c.nome] = sp[c.nome];
  if (mod.campos.some((c) => c.nome === 'tipo') && mod.chave === 'fornecedores' && !valores.tipo) valores.tipo = 'PJ';
  const rotulos = await resolverRotulos(mod, [valores], true);
  const voltar = sp.voltar && sp.voltar.startsWith('/') ? sp.voltar : null;

  return (
    <>
      <Cabecalho titulo={`Novo: ${mod.singular.toLowerCase()}`} voltar={voltar ?? `/m/${mod.chave}`} />
      <Cartao>
        <Formulario chave={mod.chave} id={null} voltar={voltar} valores={valores} rotulos={rotulos} />
      </Cartao>
    </>
  );
}
