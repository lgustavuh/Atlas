'use server';

import { revalidatePath } from 'next/cache';
import { mensagemErro } from '@/lib/erros';
import { supabaseServidor } from '@/lib/supabase/server';

export async function avancarEtapa(id: number) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc('avancar_etapa', { p_colaborador_id: id });
  if (error) return { erro: mensagemErro(error) };
  revalidatePath('/recrutamento');
  return { ok: true };
}
