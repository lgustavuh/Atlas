'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';

type Estado = { erro?: string; ok?: string } | null;

export async function entrar(_: Estado, form: FormData): Promise<Estado> {
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get('email') ?? '').trim().toLowerCase(),
    password: String(form.get('senha') ?? ''),
  });
  if (error) return { erro: 'E-mail ou senha inválidos.' };
  const { data } = await supabase.from('usuarios').select('ativo').maybeSingle();
  if (!data?.ativo) {
    await supabase.auth.signOut();
    return { erro: 'Usuário desativado. Procure o administrador.' };
  }
  redirect('/');
}

export async function recuperarSenha(_: Estado, form: FormData): Promise<Estado> {
  const supabase = await supabaseServidor();
  const origem = process.env.NEXT_PUBLIC_SITE_URL || `https://${(await headers()).get('host')}`;
  await supabase.auth.resetPasswordForEmail(String(form.get('email') ?? '').trim().toLowerCase(), {
    redirectTo: `${origem}/auth/confirmar?proximo=/redefinir-senha`,
  });
  // mesma resposta exista ou não o e-mail (não revela quem tem cadastro)
  return { ok: 'Se o e-mail estiver cadastrado, você receberá um link para criar nova senha.' };
}
