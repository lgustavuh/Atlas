'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { alterarStatus, excluirRegistro } from '@/lib/acoes-crud';
import { Botao } from './ui';

export function AcoesRegistro({
  chave, id, status, podeStatus, podeExcluir, depoisExcluir,
}: {
  chave: string;
  id: string;
  status?: string;
  podeStatus: boolean;
  podeExcluir?: boolean;
  depoisExcluir?: string;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState('');

  function executar(fn: () => Promise<{ erro?: string; ok?: boolean }>, destino?: string) {
    setErro('');
    iniciar(async () => {
      const r = await fn();
      if (r.erro) setErro(r.erro);
      else if (destino) router.push(destino);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {podeStatus && status === 'ativo' && (
        <Botao variante="perigo" disabled={pendente}
          onClick={() => confirmar('Desativar este registro? Ele sai das listas, mas pode ser reativado.') && executar(() => alterarStatus(chave, id, 'desativado'))}>
          Desativar
        </Botao>
      )}
      {podeStatus && status === 'desativado' && (
        <Botao variante="sucesso" disabled={pendente} onClick={() => executar(() => alterarStatus(chave, id, 'ativo'))}>
          Reativar
        </Botao>
      )}
      {podeExcluir && (
        <Botao variante="perigo" disabled={pendente}
          onClick={() => confirmar('Excluir definitivamente?') && executar(() => excluirRegistro(chave, id, depoisExcluir), depoisExcluir ?? `/m/${chave}`)}>
          Excluir
        </Botao>
      )}
      {erro && <span className="text-sm text-red-600">{erro}</span>}
    </div>
  );
}

// Confirmação nativa: ação curta e reversível na maioria dos casos.
function confirmar(msg: string) {
  return typeof window !== 'undefined' && window.confirm(msg);
}
