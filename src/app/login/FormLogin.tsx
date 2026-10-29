'use client';

import { useActionState, useState } from 'react';
import { entrar, recuperarSenha } from './acoes';
import { Aviso, Botao } from '@/components/ui';

export function FormLogin() {
  const [modo, setModo] = useState<'entrar' | 'recuperar'>('entrar');
  const [estado, acao, pendente] = useActionState(modo === 'entrar' ? entrar : recuperarSenha, null);

  return (
    <form action={acao} className="space-y-4">
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado?.ok && <Aviso tipo="sucesso">{estado.ok}</Aviso>}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="campo-input" />
      </div>
      {modo === 'entrar' && (
        <div>
          <label htmlFor="senha" className="mb-1 block text-sm font-medium">Senha</label>
          <input id="senha" name="senha" type="password" required autoComplete="current-password" className="campo-input" />
        </div>
      )}
      <Botao variante="primario" type="submit" disabled={pendente} className="w-full">
        {pendente ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Enviar link de recuperação'}
      </Botao>
      <button type="button" onClick={() => setModo(modo === 'entrar' ? 'recuperar' : 'entrar')} className="w-full text-center text-sm text-marca-600 hover:underline">
        {modo === 'entrar' ? 'Esqueci minha senha' : 'Voltar para o login'}
      </button>
    </form>
  );
}
