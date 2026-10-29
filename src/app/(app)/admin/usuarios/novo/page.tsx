import { FormAcao } from '@/components/FormAcao';
import { Cabecalho, Cartao } from '@/components/ui';
import { exigirSessao } from '@/lib/sessao';
import { criarUsuario } from '../acoes';

export const metadata = { title: 'Novo usuário' };

export default async function NovoUsuario() {
  await exigirSessao('usuarios', 4);
  return (
    <>
      <Cabecalho titulo="Novo usuário" voltar="/admin/usuarios" />
      <Cartao>
        <FormAcao acao={criarUsuario} rotulo="Criar e definir permissões" className="max-w-md">
          <div><label htmlFor="nome" className="mb-1 block text-sm font-medium">Nome</label><input id="nome" name="nome" required className="campo-input" /></div>
          <div><label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail (login)</label><input id="email" name="email" type="email" required className="campo-input" /></div>
          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium">Senha provisória</label>
            <input id="senha" name="senha" type="text" minLength={8} required autoComplete="off" className="campo-input" />
            <p className="mt-1 text-xs text-slate-500">Passe para o usuário; ele pode trocar em “Minha conta”.</p>
          </div>
        </FormAcao>
      </Cartao>
    </>
  );
}
