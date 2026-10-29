'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EnvioArquivo } from '@/components/EnvioArquivo';
import { definirFoto } from './acoes';

export function FotoColaborador({ id, url, podeEditar }: { id: string; url: string | null; podeEditar: boolean }) {
  const router = useRouter();
  const [erro, setErro] = useState('');
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
      <div className="aspect-[3/4] overflow-hidden rounded-md bg-slate-100">
        {url ? <img src={url} alt="Foto do colaborador" className="size-full object-cover" />
          : <div className="grid size-full place-items-center text-sm text-slate-400">Sem foto</div>}
      </div>
      {podeEditar && (
        <div className="mt-3">
          <EnvioArquivo pasta={`colaboradores/${id}`} prefixo="foto_"
            aoEnviar={async (info) => {
              const r = await definirFoto(id, info.path);
              if (r?.erro) setErro(r.erro);
              else router.refresh();
            }} />
          {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
        </div>
      )}
    </div>
  );
}
