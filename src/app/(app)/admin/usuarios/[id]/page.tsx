import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormAcao } from '@/components/FormAcao';
import { SelecaoRef } from '@/components/SelecaoRef';
import { Aviso, Cabecalho, Cartao } from '@/components/ui';
import { buscarOpcoes } from '@/lib/crud';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import { redefinirSenha, salvarUsuario } from '../acoes';

export const metadata = { title: 'Usuário' };

const NIVEIS = [
  { valor: 0, rotulo: 'Sem acesso' }, { valor: 2, rotulo: '2 · Ver' }, { valor: 3, rotulo: '3 · Alterar' },
  { valor: 4, rotulo: '4 · Cadastrar' }, { valor: 5, rotulo: '5 · Excluir/desativar' }, { valor: 6, rotulo: '6 · Especial' },
];

export default async function Usuario({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sessao = await exigirSessao('usuarios', 2);
  const supabase = await supabaseServidor();
  const [{ data: u }, { data: mods }, { data: perms }] = await Promise.all([
    supabase.from('usuarios').select('*').eq('id', id).maybeSingle(),
    supabase.from('modulos').select('*').order('ordem'),
    supabase.from('permissoes').select('modulo, nivel').eq('usuario_id', id),
  ]);
  if (!u) notFound();
  const nivelDe = Object.fromEntries((perms ?? []).map((p) => [p.modulo, p.nivel]));
  const grupos = [...new Set((mods ?? []).map((m) => m.grupo))];
  const colab = u.colaborador_id ? (await buscarOpcoes('colaboradores', undefined, [String(u.colaborador_id)]))[0] : undefined;
  const podeEditar = pode(sessao, 'usuarios', 3);

  return (
    <>
      <Cabecalho titulo={u.nome} subtitulo={u.email} voltar="/admin/usuarios" />
      {sp.novo && <div className="mb-4"><Aviso tipo="sucesso">Usuário criado. Agora defina o que ele pode acessar.</Aviso></div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Cartao titulo="Dados e permissões">
          <FormAcao acao={salvarUsuario.bind(null, id)} rotulo="Salvar">
            <fieldset disabled={!podeEditar} className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-sm font-medium">Nome</label><input name="nome" defaultValue={u.nome} required className="campo-input" /></div>
                <div><label className="mb-1 block text-sm font-medium">Área de atuação</label><input name="area_atuacao" defaultValue={u.area_atuacao ?? ''} className="campo-input" /></div>
                <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Colaborador vinculado (opcional)</label>
                  <SelecaoRef nome="colaborador_id" refChave="colaboradores" valorInicial={colab?.valor} rotuloInicial={colab?.rotulo} /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ativo" defaultChecked={u.ativo} className="size-4" /> Ativo (pode entrar no sistema)</label>
                {sessao.admin && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="admin" defaultChecked={u.admin} className="size-4" /> Administrador (acesso total)</label>}
              </div>
              {u.admin ? <Aviso>Administradores têm acesso total; os níveis abaixo são ignorados.</Aviso> : null}
              <div className="space-y-4">
                {grupos.map((g) => (
                  <div key={g}>
                    <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{g}</h3>
                    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {(mods ?? []).filter((m) => m.grupo === g).map((m) => (
                        <label key={m.codigo} className="flex items-center justify-between gap-3 text-sm">
                          <span>{m.nome}</span>
                          <select name={`nivel_${m.codigo}`} defaultValue={nivelDe[m.codigo] ?? 0} className="campo-input w-44 py-1">
                            {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.rotulo}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </FormAcao>
        </Cartao>
        <div className="space-y-5">
          {podeEditar && (
            <Cartao titulo="Redefinir senha">
              <FormAcao acao={redefinirSenha.bind(null, id)} rotulo="Definir nova senha" variante="secundario">
                <input name="senha" type="text" minLength={8} required placeholder="Nova senha (8+ caracteres)" autoComplete="off" className="campo-input" />
              </FormAcao>
            </Cartao>
          )}
          <Cartao titulo="Também configure">
            <ul className="space-y-1 text-sm">
              <li><Link className="text-marca-700 hover:underline" href="/m/alcadas">Alçadas de compras (liberar/aprovar por obra)</Link></li>
              <li><Link className="text-marca-700 hover:underline" href="/m/recrutamento-parametros">Etapas do recrutamento</Link></li>
              <li><Link className="text-marca-700 hover:underline" href="/m/biblioteca-areas">Acesso às áreas da biblioteca</Link></li>
              <li><Link className="text-marca-700 hover:underline" href="/m/alertas-visualizadores">Quem vê os alertas no painel</Link></li>
            </ul>
          </Cartao>
        </div>
      </div>
    </>
  );
}
