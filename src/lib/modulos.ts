import type { RefChave } from './refs';

/**
 * Catálogo das telas de cadastro. Cada entrada gera lista, formulário,
 * desativação/reativação e exportação — o equivalente às pastas
 * cad*.php / lista*.php / alt*.php / *Desativados do sistema antigo.
 */
export type TipoCampo =
  | 'texto' | 'textarea' | 'numero' | 'moeda' | 'data' | 'booleano' | 'opcoes' | 'ref' | 'arquivo'
  | 'email' | 'telefone' | 'cep' | 'cpf' | 'cnpj' | 'placa';

export type Campo = {
  nome: string;
  rotulo: string;
  tipo: TipoCampo;
  ref?: RefChave;
  opcoes?: { valor: string; rotulo: string }[];
  obrigatorio?: boolean;
  lista?: boolean;          // aparece como coluna na listagem
  largura?: 1 | 2 | 3;      // colunas ocupadas no formulário (grade de 3)
  ajuda?: string;
  somenteLeitura?: boolean;
  secao?: string;           // inicia um bloco no formulário
  pasta?: string;           // tipo 'arquivo': pasta inicial no armazenamento
};

export type Vinculo = {
  titulo: string;
  tabela: string;
  chavePai: string;
  chaveOutro: string;
  ref: RefChave;
};

export type Modulo = {
  chave: string;
  titulo: string;
  singular: string;
  tabela: string;
  permissao: string;
  grupo: string;
  campos: Campo[];
  busca: string[];
  ordem: { coluna: string; asc?: boolean };
  pk?: string;
  temStatus?: boolean;      // padrão: true
  historico?: boolean;      // registros com status "historico"
  rotulo: string;           // coluna usada como título do registro
  oculto?: boolean;         // não aparece no menu (acessado pela ficha)
  vinculos?: Vinculo[];
  linkDetalhe?: (id: string | number) => string;
};

const sn = [
  { valor: 'true', rotulo: 'Sim' },
  { valor: 'false', rotulo: 'Não' },
];
export const SIM_NAO = sn;

const colaborador: Campo = { nome: 'colaborador_id', rotulo: 'Colaborador', tipo: 'ref', ref: 'colaboradores', obrigatorio: true, lista: true, largura: 2 };
const endereco = (prefixo = ''): Campo[] => [
  { nome: `${prefixo}logradouro`, rotulo: 'Logradouro', tipo: 'texto', largura: 2, secao: 'Endereço' },
  { nome: `${prefixo}complemento`, rotulo: 'Complemento', tipo: 'texto' },
  { nome: `${prefixo}bairro`, rotulo: 'Bairro', tipo: 'texto' },
  { nome: `${prefixo}cep`, rotulo: 'CEP', tipo: 'cep' },
  { nome: `${prefixo}cidade_id`, rotulo: 'Cidade', tipo: 'ref', ref: 'cidades' },
];
const arquivo = (pasta: string): Campo => ({ nome: 'arquivo_path', rotulo: 'Arquivo', tipo: 'arquivo', pasta, largura: 3 });

