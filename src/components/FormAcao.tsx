'use client';

import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { Aviso, Botao } from './ui';

export type EstadoAcao = { erro?: string; ok?: string } | null;

/** Formulário ligado a uma server action (estado, erro e botão de envio). */
export function FormAcao({
  acao, children, rotulo = 'Salvar', variante = 'primario', className = '', limparAoSalvar, confirmar,
}: {
  acao: (anterior: EstadoAcao, form: FormData) => Promise<EstadoAcao>;
  children?: ReactNode;
  rotulo?: string;
  variante?: 'primario' | 'secundario' | 'perigo' | 'sucesso';
  className?: string;
  limparAoSalvar?: boolean;
  confirmar?: string;
}) {
  const [estado, executar, pendente] = useActionState(acao, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok && limparAoSalvar) ref.current?.reset();
  }, [estado, limparAoSalvar]);

  return (
    <form ref={ref} action={executar} className={`space-y-3 ${className}`}
      onSubmit={(e) => { if (confirmar && !window.confirm(confirmar)) e.preventDefault(); }}>
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado?.ok && !limparAoSalvar && <Aviso tipo="sucesso">{estado.ok}</Aviso>}
      {children}
      <Botao type="submit" variante={variante} disabled={pendente}>{pendente ? 'Aguarde...' : rotulo}</Botao>
    </form>
  );
}
