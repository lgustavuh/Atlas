'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from './supabase/server';
import { MODULOS, obterModulo, type Campo } from './modulos';
import { mensagemErro } from './erros';

export type EstadoFormulario = { erro?: string; erros?: Record<string, string> } | null;

function numeroBR(v: string) {
  const s = v.trim();
  if (!s) return null;
  const normal = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normal.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function converter(campo: Campo, bruto: FormDataEntryValue | null): { valor: unknown; erro?: string } {
  const v = typeof bruto === 'string' ? bruto.trim() : '';
  switch (campo.tipo) {
    case 'booleano':
      return { valor: bruto === 'on' || bruto === 'true' };
    case 'numero':
    case 'moeda': {
      if (!v) return { valor: null };
      const n = numeroBR(v);
      return Number.isNaN(n) ? { valor: null, erro: 'Número inválido.' } : { valor: n };
    }
    case 'data':
      if (!v) return { valor: null };
      return /^\d{4}-\d{2}-\d{2}$/.test(v) ? { valor: v } : { valor: null, erro: 'Data inválida.' };
    case 'email':
      if (!v) return { valor: null };
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? { valor: v.toLowerCase() } : { valor: null, erro: 'E-mail inválido.' };
    case 'cpf': {
      if (!v) return { valor: null };
      const d = v.replace(/\D/g, '');
      if (d.length !== 11) return { valor: null, erro: 'CPF deve ter 11 dígitos.' };
      return { valor: `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` };
    }
    case 'cnpj': {
      if (!v) return { valor: null };
      const d = v.replace(/\D/g, '');
      if (d.length !== 14) return { valor: v };
      return { valor: `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` };
    }
    case 'placa':
      return { valor: v ? v.toUpperCase() : null };
    default:
      return { valor: v || null };
  }
}

export async function salvarRegistro(
  chave: string,
  id: string | null,
  voltar: string | null,
  _anterior: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const mod = obterModulo(chave);
  if (!mod) return { erro: 'Módulo inválido.' };

  const dados: Record<string, unknown> = {};
  const erros: Record<string, string> = {};
  for (const campo of mod.campos) {
    if (campo.somenteLeitura) continue;
    if (campo.tipo === 'arquivo') {
      const caminho = form.get('arquivo_path');
      if (typeof caminho === 'string' && caminho) {
        dados.arquivo_path = caminho;
        dados.arquivo_nome = form.get('arquivo_nome') || null;
        dados.arquivo_tipo = form.get('arquivo_tipo') || null;
        dados.arquivo_tamanho = Number(form.get('arquivo_tamanho')) || null;
      } else if (campo.obrigatorio && !id) {
        erros[campo.nome] = 'Envie o arquivo.';
      }
      continue;
    }
    const { valor, erro } = converter(campo, form.get(campo.nome));
    if (erro) erros[campo.nome] = erro;
    else if (campo.obrigatorio && (valor === null || valor === '')) erros[campo.nome] = 'Obrigatório.';
    dados[campo.nome] = valor;
  }
  if (Object.keys(erros).length) return { erro: 'Corrija os campos destacados.', erros };

  const supabase = await supabaseServidor();
  const pk = mod.pk ?? 'id';
  let novoId = id;
  if (id) {
    const { error } = await supabase.from(mod.tabela).update(dados).eq(pk, id);
    if (error) return { erro: mensagemErro(error) };
  } else {
    const { data, error } = await supabase.from(mod.tabela).insert(dados).select(pk).single();
    if (error) return { erro: mensagemErro(error) };
    novoId = String((data as unknown as Record<string, unknown>)[pk]);
  }

  revalidatePath(`/m/${chave}`);
  if (voltar) {
    revalidatePath(voltar);
    redirect(voltar);
  }
  redirect(mod.linkDetalhe ? mod.linkDetalhe(novoId!) : `/m/${chave}/${encodeURIComponent(novoId!)}?salvo=1`);
}

export async function alterarStatus(chave: string, id: string, status: 'ativo' | 'desativado') {
  const mod = obterModulo(chave);
  if (!mod || mod.temStatus === false) return { erro: 'Operação inválida.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from(mod.tabela).update({ status }).eq(mod.pk ?? 'id', id);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath(`/m/${chave}`);
  return { ok: true };
}

export async function excluirRegistro(chave: string, id: string, voltar?: string) {
  const mod = obterModulo(chave);
  if (!mod) return { erro: 'Operação inválida.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from(mod.tabela).delete().eq(mod.pk ?? 'id', id);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath(`/m/${chave}`);
  if (voltar) revalidatePath(voltar);
  return { ok: true };
}

function vinculoValido(tabela: string, chavePai: string, chaveOutro: string) {
  return MODULOS.some((m) => m.vinculos?.some((v) => v.tabela === tabela && v.chavePai === chavePai && v.chaveOutro === chaveOutro));
}

export async function adicionarVinculo(tabela: string, chavePai: string, pai: string, chaveOutro: string, outro: string, caminho: string) {
  if (!vinculoValido(tabela, chavePai, chaveOutro) || !outro) return { erro: 'Operação inválida.' };
  const supabase = await supabaseServidor();
  const linha: Record<string, string> = { [chavePai]: pai, [chaveOutro]: outro };
  const { error } = await supabase.from(tabela).insert(linha as never);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath(caminho);
  return { ok: true };
}

export async function removerVinculo(tabela: string, chavePai: string, pai: string, chaveOutro: string, outro: string, caminho: string) {
  if (!vinculoValido(tabela, chavePai, chaveOutro)) return { erro: 'Operação inválida.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from(tabela).delete().eq(chavePai, pai).eq(chaveOutro, outro);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath(caminho);
  return { ok: true };
}
