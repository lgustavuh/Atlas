import { notFound } from 'next/navigation';
import { AcoesRegistro } from '@/components/AcoesRegistro';
import { Formulario } from '@/components/Formulario';
import { Vinculos } from '@/components/Vinculos';
import { Aviso, Cabecalho, Cartao, Selo } from '@/components/ui';
import { buscarOpcoes, obter } from '@/lib/crud';
import { fmtDataHora } from '@/lib/formatar';
import { obterModulo } from '@/lib/modulos';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

type Props = { params: Promise<{ modulo: string; id: string }>; searchParams: Promise<Record<string, string | undefined>> };

const COR_STATUS = { ativo: 'verde', desativado: 'cinza', historico: 'amarelo' } as const;

export default async function Detalhe({ params, searchParams }: Props) {
  const { modulo, id: idBruto } = await params;
  const id = decodeURIComponent(idBruto);
  const sp = await searchParams;
  const mod = obterModulo(modulo);
  if (!mod) notFound();
  const sessao = await exigirSessao(mod.permissao, 2);
  const dados = await obter(mod, id);
  if (!dados) notFound();
  const { registro, rotulos } = dados;

  const podeEditar = pode(sessao, mod.permissao, 3) && registro.status !== 'historico';
  const voltar = sp.voltar && sp.voltar.startsWith('/') ? sp.voltar : null;
  const caminho = `/m/${mod.chave}/${encodeURIComponent(id)}`;

  // vínculos N:N (grupos do fornecedor, acesso às áreas...)
  const supabase = await supabaseServidor();
  const vinculos = await Promise.all(
    (mod.vinculos ?? []).map(async (v) => {
      const { data } = await supabase.from(v.tabela).select(v.chaveOutro).eq(v.chavePai, id);
      const ids = ((data as any[]) ?? []).map((r) => String(r[v.chaveOutro]));
      return { v, itens: ids.length ? await buscarOpcoes(v.ref, undefined, ids) : [] };
    }),
  );

  const titulo = mod.campos.find((c) => c.nome === mod.rotulo)?.tipo === 'ref'
    ? rotulos[mod.rotulo]?.[String(registro[mod.rotulo])]
    : registro[mod.rotulo];

  return (
    <>
      <Cabecalho
        voltar={voltar ?? `/m/${mod.chave}`}
        titulo={<span className="flex items-center gap-2">{mod.singular}{titulo && mod.rotulo !== 'id' ? `: ${titulo}` : ` nº ${id}`}
          {registro.status && <Selo cor={COR_STATUS[registro.status as keyof typeof COR_STATUS]}>{registro.status}</Selo>}</span>}
        subtitulo={registro.criado_em ? `Cadastrado em ${fmtDataHora(registro.criado_em)}` : undefined}
        acoes={
          <AcoesRegistro chave={mod.chave} id={id} status={registro.status}
            podeStatus={mod.temStatus !== false && registro.status !== 'historico' && pode(sessao, mod.permissao, 5)}
            podeExcluir={mod.temStatus === false && pode(sessao, mod.permissao, 5)} depoisExcluir={voltar ?? undefined} />
        }
      />
      <div className="space-y-5">
        {sp.salvo && <Aviso tipo="sucesso">Registro salvo.</Aviso>}
        {registro.status === 'historico' && <Aviso tipo="alerta">Este é um registro histórico (substituído por um mais recente) e não pode ser alterado.</Aviso>}
        <Cartao>
          <Formulario chave={mod.chave} id={id} voltar={voltar} valores={registro} rotulos={rotulos} somenteLeitura={!podeEditar} />
        </Cartao>
        {vinculos.map(({ v, itens }) => (
          <Cartao key={v.tabela} titulo={v.titulo}>
            <Vinculos vinculo={v} pai={id} itens={itens} caminho={caminho} podeEditar={pode(sessao, mod.permissao, 3)} />
          </Cartao>
        ))}
      </div>
    </>
  );
}
