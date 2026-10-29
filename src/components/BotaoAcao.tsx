'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import { Botao } from './ui';

/** Botão que executa uma server action e mostra o erro ao lado, se houver. */
export function BotaoAcao({
  acao, children, variante = 'secundario', confirmar, pequeno, destino,
}: {
  acao: () => Promise<{ erro?: string; ok?: boolean; destino?: string } | void>;
  children: ReactNode;
  variante?: 'primario' | 'secundario' | 'perigo' | 'sucesso' | 'fantasma';
  confirmar?: string;
  pequeno?: boolean;
  destino?: string;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState('');
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Botao type="button" variante={variante} pequeno={pequeno} disabled={pendente}
        onClick={() => {
          if (confirmar && !window.confirm(confirmar)) return;
          setErro('');
          iniciar(async () => {
            const r = await acao();
            if (r && r.erro) setErro(r.erro);
            else if (r && r.destino) router.push(r.destino);
            else if (destino) router.push(destino);
            else router.refresh();
          });
        }}>
        {pendente ? 'Aguarde...' : children}
      </Botao>
      {erro && <span className="text-sm text-red-600">{erro}</span>}
    </span>
  );
}
