'use server';

import { redirect } from 'next/navigation';
import { supabaseAdmin, supabaseServidor } from '@/lib/supabase/server';

export async function criarAdministrador(_: { erro?: string } | null, form: FormData) {
  const admin = supabaseAdmin();
  const { count } = await admin.from('usuarios').select('id', { count: 'exact', head: true });
  if ((count ?? 0) > 0) return { erro: 'O sistema já foi configurado.' };

  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const senha = String(form.get('senha') ?? '');
  const nome = String(form.get('nome') ?? '').trim();
  if (!nome || !email || senha.length < 8) return { erro: 'Preencha nome, e-mail e uma senha com 8+ caracteres.' };

  // O gatilho no banco cria a linha em "usuarios" e, por ser o primeiro, marca como administrador.
  const { error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } });
  if (error) return { erro: error.message };

  const supabase = await supabaseServidor();
  await supabase.auth.signInWithPassword({ email, password: senha });
  redirect('/');
}
