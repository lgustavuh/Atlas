import os, re, sys
docs, saida = sys.argv[1], sys.argv[2]
MAPA = {
 'Nome':'nome','CTPS':'ctps','SerieCTPS':'ctps_serie','CargoRegistro':'cargo_registro','MOEDA:ValorCargoRegistro':'salario_registro',
 'EXTENSO:ValorCargoRegistro':'salario_registro_extenso','$HoraMensal':'unidade_salario','DATA:Admissao':'admissao',
 '$PrimeiraExperiencia':'primeira_experiencia','$DIA':'dia','?utf8_decode($mes)':'mes_extenso','$ANO':'ano',
 'UFEstadosObras':'obra_uf','NomeCidadesObras':'obra_cidade','RH':'rh','CPF':'cpf','$data':'data_hoje','UF':'uf',
 'Cidades':'cidade','RazaoSocial':'obra','Ficha':'ficha','SituacaoCivil':'estado_civil','Logradouro':'logradouro',
 'Bairro':'bairro','CEP':'cep','DATA:DataNascimento':'data_nascimento','DataNascimento':'idade','NomePai':'nome_pai',
 'NomePaiNacionalidade':'nacionalidade_pai','NomeMae':'nome_mae','NomeMaeNacionalidade':'nacionalidade_mae',
 'NomeNacionalidade':'nacionalidade','Cidade_Naturalidade':'naturalidade','UF_Naturalidade':'naturalidade_uf',
 'TituloEleitor':'titulo_eleitor','Reservista':'reservista','ReservistaCategoria':'reservista_categoria','RG':'rg',
 'PIS':'pis','CarteiraSaude':'carteira_saude','$dataadmissao':'admissao',
}
NOMES = {
 'acordocompensacaohoras':'Acordo de compensação de horas','autorizacaodepositoconta':'Autorização de depósito em conta',
 'comprovantedevolucaoctps':'Comprovante de devolução da CTPS','contratoctps':'Recibo de entrega da CTPS',
 'contratodeexperiencia':'Contrato de experiência','declaracaodisponibilidadeepi':'Declaração de disponibilidade de EPI',
 'declaracaotermovaletransporte':'Declaração / termo de vale-transporte','dependentesimpostoderenda':'Declaração de dependentes (IR)',
 'entregacracha':'Termo de entrega de crachá','ficharegistrofrente':'Ficha de registro (frente)',
 'integracaofuncionarios':'Integração de funcionários','integracaoseguranca':'Integração de segurança',
 'recebimentoepi':'Recebimento de EPI','recebimentoepi2':'Recebimento de EPI (modelo 2)','termocompromisso':'Termo de compromisso',
 'termodeciencia':'Termo de ciência','termosalariofamilia':'Termo de responsabilidade — salário-família',
 'testetoxicologico':'Autorização de teste toxicológico',
}
pendentes = {}
sql = ["-- Modelos dos documentos padronizados, convertidos dos geradores FPDF do sistema antigo.",
       "-- Podem ser editados pela tela Documentos → Modelos de documentos.", "",
       "insert into public.modelos_documentos (codigo, nome, conteudo) values"]
