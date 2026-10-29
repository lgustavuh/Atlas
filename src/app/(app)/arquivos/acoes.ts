'use server';

import { revalidatePath } from 'next/cache';
import type { EstadoAcao } from '@/components/FormAcao';
import { mensagemErro } from '@/lib/erros';
import { supabaseServidor } from '@/lib/supabase/server';

export async function compartilhar(_: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const path = String(f.get('arquivo_path') ?? '');
  if (!path.startsWith('compartilhamentos/')) return { erro: 'Envie o arquivo primeiro.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('compartilhamentos').insert({
    para_usuario_id: String(f.get('para_usuario_id') ?? '') || null,
    descricao: String(f.get('descricao') ?? '').trim() || null,
    arquivo_path: path,
    arquivo_nome: String(f.get('arquivo_nome') ?? '') || null,
    arquivo_tipo: String(f.get('arquivo_tipo') ?? '') || null,
    arquivo_tamanho: Number(f.get('arquivo_tamanho')) || null,
  });
  if (error) return { erro: mensagemErro(error) };
  revalidatePath('/arquivos');
  return { ok: 'Arquivo compartilhado.' };
}

export async function removerCompartilhamento(id: number) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('compartilhamentos').update({ status: 'desativado' }).eq('id', id);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath('/arquivos');
  return { ok: true };
}
