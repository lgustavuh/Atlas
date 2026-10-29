"""Gera o SQL de carga a partir do dump do sistema antigo.

Uso:  python -I importar_dump.py <caminho/localhost.sql> <saida.sql>

Só a localidade (países, estados e cidades) é carregada. Os demais cadastros
do sistema antigo (colaboradores, fornecedores, materiais, obras, compras...)
não são importados: o Atlas começa com eles vazios.
"""
import os
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dump_parser import ler_tabelas  # noqa: E402

TABELAS = ['paises', 'estados', 'cidades', 'relacionamentocidades']


def sql(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def txt(v):
    v = (v or '').strip() if isinstance(v, str) or v is None else str(v)
    return v or None


def num(v):
    v = txt(v)
    if v is None:
        return None
    try:
        return float(v) if '.' in v else int(v)
    except ValueError:
        return None


def inteiro(v):
    n = num(v)
    return int(n) if n is not None else None


def status(v):
    v = (txt(v) or '').lower()
    if v.startswith('desativ'):
        return 'desativado'
    if v.startswith('hist'):
        return 'historico'
    return 'ativo'


class Carga:
    def __init__(self):
        self.blocos = []
        self.contagem = Counter()

    def inserir(self, tabela, linhas):
        if not linhas:
            return
        cols = list(linhas[0].keys())
        for i in range(0, len(linhas), 500):
            parte = linhas[i:i + 500]
            valores = ',\n'.join('(' + ', '.join(sql(r[c]) for c in cols) + ')' for r in parte)
            self.blocos.append(f'insert into public.{tabela} ({", ".join(cols)}) values\n{valores};')
        self.contagem[tabela] += len(linhas)


def gerar(caminho_dump, saida):
    d = ler_tabelas(caminho_dump, somente=set(TABELAS))
    c = Carga()

    # --- Localidade -------------------------------------------------------
    rel = [r for r in d['relacionamentocidades']]
    pais_do_estado = {}
    for est, cont in _agrupar(rel, 'IDEstados', 'IDPaises').items():
        pais_do_estado[est] = cont.most_common(1)[0][0]

    c.inserir('paises', [dict(id=int(r['IDPaises']), nome=txt(r['Nome']), status=status(r['Status']))
                         for r in d['paises']])
    c.inserir('estados', [dict(id=int(r['IDEstados']), pais_id=inteiro(pais_do_estado.get(r['IDEstados'])),
                               uf=txt(r['UF']), nome=txt(r['Nome']), status=status(r['Status']))
                          for r in d['estados']])

    # No banco antigo uma mesma cidade (ex.: "SANTA RITA") era ligada a vários estados.
    # Aqui cada par estado+cidade vira uma cidade própria.
    nomes = {r['IDCidades']: r for r in d['cidades']}
    estados_ok = {r['IDEstados'] for r in d['estados']}
    proximo = max(int(k) for k in nomes) + 1
    mapa_cidade = {}           # (estado_antigo, cidade_antiga) -> id novo
    primeira = {}              # cidade_antiga -> id novo (fallback)
    linhas = []
    for r in sorted(rel, key=lambda r: (int(r['IDCidades']), int(r['IDEstados']))):
        chave = (r['IDEstados'], r['IDCidades'])
        if chave in mapa_cidade or r['IDCidades'] not in nomes or r['IDEstados'] not in estados_ok:
            continue
        if r['IDCidades'] not in primeira:
            novo = int(r['IDCidades'])
            primeira[r['IDCidades']] = novo
        else:
            novo = proximo
            proximo += 1
        mapa_cidade[chave] = novo
        base = nomes[r['IDCidades']]
        linhas.append(dict(id=novo, estado_id=int(r['IDEstados']), nome=txt(base['Nome']),
                           status=status(base['Status'])))
    for cid, base in nomes.items():
        if cid not in primeira:
            primeira[cid] = int(cid)
            linhas.append(dict(id=int(cid), estado_id=None, nome=txt(base['Nome']), status=status(base['Status'])))
    c.inserir('cidades', linhas)

    # --- Arquivo final -------------------------------------------------------
    tabelas = list(c.contagem)
    with open(saida, 'w', encoding='utf-8', newline='\n') as f:
        f.write('-- Carga gerada por scripts/importar_dump.py — somente a localidade (países, estados, cidades).\n')
        for t, n in c.contagem.items():
            f.write(f'--   {t}: {n}\n')
        f.write('\nbegin;\n')
        # a carga não entra na auditoria
        for t in tabelas:
            f.write(f'alter table public.{t} disable trigger auditar;\n')
        f.write('\n' + '\n\n'.join(c.blocos) + '\n\n')
        for t in tabelas:
            f.write(f'alter table public.{t} enable trigger auditar;\n')
        for t in tabelas:
            f.write(f"select setval(pg_get_serial_sequence('public.{t}', 'id'), "
                    f"coalesce((select max(id) from public.{t}), 0) + 1, false);\n")
        f.write('commit;\n')
    return c.contagem


def _agrupar(linhas, chave, valor):
    g = defaultdict(Counter)
    for r in linhas:
        g[r[chave]][r[valor]] += 1
    return g


if __name__ == '__main__':
    contagem = gerar(sys.argv[1], sys.argv[2])
    for t, n in contagem.items():
        print(f'{t:28} {n:6}')
