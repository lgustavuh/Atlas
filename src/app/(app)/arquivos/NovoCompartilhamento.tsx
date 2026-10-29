'use client';

import { useState } from 'react';
import { EnvioArquivo } from '@/components/EnvioArquivo';
import { FormAcao } from '@/components/FormAcao';
import { SelecaoRef } from '@/components/SelecaoRef';
import { compartilhar } from './acoes';

export function NovoCompartilhamento() {
  const [chave, setChave] = useState(0);
  return (
    <div key={chave}>
      <FormAcao acao={async (a, f) => { const r = await compartilhar(a, f); if (r?.ok) setChave((k) => k + 1); return r; }} rotulo="Compartilhar">
        <EnvioArquivo pasta="compartilhamentos" obrigatorio />
        <div>
          <label className="mb-1 block text-sm font-medium">Para</label>
          <SelecaoRef nome="para_usuario_id" refChave="usuarios" placeholder="Deixe vazio para todos" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <input name="descricao" className="campo-input" />
        </div>
      </FormAcao>
    </div>
  );
}
