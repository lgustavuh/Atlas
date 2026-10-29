'use client';

import { useActionState } from 'react';
import { criarAdministrador } from './acoes';
import { Aviso, Botao } from '@/components/ui';

export function FormSetup() {
  const [estado, acao, pendente] = useActionState(criarAdministrador, null);
  return (
    <form action={acao} className="space-y-4">
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium">Nome</label>
        <input id="nome" name="nome" required className="campo-input" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" required className="campo-input" />
      </div>
      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-medium">Senha (mín. 8 caracteres)</label>
        <input id="senha" name="senha" type="password" minLength={8} required autoComplete="new-password" className="campo-input" />
      </div>
      <Botao variante="primario" type="submit" disabled={pendente}>{pendente ? 'Criando...' : 'Criar administrador'}</Botao>
    </form>
  );
}
