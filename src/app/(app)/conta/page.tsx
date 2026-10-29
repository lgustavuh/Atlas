import { FormSenha } from '@/components/FormSenha';
import { Cabecalho, Cartao, Dado } from '@/components/ui';
import { exigirSessao } from '@/lib/sessao';

export const metadata = { title: 'Minha conta' };

export default async function Conta() {
  const sessao = await exigirSessao();
  return (
    <>
      <Cabecalho titulo="Minha conta" />
      <div className="grid gap-5 md:grid-cols-2">
        <Cartao titulo="Dados">
          <dl className="grid gap-3">
            <Dado rotulo="Nome">{sessao.nome}</Dado>
            <Dado rotulo="E-mail">{sessao.email}</Dado>
            <Dado rotulo="Perfil">{sessao.admin ? 'Administrador' : 'Usuário'}</Dado>
          </dl>
        </Cartao>
        <Cartao titulo="Alterar senha"><FormSenha /></Cartao>
      </div>
    </>
  );
}
