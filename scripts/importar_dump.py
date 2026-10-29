"""Gera o SQL de carga com os dados NÃO pessoais do dump do sistema antigo.

Uso:  python -I importar_dump.py <caminho/localhost.sql> <saida.sql>

Ficam de fora (só a estrutura é recriada): colaboradores e tudo ligado a eles
(profissional, segurança, atestados, férias, advertências, classificação,
documentos, fotos), usuários/senhas, logs, alertas, compartilhamentos e
alçadas. Fornecedores pessoa física (ou com CPF no lugar do CNPJ) também ficam de fora, e dos fornecedores
pessoa jurídica são removidos o nome do contato e os celulares.
Nas compras, as referências a pessoas (solicitante, comprador, aprovador...)
ficam vazias.
"""
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dump_parser import ler_tabelas  # noqa: E402

TABELAS = [
    'paises', 'estados', 'cidades', 'relacionamentocidades', 'cargos', 'obras', 'grupofornecedores',
    'fornecedores', 'relacionamentofornecedores', 'materiaisgrupos', 'materiais', 'materiaisrelacionamento',
    'veiculos', 'manutencaoveiculos', 'republica', 'bibliotecapadraoareas', 'requisicao', 'requisicaoitens',
    'requisicaohistorico', 'requisicaoconcluida', 'orcamentor', 'orcamentoritens', 'pedidocompra',
    'pedidocomprahistorico', 'requisicaostatus', 'requisicaorecebimentoitens',
]


