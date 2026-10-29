import 'server-only';
import { fmtData, fmtMoeda, hojeISO, valorPorExtenso } from './formatar';
import { supabaseServidor } from './supabase/server';

const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

/** Campos disponíveis nos modelos ({{campo}}), com a descrição exibida na tela de ajuda. */
export const CAMPOS_MODELO: Record<string, string> = {
  nome: 'Nome completo', apelido: 'Apelido', cpf: 'CPF', rg: 'RG', rg_orgao_emissor: 'Órgão emissor do RG', pis: 'PIS',
  ctps: 'Número da CTPS', ctps_serie: 'Série da CTPS', titulo_eleitor: 'Título de eleitor', reservista: 'Reservista',
  reservista_categoria: 'Categoria da reservista', carteira_saude: 'Carteira de saúde', data_nascimento: 'Data de nascimento',
  idade: 'Idade', estado_civil: 'Estado civil', nacionalidade: 'Nacionalidade', nome_pai: 'Nome do pai',
  nacionalidade_pai: 'Nacionalidade do pai', nome_mae: 'Nome da mãe', nacionalidade_mae: 'Nacionalidade da mãe',
  naturalidade: 'Cidade natal', naturalidade_uf: 'UF natal', logradouro: 'Logradouro', complemento: 'Complemento',
  bairro: 'Bairro', cep: 'CEP', cidade: 'Cidade', uf: 'UF', email: 'E-mail', cnh_numero: 'CNH', cnh_categoria: 'Categoria da CNH',
  cnh_vencimento: 'Vencimento da CNH', banco: 'Banco', banco_agencia: 'Agência', banco_conta: 'Conta',
  banco_tipo_conta: 'Tipo de conta', banco_operacao: 'Operação', obra: 'Razão social da obra', obra_codigo: 'Código da obra',
  obra_cidade: 'Cidade da obra', obra_uf: 'UF da obra', rh: 'Número de RH', ficha: 'Número da ficha', admissao: 'Data de admissão',
  primeira_experiencia: 'Fim do 1º período de experiência', segunda_experiencia: 'Fim do 2º período de experiência',
  cracha: 'Crachá de proximidade', cargo: 'Cargo atual', salario: 'Salário atual', salario_extenso: 'Salário atual por extenso',
  cargo_registro: 'Cargo do registro (admissão)', salario_registro: 'Salário do registro',
  salario_registro_extenso: 'Salário do registro por extenso', unidade_salario: '" por hora" ou " mensal" (salário < R$ 50 = hora)',
  data_hoje: 'Data de hoje', dia: 'Dia de hoje', mes_extenso: 'Mês de hoje por extenso', ano: 'Ano atual', empresa: 'Nome da empresa (ATLAS)',
  empresa_cnpj: 'CNPJ da empresa', empresa_endereco: 'Endereço da empresa (rua, nº, bairro)', empresa_cidade: 'Cidade da empresa',
  empresa_uf: 'UF da empresa', empresa_cep: 'CEP da empresa',
};

/** Dados da empresa nos documentos (configurados no .env; vazio sai como linha para preencher). */
function dadosEmpresa() {
  const v = (k: string) => process.env[k]?.trim() ?? '';
  return {
    empresa: v('EMPRESA_NOME') || 'ATLAS', empresa_cnpj: v('EMPRESA_CNPJ'), empresa_endereco: v('EMPRESA_ENDERECO'),
    empresa_cidade: v('EMPRESA_CIDADE'), empresa_uf: v('EMPRESA_UF'), empresa_cep: v('EMPRESA_CEP'),
  };
}

export type Dependente = { nome: string; parentesco: string | null; data_nascimento: string | null; salario_familia: boolean };

