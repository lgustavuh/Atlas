'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/cliente';
import { Aviso, Botao } from './ui';

export function FormSenha({ destino }: { destino?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [pendente, setPendente] = useState(false);

  async function enviar(form: FormData) {
    setErro('');
    const senha = String(form.get('senha'));
    if (senha.length < 8) return setErro('A senha precisa ter ao menos 8 caracteres.');
    if (senha !== form.get('confirmacao')) return setErro('As senhas não conferem.');
    setPendente(true);
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setPendente(false);
    if (error) return setErro(error.message);
    setOk(true);
    if (destino) router.push(destino);
  }

  return (
    <form action={enviar} className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {ok && <Aviso tipo="sucesso">Senha alterada.</Aviso>}
      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-medium">Nova senha</label>
        <input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" className="campo-input" />
      </div>
      <div>
        <label htmlFor="confirmacao" className="mb-1 block text-sm font-medium">Confirme a senha</label>
        <input id="confirmacao" name="confirmacao" type="password" required autoComplete="new-password" className="campo-input" />
      </div>
      <Botao variante="primario" type="submit" disabled={pendente}>{pendente ? 'Salvando...' : 'Salvar senha'}</Botao>
    </form>
  );
}
