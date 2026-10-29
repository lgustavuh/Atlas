'use server';

import { revalidatePath } from 'next/cache';
import { mensagemErro } from '@/lib/erros';
import { supabaseServidor } from '@/lib/supabase/server';

export async function definirFoto(id: string, path: string) {
  if (!path.startsWith(`colaboradores/${id}/`)) return { erro: 'Caminho inválido.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('colaboradores').update({ foto_path: path }).eq('id', id);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath(`/colaboradores/${id}`);
  return { ok: true };
}
