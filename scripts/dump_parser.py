"""Leitor do dump MySQL (phpMyAdmin) do sistema antigo."""
import re

INSERT_RE = re.compile(r"INSERT INTO `(\w+)` \(([^)]*)\) VALUES\s*", re.S)


def corrigir_texto(s):
    """Desfaz dupla codificação (UTF-8 lido como latin1), comum no dump antigo."""
    if s is None or not isinstance(s, str):
        return s
    if any(c in s for c in "ÃÂ"):
        try:
            return s.encode("cp1252").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            try:
                return s.encode("latin1").decode("utf-8")
            except (UnicodeEncodeError, UnicodeDecodeError):
                return s
    return s


def _ler_valor(txt, i):
    """Lê um valor SQL a partir de txt[i]; retorna (valor, novo_i)."""
    if txt[i] == "'":
        i += 1
        buf = []
        while True:
            c = txt[i]
            if c == "\\":
                n = txt[i + 1]
                buf.append({"n": "\n", "r": "\r", "t": "\t", "0": "\0", "Z": "\x1a"}.get(n, n))
                i += 2
            elif c == "'":
                if txt[i + 1] == "'":
                    buf.append("'")
                    i += 2
                else:
                    return corrigir_texto("".join(buf)), i + 1
            else:
                buf.append(c)
                i += 1
    j = i
    while txt[j] not in ",)":
        j += 1
    tok = txt[i:j].strip()
    if tok.upper() == "NULL":
        return None, j
    return tok, j


def ler_tabelas(caminho, somente=None):
    """Retorna {tabela: [dict(coluna->valor), ...]}."""
    txt = open(caminho, encoding="utf-8").read()
    dados = {}
    for m in INSERT_RE.finditer(txt):
        tabela = m.group(1)
        if somente and tabela not in somente:
            continue
        cols = [c.strip().strip("`") for c in m.group(2).split(",")]
        i = m.end()
        linhas = dados.setdefault(tabela, [])
        while True:
            while txt[i] in " \r\n\t,":
                i += 1
            if txt[i] == ";":
                break
            assert txt[i] == "(", (tabela, txt[i:i + 50])
            i += 1
            vals = []
            while True:
                while txt[i] in " \r\n\t":
                    i += 1
                v, i = _ler_valor(txt, i)
                vals.append(v)
                while txt[i] in " \r\n\t":
                    i += 1
                if txt[i] == ",":
                    i += 1
                    continue
                if txt[i] == ")":
                    i += 1
                    break
            linhas.append(dict(zip(cols, vals)))
    return dados
