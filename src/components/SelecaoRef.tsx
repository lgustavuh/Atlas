'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Opcao = { valor: string; rotulo: string };

/** Campo de seleção com busca (consulta /api/opcoes enquanto o usuário digita). */
export function SelecaoRef({
  nome, refChave, valorInicial, rotuloInicial, obrigatorio, invalido, desabilitado, aoMudar, placeholder,
}: {
  nome: string;
  refChave: string;
  valorInicial?: string | null;
  rotuloInicial?: string | null;
  obrigatorio?: boolean;
  invalido?: boolean;
  desabilitado?: boolean;
  aoMudar?: (valor: string, rotulo: string) => void;
  placeholder?: string;
}) {
  const [valor, setValor] = useState(valorInicial ?? '');
  const [texto, setTexto] = useState(rotuloInicial ?? '');
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const idLista = useId();

  useEffect(() => {
    if (!aberto) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const busca = texto && texto !== rotuloInicial ? texto : '';
        const r = await fetch(`/api/opcoes?ref=${refChave}&q=${encodeURIComponent(busca)}`, { signal: ctl.signal });
        setOpcoes(await r.json());
        setAtivo(0);
      } catch {
        /* busca cancelada */
      } finally {
        setCarregando(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [texto, aberto, refChave, rotuloInicial]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  function escolher(o: Opcao | null) {
    setValor(o?.valor ?? '');
    setTexto(o?.rotulo ?? '');
    setAberto(false);
    aoMudar?.(o?.valor ?? '', o?.rotulo ?? '');
  }

  return (
    <div ref={caixa} className="relative">
      <input type="hidden" name={nome} value={valor} />
      <input
        type="text"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-invalid={invalido || undefined}
        aria-required={obrigatorio || undefined}
        className="campo-input pr-8"
        value={texto}
        placeholder={placeholder ?? 'Digite para buscar...'}
        disabled={desabilitado}
        onFocus={() => setAberto(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
          if (!e.target.value) escolher(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo((a) => Math.min(a + 1, opcoes.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && aberto && opcoes[ativo]) { e.preventDefault(); escolher(opcoes[ativo]); }
          else if (e.key === 'Escape') setAberto(false);
        }}
      />
      {valor && !desabilitado && (
        <button type="button" aria-label="Limpar" onClick={() => escolher(null)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-1 text-slate-400 hover:text-slate-700">
          ×
        </button>
      )}
      {aberto && (
        <ul id={idLista} role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {carregando && opcoes.length === 0 && <li className="px-3 py-2 text-slate-400">Buscando...</li>}
          {!carregando && opcoes.length === 0 && <li className="px-3 py-2 text-slate-400">Nada encontrado.</li>}
          {opcoes.map((o, i) => (
            <li key={o.valor} role="option" aria-selected={i === ativo}
              onMouseDown={(e) => { e.preventDefault(); escolher(o); }}
              onMouseEnter={() => setAtivo(i)}
              className={`cursor-pointer px-3 py-1.5 ${i === ativo ? 'bg-marca-50 text-marca-900' : ''} ${o.valor === valor ? 'font-medium' : ''}`}>
              {o.rotulo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
