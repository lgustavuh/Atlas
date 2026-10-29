'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SelecaoRef } from './SelecaoRef';

/** Filtro de lista por referência: atualiza o parâmetro da URL ao escolher. */
export function SelecaoFiltro({ parametro, refChave, valor, rotulo, placeholder }: { parametro: string; refChave: string; valor?: string; rotulo?: string; placeholder?: string }) {
  const router = useRouter();
  const caminho = usePathname();
  const sp = useSearchParams();
  return (
    <div className="w-72">
      <SelecaoRef nome={`_filtro_${parametro}`} refChave={refChave} valorInicial={valor} rotuloInicial={rotulo} placeholder={placeholder}
        aoMudar={(v) => {
          const p = new URLSearchParams(sp.toString());
          if (v) p.set(parametro, v);
          else p.delete(parametro);
          p.delete('pagina');
          router.push(`${caminho}?${p}`);
        }} />
    </div>
  );
}
