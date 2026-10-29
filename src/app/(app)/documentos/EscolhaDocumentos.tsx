'use client';

import { useState } from 'react';
import { SelecaoRef } from '@/components/SelecaoRef';

export function EscolhaDocumentos({ modelos, inicial }: { modelos: { codigo: string; nome: string }[]; inicial?: { valor: string; rotulo: string } }) {
  const [colaborador, setColaborador] = useState(inicial?.valor ?? '');
  return (
    <div className="space-y-4">
      <div className="max-w-lg">
        <label className="mb-1 block text-sm font-medium">Colaborador</label>
        <SelecaoRef nome="colaborador" refChave="colaboradores" valorInicial={inicial?.valor} rotuloInicial={inicial?.rotulo} aoMudar={(v) => setColaborador(v)} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {modelos.map((m) => (
          <li key={m.codigo}>
            {colaborador ? (
              <a href={`/api/documentos/${m.codigo}?colaborador=${colaborador}`} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm hover:border-marca-500 hover:bg-marca-50">
                {m.nome} <span className="text-xs text-marca-600">PDF ↗</span>
              </a>
            ) : (
              <span className="flex rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-400">{m.nome}</span>
            )}
          </li>
        ))}
      </ul>
      {!colaborador && <p className="text-sm text-slate-500">Escolha um colaborador para liberar os documentos.</p>}
    </div>
  );
}
