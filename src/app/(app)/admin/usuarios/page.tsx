import Link from 'next/link';
import { BotaoLink, Cabecalho, Cartao, Selo } from '@/components/ui';
import { fmtData } from '@/lib/formatar';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Usuários e permissões' };

export default async function Usuarios() {
  const sessao = await exigirSessao('usuarios', 2);
  const supabase = await supabaseServidor();
  const { data } = await supabase.from('usuarios').select('id, nome, email, area_atuacao, admin, ativo, criado_em, permissoes(count)').order('nome');

  return (
    <>
      <Cabecalho titulo="Usuários e permissões"
        acoes={pode(sessao, 'usuarios', 4) && <BotaoLink variante="primario" href="/admin/usuarios/novo">Novo usuário</BotaoLink>} />
      <Cartao>
        <div className="-mx-4 overflow-x-auto">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Área</th><th>Perfil</th><th>Módulos</th><th>Desde</th></tr></thead>
            <tbody>
              {(data ?? []).map((u: any) => (
                <tr key={u.id} className={u.ativo ? '' : 'text-slate-400'}>
                  <td><Link href={`/admin/usuarios/${u.id}`} className="font-medium text-marca-700 hover:underline">{u.nome}</Link></td>
                  <td>{u.email}</td>
                  <td>{u.area_atuacao}</td>
                  <td>{u.admin ? <Selo cor="roxo">administrador</Selo> : u.ativo ? <Selo cor="verde">ativo</Selo> : <Selo>desativado</Selo>}</td>
                  <td>{u.admin ? 'todos' : u.permissoes?.[0]?.count ?? 0}</td>
                  <td>{fmtData(u.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>
    </>
  );
}