export const MODULOS: Modulo[] = [
  // ------------------------------------------------------------- Clientes
  {
    chave: 'obras', titulo: 'Obras', singular: 'Obra', tabela: 'obras', permissao: 'obras', grupo: 'Clientes',
    rotulo: 'razao_social', busca: ['razao_social', 'cnpj'], ordem: { coluna: 'codigo' },
    campos: [
      { nome: 'codigo', rotulo: 'Código', tipo: 'numero', obrigatorio: true, lista: true },
      { nome: 'razao_social', rotulo: 'Razão social', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj', lista: true },
      { nome: 'inscricao_estadual', rotulo: 'Inscrição estadual', tipo: 'texto' },
      ...endereco(),
    ],
  },
  {
    chave: 'republicas', titulo: 'Repúblicas', singular: 'República', tabela: 'republicas', permissao: 'republicas',
    grupo: 'Clientes', rotulo: 'nome', busca: ['nome', 'endereco'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'obra_id', rotulo: 'Obra', tipo: 'ref', ref: 'obras', lista: true },
      { nome: 'lotacao', rotulo: 'Lotação total', tipo: 'numero', lista: true },
      { nome: 'lider_id', rotulo: 'Líder', tipo: 'ref', ref: 'colaboradores' },
      { nome: 'administrador_id', rotulo: 'Administrador', tipo: 'ref', ref: 'colaboradores' },
      { nome: 'imobiliaria_id', rotulo: 'Imobiliária', tipo: 'ref', ref: 'fornecedores', largura: 2 },
      { nome: 'endereco', rotulo: 'Endereço', tipo: 'texto', largura: 2, secao: 'Endereço' },
      { nome: 'complemento', rotulo: 'Complemento', tipo: 'texto' },
      { nome: 'bairro', rotulo: 'Bairro', tipo: 'texto' },
      { nome: 'cep', rotulo: 'CEP', tipo: 'cep' },
      { nome: 'cidade_id', rotulo: 'Cidade', tipo: 'ref', ref: 'cidades' },
      { nome: 'periodo_contrato', rotulo: 'Período do contrato', tipo: 'texto', secao: 'Contrato' },
      { nome: 'valor_aluguel', rotulo: 'Valor do aluguel', tipo: 'moeda', lista: true },
      { nome: 'dia_pagamento', rotulo: 'Dia de pagamento', tipo: 'texto' },
      { nome: 'forma_pagamento', rotulo: 'Forma de pagamento', tipo: 'texto' },
      { nome: 'data_previsao_entrega', rotulo: 'Previsão de entrega do imóvel', tipo: 'data' },
      { nome: 'data_alerta', rotulo: 'Data de alerta', tipo: 'data' },
      { nome: 'entrega_concluida', rotulo: 'Entrega concluída', tipo: 'booleano' },
      { nome: 'data_devolucao', rotulo: 'Data de devolução', tipo: 'data' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'transporte', titulo: 'Transporte e hospedagem', singular: 'Lançamento', tabela: 'transporte_hospedagem',
    permissao: 'transporte_hospedagem', grupo: 'Clientes', rotulo: 'id', busca: [], ordem: { coluna: 'data_ida', asc: false },
    campos: [
      colaborador,
      { nome: 'obra_id', rotulo: 'Obra', tipo: 'ref', ref: 'obras', lista: true },
      { nome: 'veiculo_id', rotulo: 'Veículo', tipo: 'ref', ref: 'veiculos', lista: true },
      { nome: 'republica_id', rotulo: 'República', tipo: 'ref', ref: 'republicas', lista: true },
      { nome: 'data_ida', rotulo: 'Ida', tipo: 'data', lista: true },
      { nome: 'data_volta', rotulo: 'Volta', tipo: 'data', lista: true },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  // ------------------------------------------------------------- Cadastros
  {
    chave: 'fornecedores', titulo: 'Fornecedores', singular: 'Fornecedor', tabela: 'fornecedores', permissao: 'fornecedores',
    grupo: 'Cadastros', rotulo: 'razao_social', busca: ['razao_social', 'nome_usual', 'cnpj'], ordem: { coluna: 'razao_social' },
    vinculos: [{ titulo: 'Grupos do fornecedor', tabela: 'fornecedores_grupos', chavePai: 'fornecedor_id', chaveOutro: 'grupo_id', ref: 'grupos_fornecedores' }],
    campos: [
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', obrigatorio: true, opcoes: [{ valor: 'PJ', rotulo: 'Pessoa jurídica' }, { valor: 'PF', rotulo: 'Pessoa física' }] },
      { nome: 'razao_social', rotulo: 'Razão social / nome', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'nome_usual', rotulo: 'Nome usual', tipo: 'texto', lista: true },
      { nome: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj', lista: true },
      { nome: 'inscricao_estadual', rotulo: 'Inscrição estadual', tipo: 'texto' },
      { nome: 'cpf', rotulo: 'CPF', tipo: 'cpf' },
      { nome: 'rg', rotulo: 'RG', tipo: 'texto' },
      { nome: 'endereco', rotulo: 'Endereço', tipo: 'texto', largura: 2, secao: 'Endereço' },
      { nome: 'bairro', rotulo: 'Bairro', tipo: 'texto' },
      { nome: 'cep', rotulo: 'CEP', tipo: 'cep' },
      { nome: 'cidade_id', rotulo: 'Cidade', tipo: 'ref', ref: 'cidades', lista: true },
      { nome: 'referencia', rotulo: 'Referência', tipo: 'texto' },
      { nome: 'telefone1', rotulo: 'Telefone', tipo: 'telefone', secao: 'Contato', lista: true },
      { nome: 'telefone2', rotulo: 'Telefone 2', tipo: 'telefone' },
      { nome: 'ramal', rotulo: 'Ramal', tipo: 'texto' },
      { nome: 'celular1', rotulo: 'Celular', tipo: 'telefone' },
      { nome: 'operadora1', rotulo: 'Operadora', tipo: 'texto' },
      { nome: 'fax', rotulo: 'Fax', tipo: 'telefone' },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
      { nome: 'site', rotulo: 'Site', tipo: 'texto' },
      { nome: 'contato', rotulo: 'Pessoa de contato', tipo: 'texto' },
      { nome: 'telefones', rotulo: 'Outros telefones', tipo: 'texto', largura: 2 },
      { nome: 'data_alerta', rotulo: 'Data de alerta', tipo: 'data', ajuda: 'Aparece no painel para revisar o cadastro.' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'grupos-fornecedores', titulo: 'Grupos de fornecedores', singular: 'Grupo', tabela: 'grupos_fornecedores',
    permissao: 'fornecedores', grupo: 'Cadastros', rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'texto', lista: true, largura: 2 },
    ],
  },
  {
    chave: 'paises', titulo: 'Países', singular: 'País', tabela: 'paises', permissao: 'localidade', grupo: 'Cadastros',
    rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    campos: [{ nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true }],
  },
  {
    chave: 'estados', titulo: 'Estados', singular: 'Estado', tabela: 'estados', permissao: 'localidade', grupo: 'Cadastros',
    rotulo: 'nome', busca: ['nome', 'uf'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'uf', rotulo: 'UF', tipo: 'texto', obrigatorio: true, lista: true },
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true },
      { nome: 'pais_id', rotulo: 'País', tipo: 'ref', ref: 'paises', lista: true },
    ],
  },
  {
    chave: 'cidades', titulo: 'Cidades', singular: 'Cidade', tabela: 'cidades', permissao: 'localidade', grupo: 'Cadastros',
    rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'estado_id', rotulo: 'Estado', tipo: 'ref', ref: 'estados', obrigatorio: true, lista: true },
    ],
  },
  // ------------------------------------------------------------- Departamento Pessoal
  {
    chave: 'cargos', titulo: 'Cargos', singular: 'Cargo', tabela: 'cargos', permissao: 'cargos', grupo: 'Departamento Pessoal',
    rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'nome', rotulo: 'Cargo', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'salario', rotulo: 'Salário base', tipo: 'moeda', lista: true, ajuda: 'Abaixo de R$ 50,00 é tratado como valor por hora nos contratos.' },
      { nome: 'funcao', rotulo: 'Descrição da função', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'colaboradores', titulo: 'Colaboradores', singular: 'Colaborador', tabela: 'colaboradores', permissao: 'colaboradores',
    grupo: 'Departamento Pessoal', rotulo: 'nome', busca: ['nome', 'apelido', 'cpf'], ordem: { coluna: 'nome' },
    linkDetalhe: (id) => `/colaboradores/${id}`,
    campos: [
      { nome: 'nome', rotulo: 'Nome completo', tipo: 'texto', obrigatorio: true, lista: true, largura: 2, secao: 'Identificação' },
      { nome: 'apelido', rotulo: 'Apelido', tipo: 'texto', lista: true },
      { nome: 'cpf', rotulo: 'CPF', tipo: 'cpf', lista: true },
      { nome: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'data' },
      { nome: 'estado_civil', rotulo: 'Estado civil', tipo: 'opcoes', opcoes: ['SOLTEIRO(A)', 'CASADO(A)', 'DIVORCIADO(A)', 'VIÚVO(A)', 'UNIÃO ESTÁVEL'].map((v) => ({ valor: v, rotulo: v })) },
      { nome: 'nacionalidade', rotulo: 'Nacionalidade', tipo: 'texto' },
      { nome: 'naturalidade_cidade_id', rotulo: 'Naturalidade', tipo: 'ref', ref: 'cidades' },
      { nome: 'formacao', rotulo: 'Formação', tipo: 'texto' },
      { nome: 'nome_pai', rotulo: 'Nome do pai', tipo: 'texto', largura: 2, secao: 'Filiação' },
      { nome: 'nacionalidade_pai', rotulo: 'Nacionalidade do pai', tipo: 'texto' },
      { nome: 'nome_mae', rotulo: 'Nome da mãe', tipo: 'texto', largura: 2 },
      { nome: 'nacionalidade_mae', rotulo: 'Nacionalidade da mãe', tipo: 'texto' },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email', secao: 'Contato' },
      { nome: 'email_corporativo', rotulo: 'E-mail corporativo', tipo: 'email' },
      { nome: 'ref_familiar_nome', rotulo: 'Referência familiar', tipo: 'texto' },
      { nome: 'ref_familiar_parentesco', rotulo: 'Grau de parentesco', tipo: 'texto' },
      ...endereco(),
      { nome: 'rg', rotulo: 'RG', tipo: 'texto', secao: 'Documentos' },
      { nome: 'rg_orgao_emissor', rotulo: 'Órgão emissor', tipo: 'texto' },
      { nome: 'pis', rotulo: 'PIS', tipo: 'texto' },
      { nome: 'ctps', rotulo: 'CTPS', tipo: 'texto' },
      { nome: 'ctps_serie', rotulo: 'Série da CTPS', tipo: 'texto' },
      { nome: 'titulo_eleitor', rotulo: 'Título de eleitor', tipo: 'texto' },
      { nome: 'reservista', rotulo: 'Reservista', tipo: 'texto' },
      { nome: 'reservista_categoria', rotulo: 'Categoria da reservista', tipo: 'texto' },
      { nome: 'carteira_saude', rotulo: 'Carteira de saúde', tipo: 'texto' },
      { nome: 'cnh_numero', rotulo: 'CNH', tipo: 'texto' },
      { nome: 'cnh_categoria', rotulo: 'Categoria da CNH', tipo: 'texto' },
      { nome: 'cnh_vencimento', rotulo: 'Vencimento da CNH', tipo: 'data' },
      { nome: 'banco', rotulo: 'Banco', tipo: 'texto', secao: 'Dados bancários' },
      { nome: 'banco_tipo_conta', rotulo: 'Tipo de conta', tipo: 'opcoes', opcoes: ['CORRENTE', 'POUPANÇA', 'SALÁRIO'].map((v) => ({ valor: v, rotulo: v })) },
      { nome: 'banco_agencia', rotulo: 'Agência', tipo: 'texto' },
      { nome: 'banco_conta', rotulo: 'Conta', tipo: 'texto' },
      { nome: 'banco_operacao', rotulo: 'Operação', tipo: 'texto' },
      { nome: 'etapa_recrutamento', rotulo: 'Etapa do recrutamento', tipo: 'opcoes', secao: 'Recrutamento', ajuda: 'Vazio = colaborador efetivado.', opcoes: [{ valor: 'etapa1', rotulo: 'Etapa 1 — triagem' }, { valor: 'etapa2', rotulo: 'Etapa 2 — entrevista' }, { valor: 'etapa3', rotulo: 'Etapa 3 — documentação' }] },
      { nome: 'recrutamento_funcao', rotulo: 'Função pretendida', tipo: 'texto' },
      { nome: 'recrutamento_projeto', rotulo: 'Projeto', tipo: 'texto' },
      { nome: 'recrutamento_data_projeto', rotulo: 'Data do projeto', tipo: 'data' },
      { nome: 'recrutamento_obs', rotulo: 'Observações do recrutamento', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'telefones', titulo: 'Telefones', singular: 'Telefone', tabela: 'colaborador_telefones', permissao: 'colaboradores',
    grupo: 'Departamento Pessoal', oculto: true, temStatus: false, rotulo: 'numero', busca: ['numero'], ordem: { coluna: 'id' },
    campos: [
      colaborador,
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', obrigatorio: true, lista: true, opcoes: [{ valor: 'celular', rotulo: 'Celular' }, { valor: 'fixo', rotulo: 'Fixo' }, { valor: 'referencia_celular', rotulo: 'Celular da referência' }, { valor: 'referencia_fixo', rotulo: 'Fixo da referência' }] },
      { nome: 'numero', rotulo: 'Número', tipo: 'telefone', obrigatorio: true, lista: true },
      { nome: 'operadora', rotulo: 'Operadora', tipo: 'texto', lista: true },
    ],
  },
  {
    chave: 'dependentes', titulo: 'Dependentes', singular: 'Dependente', tabela: 'colaborador_dependentes', permissao: 'colaboradores',
    grupo: 'Departamento Pessoal', oculto: true, temStatus: false, rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    campos: [
      colaborador,
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'parentesco', rotulo: 'Parentesco', tipo: 'texto', lista: true },
      { nome: 'data_nascimento', rotulo: 'Nascimento', tipo: 'data', lista: true },
      { nome: 'dependente_ir', rotulo: 'Dependente no IR', tipo: 'booleano', lista: true },
      { nome: 'salario_familia', rotulo: 'Salário-família', tipo: 'booleano', lista: true },
    ],
  },
  {
    chave: 'profissionais', titulo: 'Profissional', singular: 'Registro profissional', tabela: 'profissionais', permissao: 'profissional',
    grupo: 'Departamento Pessoal', rotulo: 'id', busca: [], ordem: { coluna: 'admissao', asc: false },
    campos: [
      colaborador,
      { nome: 'obra_id', rotulo: 'Obra', tipo: 'ref', ref: 'obras', lista: true },
      { nome: 'rh', rotulo: 'RH', tipo: 'numero' },
      { nome: 'ficha', rotulo: 'Ficha', tipo: 'numero' },
      { nome: 'ultimo_registro', rotulo: 'Último registro', tipo: 'numero' },
      { nome: 'situacao', rotulo: 'Situação', tipo: 'texto', lista: true },
      { nome: 'admissao', rotulo: 'Admissão', tipo: 'data', lista: true, secao: 'Contrato' },
      { nome: 'primeira_experiencia', rotulo: 'Fim do 1º período de experiência', tipo: 'data' },
      { nome: 'segunda_experiencia', rotulo: 'Fim do 2º período de experiência', tipo: 'data' },
      { nome: 'demissao', rotulo: 'Demissão', tipo: 'data', lista: true },
      { nome: 'impedimento_demissao_data', rotulo: 'Impedimento de demissão até', tipo: 'data' },
      { nome: 'impedimento_demissao_obs', rotulo: 'Motivo do impedimento', tipo: 'texto', largura: 2 },
      { nome: 'data_ultima_chegada_obra', rotulo: 'Última chegada na obra', tipo: 'data', secao: 'Viagens' },
      { nome: 'direito_viagem', rotulo: 'Direito a viagem', tipo: 'booleano' },
      { nome: 'data_viagem', rotulo: 'Data da viagem', tipo: 'data' },
      { nome: 'vencimento_viagem', rotulo: 'Vencimento da viagem', tipo: 'data' },
      { nome: 'dias_obra', rotulo: 'Dias na obra', tipo: 'numero' },
      { nome: 'dias_uteis_casa', rotulo: 'Dias úteis em casa', tipo: 'numero' },
      { nome: 'cracha_proximidade', rotulo: 'Crachá de proximidade', tipo: 'texto', secao: 'Benefícios' },
      { nome: 'possui_plano_saude', rotulo: 'Plano de saúde', tipo: 'booleano' },
      { nome: 'plano_saude', rotulo: 'Qual plano', tipo: 'texto' },
      { nome: 'observacao', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'classificacoes', titulo: 'Classificação', singular: 'Classificação', tabela: 'classificacoes', permissao: 'classificacao',
    grupo: 'Departamento Pessoal', historico: true, rotulo: 'id', busca: [], ordem: { coluna: 'data', asc: false },
    campos: [
      colaborador,
      { nome: 'cargo_id', rotulo: 'Cargo', tipo: 'ref', ref: 'cargos', obrigatorio: true, lista: true },
      { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true, lista: true },
      { nome: 'valor', rotulo: 'Salário', tipo: 'moeda', obrigatorio: true, lista: true },
      { nome: 'motivo', rotulo: 'Motivo', tipo: 'texto', largura: 2 },
      { nome: 'registro_inicial', rotulo: 'Classificação do registro (admissão)', tipo: 'booleano' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'ferias', titulo: 'Férias', singular: 'Férias', tabela: 'ferias', permissao: 'ferias', grupo: 'Departamento Pessoal',
    rotulo: 'id', busca: [], ordem: { coluna: 'limite', asc: true },
    campos: [
      colaborador,
      { nome: 'data_base', rotulo: 'Data base', tipo: 'data', lista: true },
      { nome: 'vencimento', rotulo: 'Vencimento', tipo: 'data', lista: true },
      { nome: 'limite', rotulo: 'Limite para gozo', tipo: 'data', lista: true },
      { nome: 'inicio_gozo', rotulo: 'Início do gozo', tipo: 'data', lista: true },
      { nome: 'termino_gozo', rotulo: 'Término do gozo', tipo: 'data' },
      { nome: 'volta_inss', rotulo: 'Volta do INSS', tipo: 'data' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'atestados', titulo: 'Atestados', singular: 'Atestado', tabela: 'atestados', permissao: 'atestados', grupo: 'Departamento Pessoal',
    rotulo: 'id', busca: ['cid'], ordem: { coluna: 'data_inicial', asc: false },
    campos: [
      colaborador,
      { nome: 'data_inicial', rotulo: 'Data inicial', tipo: 'data', obrigatorio: true, lista: true },
      { nome: 'data_final', rotulo: 'Data final', tipo: 'data', obrigatorio: true, lista: true },
      { nome: 'dias', rotulo: 'Dias', tipo: 'numero', lista: true, somenteLeitura: true },
      { nome: 'cid', rotulo: 'CID', tipo: 'texto', lista: true },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
      arquivo('atestados'),
    ],
  },
  {
    chave: 'advertencias', titulo: 'Advertências', singular: 'Advertência', tabela: 'advertencias', permissao: 'advertencias',
    grupo: 'Departamento Pessoal', rotulo: 'id', busca: ['motivo'], ordem: { coluna: 'data', asc: false },
    campos: [
      colaborador,
      { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true, lista: true },
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', lista: true, opcoes: ['VERBAL', 'ESCRITA', 'SUSPENSÃO'].map((v) => ({ valor: v, rotulo: v })) },
      { nome: 'superior_id', rotulo: 'Superior imediato', tipo: 'ref', ref: 'colaboradores', largura: 2 },
      { nome: 'situacao', rotulo: 'Situação', tipo: 'texto' },
      { nome: 'motivo', rotulo: 'Motivo', tipo: 'textarea', largura: 3, lista: true },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'documentos-colaborador', titulo: 'Documentação de colaboradores', singular: 'Documento', tabela: 'documentos_colaborador',
    permissao: 'documentacao_colaboradores', grupo: 'Departamento Pessoal', rotulo: 'nome_documento', busca: ['nome_documento', 'descricao'],
    ordem: { coluna: 'criado_em', asc: false },
    campos: [
      colaborador,
      { nome: 'nome_documento', rotulo: 'Documento', tipo: 'texto', obrigatorio: true, lista: true },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'texto', largura: 2 },
      { nome: 'ha_vencimento', rotulo: 'Tem vencimento', tipo: 'booleano' },
      { nome: 'data_vencimento', rotulo: 'Vencimento', tipo: 'data', lista: true },
      { nome: 'data_alerta', rotulo: 'Alertar em', tipo: 'data' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
      arquivo('documentos'),
    ],
  },
  {
    chave: 'alertas-excecoes', titulo: 'Exceções de alertas', singular: 'Exceção', tabela: 'alertas_excecoes', permissao: 'alerta_adm',
    grupo: 'Departamento Pessoal', oculto: true, rotulo: 'identificador', busca: ['identificador'], ordem: { coluna: 'criado_em', asc: false },
    campos: [
      colaborador,
      { nome: 'identificador', rotulo: 'Alerta', tipo: 'opcoes', obrigatorio: true, lista: true, opcoes: [{ valor: 'contribuicao_sindical', rotulo: 'Contribuição sindical' }] },
    ],
  },
  // ------------------------------------------------------------- Segurança
  {
    chave: 'seguranca', titulo: 'Segurança do trabalho', singular: 'Ficha de segurança', tabela: 'seguranca', permissao: 'seguranca',
    grupo: 'Segurança', historico: true, rotulo: 'id', busca: ['numero_cat'], ordem: { coluna: 'data_aso', asc: false },
    campos: [
      colaborador,
      { nome: 'data_aso', rotulo: 'Data do ASO', tipo: 'data', lista: true },
      { nome: 'tipo_aso', rotulo: 'Tipo de ASO', tipo: 'opcoes', lista: true, opcoes: ['ADMISSIONAL', 'PERIÓDICO', 'RETORNO AO TRABALHO', 'MUDANÇA DE FUNÇÃO', 'DEMISSIONAL'].map((v) => ({ valor: v, rotulo: v })) },
      { nome: 'autorizado_dirigir', rotulo: 'Autorizado a dirigir veículos', tipo: 'booleano', lista: true },
      { nome: 'cipeiro', rotulo: 'Cipeiro', tipo: 'booleano', lista: true, secao: 'CIPA' },
      { nome: 'cipa_representa', rotulo: 'Representa', tipo: 'opcoes', opcoes: ['EMPREGADOR', 'EMPREGADOS'].map((v) => ({ valor: v, rotulo: v })) },
      { nome: 'cipa_cargo', rotulo: 'Cargo na CIPA', tipo: 'texto' },
      { nome: 'tamanho_camisa', rotulo: 'Camisa', tipo: 'numero', secao: 'Uniforme e EPI' },
      { nome: 'tamanho_calca', rotulo: 'Calça', tipo: 'numero' },
      { nome: 'tamanho_botina', rotulo: 'Botina', tipo: 'numero' },
      { nome: 'uniforme_antichama', rotulo: 'Uniforme antichama', tipo: 'booleano' },
      { nome: 'numero_cat', rotulo: 'Número da CAT', tipo: 'texto', secao: 'Acidente de trabalho (CAT)' },
      { nome: 'data_emissao_cat', rotulo: 'Emissão da CAT', tipo: 'data' },
      { nome: 'descricao_cat', rotulo: 'Descrição', tipo: 'texto', largura: 3 },
      { nome: 'impedimento_demissao_data', rotulo: 'Impedimento de demissão até', tipo: 'data', secao: 'Outros' },
      { nome: 'impedimento_demissao_obs', rotulo: 'Motivo do impedimento', tipo: 'texto', largura: 2 },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'treinamentos-nr', titulo: 'Treinamentos NR', singular: 'Treinamento', tabela: 'treinamentos_nr', permissao: 'seguranca',
    grupo: 'Segurança', historico: true, rotulo: 'nr', busca: ['nr'], ordem: { coluna: 'data_vencimento' },
    campos: [
      colaborador,
      { nome: 'nr', rotulo: 'NR', tipo: 'ref', ref: 'nrs', obrigatorio: true, lista: true },
      { nome: 'data_realizacao', rotulo: 'Realização', tipo: 'data', obrigatorio: true, lista: true },
      { nome: 'data_vencimento', rotulo: 'Vencimento', tipo: 'data', lista: true, ajuda: 'Deixe em branco para calcular pela validade da NR.' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'texto', largura: 3 },
    ],
  },
  {
    chave: 'nrs', titulo: 'Normas (NR)', singular: 'NR', tabela: 'nrs', permissao: 'seguranca', grupo: 'Segurança', pk: 'codigo',
    temStatus: false, rotulo: 'codigo', busca: ['codigo', 'nome'], ordem: { coluna: 'codigo' },
    campos: [
      { nome: 'codigo', rotulo: 'Código', tipo: 'texto', obrigatorio: true, lista: true, ajuda: 'Ex.: NR-12' },
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'validade_dias', rotulo: 'Validade (dias)', tipo: 'numero', obrigatorio: true, lista: true },
    ],
  },
  // ------------------------------------------------------------- Almoxarifado
  {
    chave: 'materiais', titulo: 'Materiais', singular: 'Material', tabela: 'materiais', permissao: 'materiais', grupo: 'Almoxarifado',
    rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    vinculos: [{ titulo: 'Grupos do material', tabela: 'materiais_grupos_itens', chavePai: 'material_id', chaveOutro: 'grupo_id', ref: 'materiais_grupos' }],
    campos: [{ nome: 'nome', rotulo: 'Material', tipo: 'texto', obrigatorio: true, lista: true, largura: 3 }],
  },
  {
    chave: 'materiais-grupos', titulo: 'Grupos de materiais', singular: 'Grupo', tabela: 'materiais_grupos', permissao: 'materiais',
    grupo: 'Almoxarifado', rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    campos: [{ nome: 'nome', rotulo: 'Grupo', tipo: 'texto', obrigatorio: true, lista: true, largura: 3 }],
  },
  {
    chave: 'veiculos', titulo: 'Veículos', singular: 'Veículo', tabela: 'veiculos', permissao: 'veiculos', grupo: 'Almoxarifado',
    rotulo: 'modelo', busca: ['modelo', 'marca', 'placa'], ordem: { coluna: 'modelo' },
    campos: [
      { nome: 'marca', rotulo: 'Marca', tipo: 'texto', lista: true },
      { nome: 'modelo', rotulo: 'Modelo', tipo: 'texto', obrigatorio: true, lista: true },
      { nome: 'placa', rotulo: 'Placa', tipo: 'placa', lista: true },
      { nome: 'ano_fabricacao', rotulo: 'Ano de fabricação', tipo: 'numero' },
      { nome: 'ano_modelo', rotulo: 'Ano do modelo', tipo: 'numero', lista: true },
      { nome: 'cor', rotulo: 'Cor', tipo: 'texto' },
      { nome: 'combustivel', rotulo: 'Combustível', tipo: 'texto' },
      { nome: 'chassi', rotulo: 'Chassi', tipo: 'texto' },
      { nome: 'renavam', rotulo: 'Renavam', tipo: 'texto' },
      { nome: 'motor', rotulo: 'Motor', tipo: 'texto' },
      { nome: 'km_inicial', rotulo: 'KM inicial', tipo: 'numero' },
      { nome: 'lotacao', rotulo: 'Lotação', tipo: 'numero' },
      { nome: 'cidade_id', rotulo: 'Cidade de registro', tipo: 'ref', ref: 'cidades' },
      { nome: 'concessionaria_id', rotulo: 'Concessionária', tipo: 'ref', ref: 'fornecedores', largura: 2, secao: 'Compra' },
      { nome: 'data_compra', rotulo: 'Data da compra', tipo: 'data' },
      { nome: 'valor', rotulo: 'Valor', tipo: 'moeda' },
      { nome: 'corretora_id', rotulo: 'Corretora', tipo: 'ref', ref: 'fornecedores', largura: 2, secao: 'Seguro' },
      { nome: 'seguradora', rotulo: 'Seguradora', tipo: 'texto' },
      { nome: 'seguro_inicio', rotulo: 'Início da vigência', tipo: 'data' },
      { nome: 'seguro_termino', rotulo: 'Término da vigência', tipo: 'data', lista: true },
      { nome: 'telefone_sinistro', rotulo: 'Telefone para sinistro', tipo: 'telefone' },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'manutencoes', titulo: 'Manutenção de veículos', singular: 'Manutenção', tabela: 'manutencoes_veiculos',
    permissao: 'manutencao_veiculos', grupo: 'Almoxarifado', rotulo: 'id', busca: ['descricao_servico', 'descricao_pecas'],
    ordem: { coluna: 'data_conserto', asc: false },
    campos: [
      { nome: 'veiculo_id', rotulo: 'Veículo', tipo: 'ref', ref: 'veiculos', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'data_conserto', rotulo: 'Data do conserto', tipo: 'data', lista: true },
      { nome: 'grupo_peca_id', rotulo: 'Grupo (peças)', tipo: 'ref', ref: 'grupos_fornecedores', secao: 'Peças' },
      { nome: 'fornecedor_peca_id', rotulo: 'Fornecedor das peças', tipo: 'ref', ref: 'fornecedores', largura: 2 },
      { nome: 'descricao_pecas', rotulo: 'Descrição das peças', tipo: 'textarea', largura: 3 },
      { nome: 'nf_pecas', rotulo: 'NF das peças', tipo: 'texto' },
      { nome: 'valor_pecas', rotulo: 'Valor das peças', tipo: 'moeda', lista: true },
      { nome: 'grupo_servico_id', rotulo: 'Grupo (serviço)', tipo: 'ref', ref: 'grupos_fornecedores', secao: 'Serviço' },
      { nome: 'fornecedor_servico_id', rotulo: 'Fornecedor do serviço', tipo: 'ref', ref: 'fornecedores', largura: 2 },
      { nome: 'descricao_servico', rotulo: 'Descrição do serviço', tipo: 'textarea', largura: 3, lista: true },
      { nome: 'nf_servico', rotulo: 'NF do serviço', tipo: 'texto' },
      { nome: 'valor_servico', rotulo: 'Valor do serviço', tipo: 'moeda', lista: true },
      { nome: 'obs', rotulo: 'Observações', tipo: 'textarea', largura: 3 },
    ],
  },
  {
    chave: 'manutencoes-arquivos', titulo: 'Notas fiscais da manutenção', singular: 'Nota fiscal', tabela: 'manutencoes_veiculos_arquivos',
    permissao: 'manutencao_veiculos', grupo: 'Almoxarifado', oculto: true, rotulo: 'arquivo_nome', busca: ['arquivo_nome'],
    ordem: { coluna: 'criado_em', asc: false },
    campos: [
      { nome: 'manutencao_id', rotulo: 'Manutenção nº', tipo: 'numero', obrigatorio: true, lista: true },
      { nome: 'tipo_nf', rotulo: 'Tipo', tipo: 'opcoes', lista: true, opcoes: [{ valor: 'pecas', rotulo: 'Peças' }, { valor: 'servico', rotulo: 'Serviço' }, { valor: 'outro', rotulo: 'Outro' }] },
      { ...arquivo('veiculos'), obrigatorio: true },
    ],
  },
  // ------------------------------------------------------------- Documentos
  {
    chave: 'biblioteca', titulo: 'Biblioteca padrão', singular: 'Documento', tabela: 'biblioteca_documentos', permissao: 'biblioteca_download',
    grupo: 'Documentos', rotulo: 'nome', busca: ['nome', 'descricao'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'area_id', rotulo: 'Área', tipo: 'ref', ref: 'biblioteca_areas', obrigatorio: true, lista: true },
      { nome: 'nome', rotulo: 'Documento', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', lista: true, opcoes: [{ valor: 'DD', rotulo: 'DD' }, { valor: 'IT', rotulo: 'IT — instrução de trabalho' }, { valor: 'POP', rotulo: 'POP — procedimento' }] },
      { nome: 'data_ultima_revisao', rotulo: 'Última revisão', tipo: 'data', lista: true },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', largura: 3 },
      arquivo('biblioteca'),
    ],
  },
  {
    chave: 'biblioteca-areas', titulo: 'Áreas da biblioteca', singular: 'Área', tabela: 'biblioteca_areas', permissao: 'biblioteca_areas',
    grupo: 'Documentos', rotulo: 'nome', busca: ['nome'], ordem: { coluna: 'nome' },
    vinculos: [{ titulo: 'Usuários com acesso', tabela: 'biblioteca_area_usuarios', chavePai: 'area_id', chaveOutro: 'usuario_id', ref: 'usuarios' }],
    campos: [{ nome: 'nome', rotulo: 'Área', tipo: 'texto', obrigatorio: true, lista: true, largura: 3 }],
  },
  {
    chave: 'modelos-documentos', titulo: 'Modelos de documentos', singular: 'Modelo', tabela: 'modelos_documentos',
    permissao: 'documentos_padronizados', grupo: 'Documentos', rotulo: 'nome', busca: ['nome', 'codigo'], ordem: { coluna: 'nome' },
    campos: [
      { nome: 'codigo', rotulo: 'Código', tipo: 'texto', obrigatorio: true, lista: true },
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, lista: true, largura: 2 },
      { nome: 'conteudo', rotulo: 'Conteúdo', tipo: 'textarea', obrigatorio: true, largura: 3, ajuda: 'Veja a legenda de marcação na tela de documentos padronizados.' },
    ],
  },
  // ------------------------------------------------------------- Administração
  {
    chave: 'alcadas', titulo: 'Alçadas de compras', singular: 'Alçada', tabela: 'alcadas', permissao: 'pcla', grupo: 'Administração',
    rotulo: 'id', busca: [], ordem: { coluna: 'obra_id' },
    campos: [
      { nome: 'usuario_id', rotulo: 'Usuário', tipo: 'ref', ref: 'usuarios', obrigatorio: true, lista: true },
      { nome: 'obra_id', rotulo: 'Obra', tipo: 'ref', ref: 'obras', obrigatorio: true, lista: true },
      { nome: 'pode_liberar', rotulo: 'Libera requisições', tipo: 'booleano', lista: true },
      { nome: 'pode_aprovar', rotulo: 'Aprova pedidos', tipo: 'booleano', lista: true },
      { nome: 'valor_maximo', rotulo: 'Valor máximo de aprovação', tipo: 'moeda', lista: true },
    ],
  },
  {
    chave: 'recrutamento-parametros', titulo: 'Parâmetros de recrutamento', singular: 'Parâmetro', tabela: 'recrutamento_parametros',
    permissao: 'recrutamento_parametros', grupo: 'Administração', pk: 'usuario_id', temStatus: false, rotulo: 'usuario_id',
    busca: [], ordem: { coluna: 'usuario_id' },
    campos: [
      { nome: 'usuario_id', rotulo: 'Usuário', tipo: 'ref', ref: 'usuarios', obrigatorio: true, lista: true },
      { nome: 'etapa1', rotulo: 'Atua na etapa 1 (triagem)', tipo: 'booleano', lista: true },
      { nome: 'etapa2', rotulo: 'Atua na etapa 2 (entrevista)', tipo: 'booleano', lista: true },
      { nome: 'etapa3', rotulo: 'Atua na etapa 3 (documentação)', tipo: 'booleano', lista: true },
      { nome: 'etapa4', rotulo: 'Pode efetivar', tipo: 'booleano', lista: true },
    ],
  },
  {
    chave: 'alertas-visualizadores', titulo: 'Quem vê os alertas', singular: 'Visualizador', tabela: 'alertas_visualizadores',
    permissao: 'alerta_adm_visualiza', grupo: 'Administração', pk: 'usuario_id', temStatus: false, rotulo: 'usuario_id',
    busca: [], ordem: { coluna: 'usuario_id' },
    campos: [{ nome: 'usuario_id', rotulo: 'Usuário', tipo: 'ref', ref: 'usuarios', obrigatorio: true, lista: true }],
  },
];

export function obterModulo(chave: string) {
  return MODULOS.find((m) => m.chave === chave);
}

export function moduloDaTabela(tabela: string) {
  return MODULOS.find((m) => m.tabela === tabela);
}
