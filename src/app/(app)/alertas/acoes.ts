'use server';

import { revalidatePath } from 'next/cache';
import { mensagemErro } from '@/lib/erros';
import { supabaseServidor } from '@/lib/supabase/server';

export async function lancarContribuicaoSindical() {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc('lancar_alertas_contribuicao_sindical');
  if (error) return { erro: mensagemErro(error) };
  revalidatePath('/alertas');
  return { ok: true };
}

export async function baixarAlerta(id: number) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('alertas').update({ status: 'desativado' }).eq('id', id);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath('/alertas');
  return { ok: true };
}
