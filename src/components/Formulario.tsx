'use client';

import { Fragment, useActionState } from 'react';
import { salvarRegistro, type EstadoFormulario } from '@/lib/acoes-crud';
import { obterModulo, type Campo } from '@/lib/modulos';
import { SelecaoRef } from './SelecaoRef';
import { EnvioArquivo } from './EnvioArquivo';
import { Aviso, Botao } from './ui';

const LARGURA = { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3' } as const;

function valorTexto(campo: Campo, v: unknown) {
  if (v === null || v === undefined) return '';
  if (campo.tipo === 'moeda') return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (campo.tipo === 'data') return String(v).slice(0, 10);
  return String(v);
}

export function Formulario({
  chave, id, voltar, valores, rotulos, somenteLeitura,
}: {
  chave: string;
  id: string | null;
  voltar: string | null;
  valores: Record<string, any>;
  rotulos: Record<string, Record<string, string>>;
  somenteLeitura?: boolean;
}) {
  const mod = obterModulo(chave)!;
  const [estado, acao, salvando] = useActionState<EstadoFormulario, FormData>(
    salvarRegistro.bind(null, chave, id, voltar),
    null,
  );
  const erros = estado?.erros ?? {};

  function controle(c: Campo) {
    const v = valores[c.nome];
    const comum = {
      id: `campo-${c.nome}`,
      name: c.nome,
      'aria-invalid': erros[c.nome] ? true : undefined,
      disabled: somenteLeitura || c.somenteLeitura,
      required: c.obrigatorio,
    };
    switch (c.tipo) {
      case 'textarea':
        return <textarea {...comum} rows={c.nome === 'conteudo' ? 18 : 3} defaultValue={valorTexto(c, v)} className={`campo-input ${c.nome === 'conteudo' ? 'font-mono text-xs' : ''}`} />;
      case 'booleano':
        return (
          <label className="flex h-[38px] items-center gap-2 text-sm">
            <input type="checkbox" name={c.nome} defaultChecked={!!v} disabled={comum.disabled} className="size-4 rounded border-slate-300 text-marca-600" />
            Sim
          </label>
        );
      case 'opcoes':
        return (
          <select {...comum} defaultValue={v ?? ''} className="campo-input">
            <option value="">—</option>
            {c.opcoes!.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
        );
      case 'ref':
        return (
          <SelecaoRef nome={c.nome} refChave={c.ref!} valorInicial={v != null ? String(v) : ''}
            rotuloInicial={v != null ? (rotulos[c.nome]?.[String(v)] ?? String(v)) : ''}
            obrigatorio={c.obrigatorio} invalido={!!erros[c.nome]} desabilitado={comum.disabled} />
        );
      case 'arquivo':
        return somenteLeitura
          ? (v ? <a className="text-sm text-marca-600 underline" href={`/api/arquivo?path=${encodeURIComponent(v)}`} target="_blank" rel="noreferrer">{valores.arquivo_nome ?? 'Baixar arquivo'}</a> : <span className="text-sm text-slate-400">Sem arquivo</span>)
          : <EnvioArquivo pasta={c.pasta!} atual={{ path: v, nome: valores.arquivo_nome }} obrigatorio={c.obrigatorio} />;
      case 'data':
        return <input {...comum} type="date" defaultValue={valorTexto(c, v)} className="campo-input" />;
      case 'numero':
        return <input {...comum} type="text" inputMode="decimal" defaultValue={valorTexto(c, v)} className="campo-input" />;
      case 'moeda':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">R$</span>
            <input {...comum} type="text" inputMode="decimal" defaultValue={valorTexto(c, v)} className="campo-input pl-9" />
          </div>
        );
      case 'email':
        return <input {...comum} type="email" defaultValue={valorTexto(c, v)} className="campo-input" />;
      case 'telefone':
        return <input {...comum} type="tel" defaultValue={valorTexto(c, v)} className="campo-input" />;
      default:
        return (
          <input {...comum} type="text" defaultValue={valorTexto(c, v)} className="campo-input"
            placeholder={{ cpf: '000.000.000-00', cnpj: '00.000.000/0000-00', cep: '00000-000', placa: 'ABC1D23' }[c.tipo as string]} />
        );
    }
  }

  return (
    <form action={acao} className="space-y-5">
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
        {mod.campos.map((c) => (
          <Fragment key={c.nome}>
          {c.secao && <h3 className="mt-2 border-b border-slate-100 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase sm:col-span-3">{c.secao}</h3>}
          <div className={LARGURA[c.largura ?? 1]}>
            <label htmlFor={`campo-${c.nome}`} className="mb-1 block text-sm font-medium text-slate-700">
              {c.rotulo}
              {c.obrigatorio && !somenteLeitura && <span className="text-red-500"> *</span>}
            </label>
            {controle(c)}
            {erros[c.nome] ? <p className="mt-1 text-xs text-red-600">{erros[c.nome]}</p>
              : c.ajuda && !somenteLeitura ? <p className="mt-1 text-xs text-slate-500">{c.ajuda}</p> : null}
          </div>
          </Fragment>
        ))}
      </div>
      {!somenteLeitura && (
        <div className="flex gap-2 border-t border-slate-100 pt-4">
          <Botao variante="primario" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Botao>
        </div>
      )}
    </form>
  );
}
