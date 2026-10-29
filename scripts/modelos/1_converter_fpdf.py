"""Converte os geradores FPDF antigos em modelos de texto com marcação simples."""
import re, sys, os, json
BS = chr(92)

def php_str_to_tpl(expr):
    """Converte expressão PHP de string (com concatenações) em texto com {{campos}}."""
    expr = expr.strip()
    m = re.fullmatch(r'utf8_decode\((.*)\)', expr, re.S)
    if m: expr = m.group(1).strip()
    out = []
    i = 0
    partes = []
    # tokeniza respeitando aspas
    buf = ''; depth = 0; q = None
    toks = []
    j = 0
    while j < len(expr):
        c = expr[j]
        if q:
            buf += c
            if c == BS and j+1 < len(expr): buf += expr[j+1]; j += 2; continue
            if c == q: q = None
        elif c in '"\'':
            q = c; buf += c
        elif c == '(':
            depth += 1; buf += c
        elif c == ')':
            depth -= 1; buf += c
        elif c == '.' and depth == 0:
            toks.append(buf.strip()); buf = ''
        else:
            buf += c
        j += 1
    if buf.strip(): toks.append(buf.strip())
    for t in toks:
        if (t.startswith('"') and t.endswith('"')) or (t.startswith("'") and t.endswith("'")):
            out.append(t[1:-1].replace('\\"', '"'))
        else:
            r = re.search(r"\$registro\['(\w+)'\]", t)
            v = re.fullmatch(r'\$(\w+)', t)
            if 'valorPorExtenso' in t: out.append('{{EXTENSO:' + (r.group(1) if r else re.search(r'\$(\w+)', t).group(1)) + '}}')
            elif 'number_format' in t: out.append('{{MOEDA:' + (r.group(1) if r else re.search(r'\$(\w+)', t).group(1)) + '}}')
            elif 'converteData' in t and r: out.append('{{DATA:' + r.group(1) + '}}')
            elif r: out.append('{{' + r.group(1) + '}}')
            elif v: out.append('{{$' + v.group(1) + '}}')
            else: out.append('{{?' + t + '}}')
    return ''.join(out)

CALL = re.compile(r'\$pdf->(SetFont|Cell|MultiCell|Ln|AddPage|Row|SetWidths|Image)\s*\((.*?)\)\s*;\s*(?://.*)?$', re.S | re.M)

def split_args(s):
    args=[]; buf=''; depth=0; q=None
    for c in s:
        if q:
            buf+=c
            if c==q and not buf.endswith(BS+q): q=None
            continue
        if c in '"\'': q=c; buf+=c; continue
        if c in '([': depth+=1
        if c in ')]': depth-=1
        if c==',' and depth==0: args.append(buf.strip()); buf=''; continue
        buf+=c
    if buf.strip(): args.append(buf.strip())
    return args

def converter(caminho):
    src = open(caminho, encoding='utf-8', errors='replace').read()
    ini = src.find('$pdf->AddPage()')
    src = src[ini:]
    # junta chamadas multilinha: procura "$pdf->X(" até ");" balanceado
    linhas = []
    fonte = (9, '')
    i = 0
    assin = []
    while True:
        k = src.find('$pdf->', i)
        if k < 0: break
        m = re.match(r'\$pdf->(\w+)\s*\(', src[k:])
        if not m: i = k + 6; continue
        nome = m.group(1); j = k + m.end(); depth = 1; q = None
        while j < len(src) and depth:
            c = src[j]
            if q:
                if c == BS: j += 1
                elif c == q: q = None
            elif c in '"\'': q = c
            elif c == '(': depth += 1
            elif c == ')': depth -= 1
            j += 1
        args = split_args(src[k + m.end(): j - 1])
        i = j
        if nome == 'SetFont':
            estilo = args[1].strip('"\'') if len(args) > 1 else ''
            tam = int(args[2]) if len(args) > 2 and args[2].strip().isdigit() else 9
            fonte = (tam, estilo)
        elif nome in ('Cell', 'MultiCell'):
            if len(args) < 3: continue
            texto = php_str_to_tpl(args[2]).strip()
            borda = args[3].strip('"\' ') if len(args) > 3 else ''
            alinh = ''
            for a in args[4:]:
                a2 = a.strip('"\' ')
                if a2 in ('C', 'J', 'L', 'R'): alinh = a2
            if not texto:
                continue
            if borda == 'T' and len(texto) < 40:
                assin.append(texto); continue
            if assin:
                linhas.append('[assinaturas: ' + ' | '.join(assin) + ']'); assin = []
            tam, est = fonte
            if alinh == 'C' and tam >= 11: linhas.append('# ' + texto)
            elif alinh == 'C': linhas.append('^ ' + texto)
            elif 'B' in est: linhas.append('**' + texto + '**')
            else: linhas.append(texto)
        elif nome == 'Row':
            m2 = re.search(r'array\((.*)\)', ','.join(args), re.S)
            if m2:
                cels = [php_str_to_tpl(a) for a in split_args(m2.group(1))]
                linhas.append('| ' + ' | '.join(c.replace('|', '/') for c in cels))
        elif nome == 'AddPage' and linhas:
            if assin: linhas.append('[assinaturas: ' + ' | '.join(assin) + ']'); assin = []
            linhas.append('[pagina]')
    if assin: linhas.append('[assinaturas: ' + ' | '.join(assin) + ']')
    # remove duplicatas consecutivas de assinatura (o antigo desenhava em 2 colunas)
    saida = []
    for l in linhas:
        if saida and l == saida[-1] and l.startswith('[assinaturas'): continue
        saida.append(l)
    return '\n\n'.join(saida)

base = sys.argv[1]; dest = sys.argv[2]
for f in sorted(os.listdir(base)):
    if f.startswith('pdf') and f.endswith('.php') and 'complemento' not in f:
        t = converter(os.path.join(base, f))
        open(os.path.join(dest, f.replace('.php', '.txt')), 'w', encoding='utf-8').write(t)
        print(f, len(t), t.count('{{'))