def sql(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


NOME_ANTIGO = re.compile(r'ETC\s*INDUSTRIAL(\s+LTDA\.?)?(\s*-\s*ME)?', re.I)
# "da ETC", "pela ETC"... (não confunde com "etc." de et cetera)
ETC_EMPRESA = re.compile(r'\b(da|a|pela|na|para a|conta)\s+ETC\b', re.I)
ETC_CODIGO = re.compile(r'\bETC (\d{2,3})\b')  # patrimônio: "ESCADA ... ETC 02"


def txt(v):
    v = (v or '').strip() if isinstance(v, str) or v is None else str(v)
    if v:
        # o sistema agora se chama Atlas
        v = NOME_ANTIGO.sub('ATLAS', v)
        v = ETC_EMPRESA.sub(lambda m: f'{m.group(1)} ATLAS', v)
        v = ETC_CODIGO.sub(r'ATLAS \1', v)
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


def data(v):
    v = txt(v)
    if not v or v.startswith('0000'):
        return None
    try:
        a, m, d = (int(x) for x in v.split('-'))
        return date(a, m, d).isoformat()
    except ValueError:
        return None


def data_hora(d, h):
    d = data(d)
    if not d:
        return None
    h = txt(h) or '00:00:00'
    return f'{d} {h}-03'


def status(v):
    v = (txt(v) or '').lower()
    if v.startswith('desativ'):
        return 'desativado'
    if v.startswith('hist'):
        return 'historico'
    return 'ativo'


def sim(v):
    v = (txt(v) or '').upper()
    if v in ('SIM', 'S'):
        return True
    if v in ('NAO', 'NÃO', 'N'):
        return False
    return None


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

    def cidade(estado, cid):
        if not cid:
            return None
        return mapa_cidade.get((estado, cid)) or primeira.get(cid)

    # --- Cadastros base ---------------------------------------------------
    c.inserir('cargos', [dict(id=int(r['IDCargo']), nome=txt(r['Cargo']) or 'SEM NOME', funcao=txt(r['Funcao']),
                              salario=num(r['Salario']), status=status(r['Status'])) for r in d['cargos']])

    obras = {}
    for r in d['obras']:
        obras[r['IDObra']] = dict(
            id=int(r['IDObra']), codigo=inteiro(r['CodObra']) or 0, razao_social=txt(r['RazaoSocial']) or 'SEM NOME',
            cnpj=txt(r['CNPJ']), inscricao_estadual=txt(r['InscricaoEstadual']), logradouro=txt(r['Logradouro']),
            complemento=txt(r['Complemento']), bairro=txt(r['Bairro']), cep=txt(r['CEP']),
            cidade_id=cidade(r['IDEstados'], r['IDCidades']), status=status(r['Status']))
    c.inserir('obras', list(obras.values()))

    grupos_f = {r['IDGrupoFornecedores'] for r in d['grupofornecedores']}
    c.inserir('grupos_fornecedores', [dict(id=int(r['IDGrupoFornecedores']), nome=txt(r['NomeGrupo']) or 'SEM NOME',
                                           descricao=txt(r['Descricao']), status=status(r['Status']))
                                      for r in d['grupofornecedores']])

    fornecedores = {}
    pf_excluidos = 0
    for r in d['fornecedores']:
        tipo = (r['TipoCadastro'] or '').upper()
        doc = ''.join(ch for ch in (r['CNPJ'] or '') + (r['CPF'] or '') if ch.isdigit())
        # Pessoa física (inclusive as cadastradas como PJ com CPF no campo CNPJ) fica de fora.
        nome_com_cpf = re.search(r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}', (r['RazaoSocial'] or '') + ' ' + (r['NomeUsual'] or ''))
        if 'FÍSICA' in tipo or 'FISICA' in tipo or len(doc) == 11 or nome_com_cpf:
            pf_excluidos += 1
            continue
        fornecedores[r['IDFornecedores']] = dict(
            id=int(r['IDFornecedores']), tipo='PJ', razao_social=txt(r['RazaoSocial']) or txt(r['NomeUsual']) or 'SEM NOME',
            nome_usual=txt(r['NomeUsual']), cnpj=txt(r['CNPJ']), inscricao_estadual=txt(r['InscEstadual']),
            endereco=txt(r['Endereco']), bairro=txt(r['Bairro']), cep=txt(r['CEP']),
            cidade_id=cidade(r['IDEstados'], r['IDCidades']), referencia=txt(r['Referencia']),
            telefones=txt(r['Telefones']), telefone1=txt(r['FTelFixo1']), telefone2=txt(r['FTelFixo2']),
            telefone_outro1=txt(r['FTelOutros1']), telefone_outro2=txt(r['FTelOutros2']), ramal=txt(r['Ramal']),
            fax=txt(r['Fax']), site=txt(r['Site']), email=txt(r['Email']), obs=txt(r['ObsFornecedores']),
            data_cadastro=data(r['FDataCadastro']), data_alerta=data(r['FDataAlerta']), status=status(r['Status']))
    c.inserir('fornecedores', list(fornecedores.values()))

    def forn(v):
        return int(v) if v in fornecedores else None

    c.inserir('fornecedores_grupos', _unicos(
        [dict(fornecedor_id=int(r['IDFornecedores']), grupo_id=int(r['IDGruposFornecedores']))
         for r in d['relacionamentofornecedores']
         if status(r['Status']) == 'ativo' and r['IDFornecedores'] in fornecedores and r['IDGruposFornecedores'] in grupos_f],
        ('fornecedor_id', 'grupo_id')))

    grupos_m = {r['IDMG'] for r in d['materiaisgrupos']}
    materiais = {r['IDM'] for r in d['materiais']}
    c.inserir('materiais_grupos', [dict(id=int(r['IDMG']), nome=txt(r['NomeMG']) or 'SEM NOME', status=status(r['StatusMG']))
                                   for r in d['materiaisgrupos']])
    c.inserir('materiais', [dict(id=int(r['IDM']), nome=txt(r['NomeM']) or 'SEM NOME', status=status(r['StatusM']))
                            for r in d['materiais']])
    c.inserir('materiais_grupos_itens', _unicos(
        [dict(grupo_id=int(r['IDMG']), material_id=int(r['IDM'])) for r in d['materiaisrelacionamento']
         if status(r['StatusRM']) == 'ativo' and r['IDMG'] in grupos_m and r['IDM'] in materiais],
        ('grupo_id', 'material_id')))

    # --- Veículos e repúblicas ---------------------------------------------
    veiculos = {}
    for r in d['veiculos']:
        veiculos[r['IDVeiculos']] = dict(
            id=int(r['IDVeiculos']), concessionaria_id=forn(r['IDFornecConcessionaria']),
            corretora_id=forn(r['IDFornecCorretora']), cidade_id=cidade(r['IDEstados'], r['IDCidades']),
            modelo=txt(r['Modelo']), marca=txt(r['Marca']), placa=txt(r['Placa']), chassi=txt(r['Chassi']),
            renavam=txt(r['Renavan']), motor=txt(r['Motor']), cor=txt(r['Cor']), combustivel=txt(r['Combustivel']),
            ano_fabricacao=inteiro(r['AnoFab']), ano_modelo=inteiro(r['AnoModelo']), km_inicial=num(r['KMInicial']),
            lotacao=inteiro(r['Lotacao']), data_compra=data(r['DataCompra']), valor=num(r['ValorVeiculo']),
            seguradora=txt(r['Seguradora']), seguro_inicio=data(r['InicioVigenciaSeguro']),
            seguro_termino=data(r['TerminoVigenciaSeguro']), telefone_sinistro=txt(r['TelefoneSinistro']),
            obs=txt(r['ObsVeiculos']), status=status(r['Status']))
    c.inserir('veiculos', list(veiculos.values()))

    def grp(v):
        return int(v) if v in grupos_f else None

    c.inserir('manutencoes_veiculos', [dict(
        id=int(r['IDManutencaoVeiculos']), veiculo_id=int(r['IDVeiculos']), grupo_peca_id=grp(r['IDGrupoPeca']),
        fornecedor_peca_id=forn(r['IDFornecedorPeca']), grupo_servico_id=grp(r['IDGrupoServico']),
        fornecedor_servico_id=forn(r['IDFornecedorServico']), data_conserto=data(r['DataConserto']),
        descricao_pecas=txt(r['DescricaoPecas']), descricao_servico=txt(r['DescricaoServico']),
        nf_pecas=txt(r['NFPecas']), nf_servico=txt(r['NFServico']), valor_pecas=num(r['ValorPecas']),
        valor_servico=num(r['ValorServico']), obs=txt(r['ObsManutencao']), status=status(r['Status']))
        for r in d['manutencaoveiculos'] if r['IDVeiculos'] in veiculos])

    c.inserir('republicas', [dict(
        id=int(r['IDRepublica']), obra_id=int(r['RepIDObra']) if r['RepIDObra'] in obras else None,
        imobiliaria_id=forn(r['IDFornecNomeImobiliaria']), nome=txt(r['NomeRepublica']) or 'SEM NOME',
        lotacao=inteiro(r['LotacaoTotal']), endereco=txt(r['Endereco']), complemento=txt(r['Complemento']),
        bairro=txt(r['Bairro']), cep=txt(r['CEP']), cidade_id=cidade(r['IDEstados'], r['IDCidades']),
        periodo_contrato=txt(r['PeriodoContrato']), valor_aluguel=num(r['ValorAluguel']),
        data_previsao_entrega=data(r['DataPrevisaoEntrega']), data_alerta=data(r['DataPrevisaoEntregaAlerta']),
        entrega_concluida=bool(sim(r['DPEAConcluido'])), data_devolucao=data(r['DataDevolucaoImovel']),
        dia_pagamento=txt(r['DiaPagamento']), forma_pagamento=txt(r['FormaPagamento']), obs=txt(r['ObsRep']),
        status=status(r['Status'])) for r in d['republica']])

    c.inserir('biblioteca_areas', [dict(id=int(r['IDBPA']), nome=txt(r['NomeBPA']) or 'SEM NOME',
                                        status=status(r['StatusBPA'])) for r in d['bibliotecapadraoareas']])

    # --- Compras (histórico, sem pessoas) ----------------------------------
    concluidas = {r['IDRRC']: data_hora(r['DataRC'], r['HoraRC']) for r in d['requisicaoconcluida']
                  if status(r['StatusRC']) == 'ativo'}
    mapa_req = {'ativado': 'aberta', 'finalizada': 'aguardando_liberacao', 'liberado': 'liberada',
                'naoliberado': 'nao_liberada'}
    requisicoes = {}
    for r in d['requisicao']:
        if r['IDObraSeraEnviadoMateriaisR'] not in obras:
            continue
        st = mapa_req.get((txt(r['StatusR']) or 'ativado').lower(), 'aberta')
        if r['IDR'] in concluidas and st == 'liberada':
            st = 'concluida'
        requisicoes[r['IDR']] = dict(
            id=int(r['IDR']), solicitante_id=None, obra_id=int(r['IDObraSeraEnviadoMateriaisR']),
            data=data_hora(r['DataR'], r['HoraR']) or '2014-01-01 00:00:00-03', urgente=bool(sim(r['UrgenteR'])),
            obs=txt(r['ObsR']), status=st, concluida_em=concluidas.get(r['IDR']) if st == 'concluida' else None)
    c.inserir('requisicoes', list(requisicoes.values()))

    itens = {}
    for r in d['requisicaoitens']:
        q = num(r['QuantidadeRI'])
        if r['IDR'] not in requisicoes or not q or q <= 0:
            continue
        lib = {'liberado': True, 'naoliberado': False}.get((txt(r['StatusRI']) or '').lower())
        itens[r['IDRI']] = dict(
            id=int(r['IDRI']), requisicao_id=int(r['IDR']),
            material_id=int(r['ItensIDMRI']) if r['ItensIDMRI'] in materiais else None,
            grupo_id=int(r['GruposIDMGRI']) if r['GruposIDMGRI'] in grupos_m else None,
            quantidade=q, unidade=txt(r['UnidadeMedidaRI']), obs=txt(r['ObsRI']), liberado=lib)
    c.inserir('requisicao_itens', list(itens.values()))

    c.inserir('requisicao_historico', [dict(
        id=int(r['IDH']), requisicao_id=int(r['IDRH']),
        acao={True: 'liberada', False: 'nao_liberada'}.get(sim(r['LiberadoH']), 'finalizada'),
        motivo=txt(r['MotivoNaoLiberadoH']), criado_em=data_hora(r['DataH'], r['HoraH']) or '2014-01-01 00:00:00-03')
        for r in d['requisicaohistorico'] if r['IDRH'] in requisicoes])

    orcamentos = {}
    for r in d['orcamentor']:
        if r['IDROR'] not in requisicoes:
            continue
        orcamentos[r['IDOR']] = dict(
            id=int(r['IDOR']), requisicao_id=int(r['IDROR']), comprador_id=None,
            fornecedor_id=forn(r['IDFornecedoresOR']), data=data_hora(r['DataOR'], r['HoraOR']) or '2014-01-01 00:00:00-03',
            tipo_condicao_pagamento=txt(r['TipoCondicaoPagtoOR']), condicao_pagamento=txt(r['CondicaoPagtoOR']),
            prazo_entrega=txt(r['PrazoEntregaOR']),
            tipo_frete=txt(r['TipoFreteOR']) if txt(r['TipoFreteOR']) in ('CIF', 'FOB') else None,
            frete_cidade_id=cidade(r['IDEstadoFreteOR'], r['IDCidadeFreteOR']), valor_frete=num(r['ValorFreteOR']) or 0,
            obs=txt(r['ObsOR']), status='finalizado' if (txt(r['StatusOR']) or '').lower() == 'finalizado' else 'aberto')
    c.inserir('orcamentos', list(orcamentos.values()))

    vistos = set()
    linhas = []
    for r in d['orcamentoritens']:
        chave = (r['IDORORI'], r['IDRIORI'])
        if r['IDORORI'] not in orcamentos or r['IDRIORI'] not in itens or chave in vistos:
            continue
        vistos.add(chave)
        linhas.append(dict(
            id=int(r['IDORI']), orcamento_id=int(r['IDORORI']), requisicao_item_id=int(r['IDRIORI']),
            quantidade=num(r['QuantidadeORI']) or 0, unidade=txt(r['UnidadeMedidaORI']),
            perc_ipi=num(r['PorcIPIORI']) or 0, perc_icms=num(r['PorcICMSORI']) or 0, perc_pis=num(r['PorcPISORI']) or 0,
            perc_cofins=num(r['PorcCofinsORI']) or 0, perc_issqn=num(r['PorcISSQNORI']) or 0,
            valor_ipi=num(r['ValorIPIORI']) or 0, valor_icms=num(r['ValorICMSORI']) or 0,
            valor_pis=num(r['ValorPISORI']) or 0, valor_cofins=num(r['ValorCofinsORI']) or 0,
            valor_issqn=num(r['ValorISSQNORI']) or 0, valor_unitario=num(r['ValorUnORI']) or 0,
            item_pedido=bool(sim(r['ItemPedidoORI']))))
    c.inserir('orcamento_itens', linhas)

    mapa_ped = {'aprovado': 'aprovado', 'finalizado': 'aguardando_aprovacao', 'ativado': 'aberto',
                'naoaprovado': 'reprovado'}
    pedidos = {}
    for r in d['pedidocompra']:
        if r['IDRPC'] not in requisicoes or r['IDORPC'] not in orcamentos:
            continue
        pedidos[r['IDPC']] = dict(
            id=int(r['IDPC']), requisicao_id=int(r['IDRPC']), orcamento_id=int(r['IDORPC']),
            data=data_hora(r['DataPC'], r['HoraPC']) or '2014-01-01 00:00:00-03',
            status=mapa_ped.get((txt(r['StatusPC']) or '').lower(), 'aberto'), criado_por=None)
    c.inserir('pedidos', list(pedidos.values()))

    c.inserir('pedido_historico', [dict(
        id=int(r['IDPCH']), pedido_id=int(r['IDPCPCH']),
        acao='aprovado' if sim(r['AprovadoPCH']) else 'reprovado', valor=num(r['ValorAprovacaoPCH']),
        criado_em=data_hora(r['DataPCH'], r['HoraPCH']) or '2014-01-01 00:00:00-03')
        for r in d['pedidocomprahistorico'] if r['IDPCPCH'] in pedidos])

    mapa_sit = {'1': 'comprado', '2': 'enviado_parcial', '3': 'enviado_total', '4': 'enviado_estoque',
                '5': 'comprado_parcial'}
    c.inserir('requisicao_situacoes', [dict(
        id=int(r['IDRS']), requisicao_id=int(r['IDRRS']), situacao=mapa_sit[txt(r['SituacaoRS'])],
        status=status(r['StatusRS']), criado_em=data_hora(r['DataRS'], r['HoraRS']) or '2014-01-01 00:00:00-03')
        for r in d['requisicaostatus'] if r['IDRRS'] in requisicoes and txt(r['SituacaoRS']) in mapa_sit])

    receb = {}
    for r in sorted(d['requisicaorecebimentoitens'], key=lambda r: int(r['IDRRI'])):
        if status(r['StatusRRI']) != 'ativo' or r['IDRIRRI'] not in itens:
            continue
        sit = (txt(r['SituacaoRRI']) or '').lower()
        if sit not in ('atendido', 'naoatendido'):
            continue
        receb[r['IDRIRRI']] = dict(
            id=int(r['IDRRI']), requisicao_id=itens[r['IDRIRRI']]['requisicao_id'], requisicao_item_id=int(r['IDRIRRI']),
            nf_origem={'ETCINDUSTRIAL': 'atlas', 'ATLAS': 'atlas', 'FORNECEDOR': 'fornecedor'}.get(txt(r['NFdeQuemRRI'])),
            numero_nf=txt(r['NumeroNFRRI']), situacao='atendido' if sit == 'atendido' else 'nao_atendido',
            motivo_nao_atendido=txt(r['MotivoNaoAtendidoRRI']) or ('Não informado' if sit != 'atendido' else None),
            criado_em=data_hora(r['DataBaixaRRI'], r['HoraBaixaRRI']) or '2014-01-01 00:00:00-03')
    c.inserir('recebimentos', list(receb.values()))

    # --- Arquivo final -------------------------------------------------------
    tabelas = list(c.contagem)
    with open(saida, 'w', encoding='utf-8', newline='\n') as f:
        f.write('-- Carga gerada por scripts/importar_dump.py — somente dados não pessoais.\n')
        f.write(f'-- Fornecedores pessoa física excluídos: {pf_excluidos}\n')
        for t, n in c.contagem.items():
            f.write(f'--   {t}: {n}\n')
        f.write('\nbegin;\n')
        # a carga não entra na auditoria (as tabelas de histórico não têm esse gatilho)
        auditadas = [t for t in tabelas if t not in ('requisicao_historico', 'pedido_historico')]
        for t in auditadas:
            f.write(f'alter table public.{t} disable trigger auditar;\n')
        f.write('\n' + '\n\n'.join(c.blocos) + '\n\n')
        for t in auditadas:
            f.write(f'alter table public.{t} enable trigger auditar;\n')
        for t in tabelas:
            if t in ('fornecedores_grupos', 'materiais_grupos_itens'):
                continue
            f.write(f"select setval(pg_get_serial_sequence('public.{t}', 'id'), "
                    f"coalesce((select max(id) from public.{t}), 0) + 1, false);\n")
        f.write('commit;\n')
    return c.contagem, pf_excluidos


def _agrupar(linhas, chave, valor):
    g = defaultdict(Counter)
    for r in linhas:
        g[r[chave]][r[valor]] += 1
    return g


def _unicos(linhas, chaves):
    vistos, saida = set(), []
    for r in linhas:
        k = tuple(r[c] for c in chaves)
        if k not in vistos:
            vistos.add(k)
            saida.append(r)
    return saida


if __name__ == '__main__':
    contagem, pf = gerar(sys.argv[1], sys.argv[2])
    for t, n in contagem.items():
        print(f'{t:28} {n:6}')
    print(f'fornecedores PF excluídos: {pf}')
