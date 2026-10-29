import { BotaoLink, Cabecalho, Cartao } from '@/components/ui';
import { buscarOpcoes } from '@/lib/crud';
import { CAMPOS_MODELO } from '@/lib/documentos';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import { EscolhaDocumentos } from './EscolhaDocumentos';

export const metadata = { title: 'Documentos padronizados' };

export default async function Documentos({ searchParams }: { searchParams: Promise<{ colaborador?: string }> }) {
  const sessao = await exigirSessao('documentos_padronizados', 2);
  const sp = await searchParams;
  const supabase = await supabaseServidor();
  const { data: modelos } = await supabase.from('modelos_documentos').select('codigo, nome').eq('status', 'ativo').order('nome');
  const inicial = sp.colaborador ? (await buscarOpcoes('colaboradores', undefined, [sp.colaborador]))[0] : undefined;

  return (
    <>
      <Cabecalho titulo="Documentos padronizados" subtitulo="Escolha o colaborador e abra o documento já preenchido em PDF."
        acoes={pode(sessao, 'documentos_padronizados', 3) && <BotaoLink href="/m/modelos-documentos">Editar modelos</BotaoLink>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Cartao>
          <EscolhaDocumentos modelos={modelos ?? []} inicial={inicial} />
        </Cartao>
        <Cartao titulo="Como editar um modelo">
          <div className="space-y-3 text-xs text-slate-600">
            <p>Blocos são separados por uma linha em branco. Comece a linha com:</p>
            <ul className="space-y-1 font-mono">
              <li># Título centralizado</li>
              <li>^ Texto centralizado</li>
              <li>**Parágrafo em negrito**</li>
              <li>| célula | célula (tabela)</li>
              <li>[assinaturas: Testemunha | Empregador]</li>
              <li>[dependentes] · [dependentes: salario_familia]</li>
              <li>[pagina] (nova página) · [espaco]</li>
            </ul>
            <p>Campos preenchidos automaticamente:</p>
            <ul className="max-h-72 space-y-0.5 overflow-auto">
              {Object.entries(CAMPOS_MODELO).map(([k, v]) => <li key={k}><code className="text-marca-700">{`{{${k}}}`}</code> — {v}</li>)}
            </ul>
          </div>
        </Cartao>
      </div>
    </>
  );
}
