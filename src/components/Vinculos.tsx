'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { adicionarVinculo, removerVinculo } from '@/lib/acoes-crud';
import type { Vinculo } from '@/lib/modulos';
import { SelecaoRef } from './SelecaoRef';
import { Botao, Vazio } from './ui';

export function Vinculos({
  vinculo, pai, itens, caminho, podeEditar,
}: {
  vinculo: Vinculo;
  pai: string;
  itens: { valor: string; rotulo: string }[];
  caminho: string;
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [novo, setNovo] = useState('');
  const [chaveCampo, setChaveCampo] = useState(0);
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();

  function exec(fn: () => Promise<{ erro?: string }>) {
    setErro('');
    iniciar(async () => {
      const r = await fn();
      if (r.erro) setErro(r.erro);
      else {
        setNovo('');
        setChaveCampo((k) => k + 1);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {itens.length === 0 ? <Vazio>Nenhum vínculo.</Vazio> : (
        <ul className="flex flex-wrap gap-2">
          {itens.map((i) => (
            <li key={i.valor} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pr-1 pl-3 text-sm">
              {i.rotulo}
              {podeEditar && (
                <button type="button" aria-label={`Remover ${i.rotulo}`} disabled={pendente}
                  className="rounded-full px-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                  onClick={() => exec(() => removerVinculo(vinculo.tabela, vinculo.chavePai, pai, vinculo.chaveOutro, i.valor, caminho))}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {podeEditar && (
        <div className="flex max-w-lg items-start gap-2">
          <div className="flex-1">
            <SelecaoRef key={chaveCampo} nome="_vinculo" refChave={vinculo.ref} aoMudar={(v) => setNovo(v)} placeholder="Adicionar..." />
          </div>
          <Botao type="button" disabled={!novo || pendente}
            onClick={() => exec(() => adicionarVinculo(vinculo.tabela, vinculo.chavePai, pai, vinculo.chaveOutro, novo, caminho))}>
            Adicionar
          </Botao>
        </div>
      )}
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
