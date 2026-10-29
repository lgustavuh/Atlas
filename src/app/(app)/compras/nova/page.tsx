import { FormAcao } from '@/components/FormAcao';
import { SelecaoRef } from '@/components/SelecaoRef';
import { Cabecalho, Cartao } from '@/components/ui';
import { exigirSessao } from '@/lib/sessao';
import { criarRequisicao } from '../acoes';

export const metadata = { title: 'Nova requisição' };

export default async function NovaRequisicao() {
  await exigirSessao('requisicao', 4);
  return (
    <>
      <Cabecalho titulo="Nova requisição de compra" voltar="/compras" />
      <Cartao>
        <FormAcao acao={criarRequisicao} rotulo="Criar e incluir itens" className="max-w-xl">
          <div>
            <label className="mb-1 block text-sm font-medium">Obra que receberá os materiais <span className="text-red-500">*</span></label>
            <SelecaoRef nome="obra_id" refChave="obras" obrigatorio />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="urgente" className="size-4" /> Urgente
          </label>
          <div>
            <label htmlFor="obs" className="mb-1 block text-sm font-medium">Observações</label>
            <textarea id="obs" name="obs" rows={3} className="campo-input" />
          </div>
        </FormAcao>
      </Cartao>
    </>
  );
}
