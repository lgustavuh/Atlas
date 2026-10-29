'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { EstadoAcao } from '@/components/FormAcao';
import { mensagemErro } from '@/lib/erros';
import { obterSessao, pode } from '@/lib/sessao';
import { supabaseAdmin, supabaseServidor } from '@/lib/supabase/server';

export async function criarUsuario(_: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const sessao = await obterSessao();
  if (!sessao || !pode(sessao, 'usuarios', 4)) return { erro: 'Sem permissão.' };
  const nome = String(f.get('nome') ?? '').trim();
  const email = String(f.get('email') ?? '').trim().toLowerCase();
  const senha = String(f.get('senha') ?? '');
  if (!nome || !email) return { erro: 'Informe nome e e-mail.' };
  if (senha.length < 8) return { erro: 'A senha provisória precisa ter 8+ caracteres.' };

  // criação no Auth exige a chave de serviço; o gatilho do banco cria a linha em "usuarios"
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } });
  if (error) return { erro: /already/i.test(error.message) ? 'Já existe usuário com este e-mail.' : error.message };
  redirect(`/admin/usuarios/${data.user.id}?novo=1`);
}

export async function salvarUsuario(id: string, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const sessao = await obterSessao();
  if (!sessao || !pode(sessao, 'usuarios', 3)) return { erro: 'Sem permissão.' };
  const supabase = await supabaseServidor();

  const dados: Record<string, unknown> = {
    nome: String(f.get('nome') ?? '').trim(),
    area_atuacao: String(f.get('area_atuacao') ?? '').trim() || null,
    colaborador_id: Number(f.get('colaborador_id')) || null,
    ativo: f.get('ativo') === 'on',
  };
  if (sessao.admin) dados.admin = f.get('admin') === 'on';
  if (id === sessao.id) { dados.ativo = true; if (sessao.admin) dados.admin = true; } // não se trancar para fora
  const { error } = await supabase.from('usuarios').update(dados).eq('id', id);
  if (error) return { erro: mensagemErro(error) };

  // níveis por módulo: nivel_<codigo>
  const niveis = [...f.entries()].filter(([k]) => k.startsWith('nivel_')).map(([k, v]) => ({ modulo: k.slice(6), nivel: Number(v) }));
  const manter = niveis.filter((n) => n.nivel > 0).map((n) => ({ usuario_id: id, modulo: n.modulo, nivel: n.nivel }));
  const remover = niveis.filter((n) => n.nivel === 0).map((n) => n.modulo);
  if (manter.length) {
    const { error: e1 } = await supabase.from('permissoes').upsert(manter, { onConflict: 'usuario_id,modulo' });
    if (e1) return { erro: mensagemErro(e1) };
  }
  if (remover.length) {
    const { error: e2 } = await supabase.from('permissoes').delete().eq('usuario_id', id).in('modulo', remover);
    if (e2) return { erro: mensagemErro(e2) };
  }

  // desativar também bloqueia o login no Auth
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && id !== sessao.id) {
    await supabaseAdmin().auth.admin.updateUserById(id, { ban_duration: dados.ativo ? 'none' : '876000h' });
  }
  revalidatePath(`/admin/usuarios/${id}`);
  revalidatePath('/admin/usuarios');
  return { ok: 'Usuário salvo.' };
}

export async function redefinirSenha(id: string, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const sessao = await obterSessao();
  if (!sessao || !pode(sessao, 'usuarios', 3)) return { erro: 'Sem permissão.' };
  const senha = String(f.get('senha') ?? '');
  if (senha.length < 8) return { erro: 'A senha precisa ter 8+ caracteres.' };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, { password: senha });
  return error ? { erro: error.message } : { ok: 'Senha redefinida. Informe a nova senha ao usuário.' };
}