export async function dadosColaborador(id: number) {
  const supabase = await supabaseServidor();
  const { data: c } = await supabase.from('colaboradores')
    .select('*, cidade:cidades!cidade_id(nome, estados(uf)), natal:cidades!naturalidade_cidade_id(nome, estados(uf))')
    .eq('id', id).maybeSingle();
  if (!c) return null;

  const [{ data: prof }, { data: classes }, { data: deps }] = await Promise.all([
    supabase.from('profissionais').select('*, obras(codigo, razao_social, cidades(nome, estados(uf)))')
      .eq('colaborador_id', id).eq('status', 'ativo').order('admissao', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('classificacoes').select('valor, registro_inicial, status, data, cargos(nome)')
      .eq('colaborador_id', id).in('status', ['ativo', 'historico']).order('data', { ascending: false }),
    supabase.from('colaborador_dependentes').select('nome, parentesco, data_nascimento, salario_familia').eq('colaborador_id', id).order('nome'),
  ]);

  const atual = (classes ?? []).find((x) => x.status === 'ativo');
  const registro = (classes ?? []).find((x) => x.registro_inicial) ?? (classes ?? []).at(-1) ?? atual;
  const cargoNome = (x: any) => (x?.cargos as any)?.nome ?? '';
  const hoje = hojeISO();
  const [ano, mes, dia] = hoje.split('-');
  const idade = c.data_nascimento ? Math.floor((Date.parse(hoje) - Date.parse(c.data_nascimento)) / (365.25 * 864e5)) : null;
  const obra = (prof as any)?.obras;
  const salReg = Number(registro?.valor ?? 0);

  const campos: Record<string, string> = {
    nome: c.nome, apelido: c.apelido, cpf: c.cpf, rg: c.rg, rg_orgao_emissor: c.rg_orgao_emissor, pis: c.pis, ctps: c.ctps,
    ctps_serie: c.ctps_serie, titulo_eleitor: c.titulo_eleitor, reservista: c.reservista, reservista_categoria: c.reservista_categoria,
    carteira_saude: c.carteira_saude, data_nascimento: fmtData(c.data_nascimento), idade: idade !== null ? String(idade) : '',
    estado_civil: c.estado_civil, nacionalidade: c.nacionalidade, nome_pai: c.nome_pai, nacionalidade_pai: c.nacionalidade_pai,
    nome_mae: c.nome_mae, nacionalidade_mae: c.nacionalidade_mae, naturalidade: (c.natal as any)?.nome,
    naturalidade_uf: (c.natal as any)?.estados?.uf, logradouro: c.logradouro, complemento: c.complemento, bairro: c.bairro,
    cep: c.cep, cidade: (c.cidade as any)?.nome, uf: (c.cidade as any)?.estados?.uf, email: c.email, cnh_numero: c.cnh_numero,
    cnh_categoria: c.cnh_categoria, cnh_vencimento: fmtData(c.cnh_vencimento), banco: c.banco, banco_agencia: c.banco_agencia,
    banco_conta: c.banco_conta, banco_tipo_conta: c.banco_tipo_conta, banco_operacao: c.banco_operacao,
    obra: obra?.razao_social, obra_codigo: obra?.codigo != null ? String(obra.codigo) : '', obra_cidade: obra?.cidades?.nome,
    obra_uf: obra?.cidades?.estados?.uf, rh: (prof as any)?.rh != null ? String((prof as any).rh) : '',
    ficha: (prof as any)?.ficha != null ? String((prof as any).ficha) : '', admissao: fmtData((prof as any)?.admissao),
    primeira_experiencia: fmtData((prof as any)?.primeira_experiencia), segunda_experiencia: fmtData((prof as any)?.segunda_experiencia),
    cracha: (prof as any)?.cracha_proximidade, cargo: cargoNome(atual), salario: atual?.valor != null ? fmtMoeda(atual.valor).replace('R$', '').trim() : '',
    salario_extenso: atual?.valor != null ? valorPorExtenso(Number(atual.valor)).toUpperCase() : '',
    cargo_registro: cargoNome(registro), salario_registro: registro?.valor != null ? fmtMoeda(salReg).replace('R$', '').trim() : '',
    salario_registro_extenso: registro?.valor != null ? valorPorExtenso(salReg).toUpperCase() : '',
    unidade_salario: registro?.valor != null ? (salReg < 50 ? ' por hora' : ' mensal') : '',
    data_hoje: fmtData(hoje), dia, mes_extenso: MESES[Number(mes) - 1], ano, ...dadosEmpresa(),
  };
  return { campos, dependentes: (deps ?? []) as Dependente[], nome: c.nome as string };
}

// --------------------------------------------------------------- Marcação dos modelos
export type Bloco =
  | { tipo: 'titulo' | 'centro' | 'paragrafo' | 'negrito'; texto: string }
  | { tipo: 'assinaturas'; nomes: string[] }
  | { tipo: 'tabela'; linhas: string[][] }
  | { tipo: 'dependentes'; salarioFamilia: boolean }
  | { tipo: 'pagina' | 'espaco' };

export function preencher(texto: string, campos: Record<string, string>) {
  return texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = campos[k];
    return v === undefined || v === null || v === '' ? '__________' : String(v);
  });
}

/**
 * Marcação (blocos separados por linha em branco):
 *   # Título          ^ centralizado       **negrito**       texto normal (justificado)
 *   | a | b           linha de tabela      [assinaturas: Testemunha | Empregador]
 *   [dependentes]     [dependentes: salario_familia]          [pagina]   [espaco]
 */
export function interpretar(conteudo: string, campos: Record<string, string>): Bloco[] {
  const blocos: Bloco[] = [];
  for (const bruto of conteudo.replace(/\r/g, '').split(/\n\s*\n/)) {
    const b = bruto.trim();
    if (!b) continue;
    let m: RegExpMatchArray | null;
    if (b === '[pagina]') blocos.push({ tipo: 'pagina' });
    else if (b === '[espaco]') blocos.push({ tipo: 'espaco' });
    else if ((m = b.match(/^\[dependentes(?::\s*(\w+))?\]$/))) blocos.push({ tipo: 'dependentes', salarioFamilia: m[1] === 'salario_familia' });
    else if ((m = b.match(/^\[assinaturas:\s*(.+)\]$/))) {
      const nomes = m[1].split('|').map((s) => preencher(s.trim(), campos));
      blocos.push({ tipo: 'assinaturas', nomes });
    } else if (b.startsWith('|')) {
      const linhas = b.split('\n').map((l) => l.replace(/^\|/, '').split('|').map((s) => preencher(s.trim(), campos)));
      // linhas soltas seguidas (como o FPDF gerava) entram na mesma tabela se tiverem as mesmas colunas
      const ultimo = blocos.at(-1);
      if (ultimo?.tipo === 'tabela' && linhas.length === 1 && ultimo.linhas[0].length === linhas[0].length) ultimo.linhas.push(...linhas);
      else blocos.push({ tipo: 'tabela', linhas });
    } else if (b.startsWith('# ')) blocos.push({ tipo: 'titulo', texto: preencher(b.slice(2), campos) });
    else if (b.startsWith('^ ')) blocos.push({ tipo: 'centro', texto: preencher(b.slice(2), campos) });
    else if (b.startsWith('**') && b.endsWith('**')) blocos.push({ tipo: 'negrito', texto: preencher(b.slice(2, -2), campos) });
    else blocos.push({ tipo: 'paragrafo', texto: preencher(b, campos) });
  }
  return blocos;
}
