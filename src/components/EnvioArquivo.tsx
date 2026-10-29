'use client';

import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/cliente';
import { fmtTamanho } from '@/lib/formatar';

const LIMITE = 50 * 1024 * 1024;

function nomeSeguro(nome: string) {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
}

/**
 * Envia o arquivo direto para o armazenamento (bucket privado "arquivos") e
 * preenche os campos ocultos arquivo_path/nome/tipo/tamanho do formulário.
 */
export function EnvioArquivo({
  pasta, atual, aoEnviar, obrigatorio, prefixo = '',
}: {
  pasta: string;
  atual?: { path?: string | null; nome?: string | null } | null;
  aoEnviar?: (info: { path: string; nome: string; tipo: string; tamanho: number }) => void;
  obrigatorio?: boolean;
  prefixo?: string;
}) {
  const [info, setInfo] = useState<{ path: string; nome: string; tipo: string; tamanho: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(arquivo: File) {
    setErro('');
    if (arquivo.size > LIMITE) {
      setErro('Arquivo maior que 50 MB.');
      return;
    }
    setEnviando(true);
    const ano = new Date().getFullYear();
    const path = `${pasta}/${ano}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
    const { error } = await supabaseNavegador().storage.from('arquivos').upload(path, arquivo, {
      contentType: arquivo.type || 'application/octet-stream',
      upsert: false,
    });
    setEnviando(false);
    if (error) {
      setErro(/row-level security|not authorized|unauthorized/i.test(error.message) ? 'Sem permissão para enviar arquivos neste módulo.' : error.message);
      return;
    }
    const novo = { path, nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size };
    setInfo(novo);
    aoEnviar?.(novo);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={`${prefixo}arquivo_path`} value={info?.path ?? ''} />
      <input type="hidden" name={`${prefixo}arquivo_nome`} value={info?.nome ?? ''} />
      <input type="hidden" name={`${prefixo}arquivo_tipo`} value={info?.tipo ?? ''} />
      <input type="hidden" name={`${prefixo}arquivo_tamanho`} value={info?.tamanho ?? ''} />
      {atual?.path && !info && (
        <p className="text-sm">
          Arquivo atual:{' '}
          <a className="text-marca-600 underline" href={`/api/arquivo?path=${encodeURIComponent(atual.path)}`} target="_blank" rel="noreferrer">
            {atual.nome ?? 'baixar'}
          </a>
        </p>
      )}
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm hover:border-marca-500">
        <input
          type="file"
          className="sr-only"
          required={obrigatorio && !atual?.path && !info}
          onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])}
        />
        <span className="font-medium text-marca-700">{atual?.path || info ? 'Trocar arquivo' : 'Escolher arquivo'}</span>
        <span className="truncate text-slate-500">
          {enviando ? 'Enviando...' : info ? `${info.nome} (${fmtTamanho(info.tamanho)}) — enviado` : 'PDF, imagem, planilha... até 50 MB'}
        </span>
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