valores = []
for f in sorted(os.listdir(docs)):
    codigo = f[3:-4]
    t = open(os.path.join(docs, f), encoding='utf-8').read()
    blocos = t.split('\n\n')
    # dependentes: troca as 6 linhas fixas por uma tabela dinâmica
    idx = [i for i, b in enumerate(blocos) if re.fullmatch(r'\^ \{\{\$?(DATA:)?Dep\w+\}\}', b.strip())]
    if idx:
        ini, fim = idx[0], idx[-1]
        while ini > 0 and re.fullmatch(r'\^ (NOME|GRAU DE PARENTESCO|PARENTESCO|DATA DE NASCIMENTO|NOME DO FILHO\(A\))', blocos[ini-1].strip()):
            ini -= 1
        bloco = '[dependentes: salario_familia]' if 'salariofamilia' in codigo else '[dependentes]'
        blocos = blocos[:ini] + [bloco] + [b for b in blocos[fim+1:]]
    t = '\n\n'.join(blocos)
    # grade de EPI: as células soltas do FPDF viram uma tabela com linhas para preencher
    cab = ['EPI', 'CA', 'FABRICANTE', 'QTD', 'DATA', 'RECEB', 'DEVOL', 'TIPO\nDEVOL.', 'ASSINATURA']
    grade = '| EPI | CA | FABRICANTE | QTD | DATA RECEB. | DATA DEVOL. | TIPO DEVOL. | ASSINATURA\n' + '\n'.join(['| | | | | | | |'] * 22)
    seq = '\n\n'.join('^ ' + c for c in cab)
    if seq in t:
        # a primeira grade divide a página com o texto do termo: menos linhas
        t = t.replace(seq, grade.replace('\n'.join(['| | | | | | | |'] * 22), '\n'.join(['| | | | | | | |'] * 17)), 1).replace(seq, grade)
    elif codigo.startswith('recebimentoepi'):
        t = t + '\n\n[pagina]\n\n' + grade
    # linhas de assinatura muito longas estouravam a largura da página
    t = re.sub(r'_{60,}', '_' * 55, t)
    t = t.replace('**ASSINATURA DO FUNCIONÁRIO POR EXTENSO:', 'ASSINATURA DO FUNCIONÁRIO POR EXTENSO:\n\n**')
    # o original pedia "Empregador" duas vezes e nenhuma assinatura do empregado
    t = t.replace('[assinaturas: Testemunha | Empregador | Testemunha | Empregador]', '[assinaturas: Testemunha | Empregador | Testemunha | Empregado]')
    if codigo == 'ficharegistrofrente':
        t = open(sys.argv[3], encoding='utf-8').read().strip()
    def troca(m):
        k = m.group(1)
        if k in MAPA: return '{{' + MAPA[k] + '}}'
        pendentes.setdefault(k, []).append(codigo)
        return m.group(0)
    t = re.sub(r'\{\{([^}]+)\}\}', troca, t)
    # o nome da empresa vem do campo {{empresa}} (Atlas), não fica fixo no texto
    t = re.sub(r'ETC\s*INDUSTRIAL(\s+LTDA\.?)?(\s*-\s*ME)?', '{{empresa}}', t, flags=re.I)
    # CNPJ e endereço da empresa também viram campos (configurados no .env)
    for antigo, novo in [
        ('estabelecida em Itaú de Minas à rua Dr. Jorge Dias de Oliva, nº 382', 'estabelecida em {{empresa_cidade}} à {{empresa_endereco}}'),
        ('com sede em ITAÚ DE MINAS à rua DR. JORGE DIAS DE OLIVA. nº 382', 'com sede em {{empresa_cidade}} à {{empresa_endereco}}'),
        ('^ RUA: DR. JORGE DIAS DE OLIVA, 382', '^ {{empresa_endereco}}'),
        ('ITAÚ DE MINAS / MG', '{{empresa_cidade}} / {{empresa_uf}}'),
        ('ITAÚ DE MINAS, {{dia}}', '{{empresa_cidade}}, {{dia}}'),
    ]:
        t = t.replace(antigo, novo)
    t = t.replace('23.213.150/0001-89', '{{empresa_cnpj}}')
    t = re.sub(r'\bETC (\d{3}/\d{2})', r'ATLAS \1', t)  # códigos de procedimentos internos
    t = t.replace('# ______________________________________,________de____________________de________.',
                  '^ ______________________________________, ________ de ____________________ de ________.')
    valores.append("('%s', '%s', '%s')" % (codigo, NOMES.get(codigo, codigo).replace("'", "''"), t.replace("'", "''")))
sql.append(',\n'.join(valores) + '\non conflict (codigo) do nothing;')
open(saida, 'w', encoding='utf-8', newline='\n').write('\n'.join(sql) + '\n')
print('pendentes:', pendentes)
