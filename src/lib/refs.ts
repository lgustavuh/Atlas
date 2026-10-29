/**
 * Fontes das listas de seleção (campos que apontam para outra tabela).
 * Colaboradores e usuários vêm por funções do banco que expõem só o nome.
 */
type Linha = Record<string, any>;

export type Ref = {
  tabela: string;
  chave?: string;
  colunas: string;
  busca: string;
  ordem: string;
  rotulo: (r: Linha) => string;
  rpc?: 'colaboradores_opcoes' | 'usuarios_opcoes';
  somenteAtivos?: boolean;
};

export const REFS = {
  paises: { tabela: 'paises', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  estados: {
    tabela: 'estados', colunas: 'id, uf, nome', busca: 'nome', ordem: 'nome',
    rotulo: (r) => `${r.uf} - ${r.nome}`,
  },
  cidades: {
    tabela: 'cidades', colunas: 'id, nome, estados(uf)', busca: 'nome', ordem: 'nome',
    rotulo: (r) => (r.estados?.uf ? `${r.nome} - ${r.estados.uf}` : r.nome),
  },
  cargos: { tabela: 'cargos', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  obras: {
    tabela: 'obras', colunas: 'id, codigo, razao_social', busca: 'razao_social', ordem: 'codigo',
    rotulo: (r) => `${r.codigo} - ${r.razao_social}`,
  },
  fornecedores: {
    tabela: 'fornecedores', colunas: 'id, razao_social, nome_usual', busca: 'razao_social', ordem: 'razao_social',
    rotulo: (r) => (r.nome_usual ? `${r.nome_usual} (${r.razao_social})` : r.razao_social),
  },
  grupos_fornecedores: { tabela: 'grupos_fornecedores', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  materiais: { tabela: 'materiais', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  materiais_grupos: { tabela: 'materiais_grupos', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  veiculos: {
    tabela: 'veiculos', colunas: 'id, modelo, marca, placa', busca: 'modelo', ordem: 'modelo',
    rotulo: (r) => [r.marca, r.modelo, r.placa].filter(Boolean).join(' '),
  },
  republicas: { tabela: 'republicas', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  biblioteca_areas: { tabela: 'biblioteca_areas', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rotulo: (r) => r.nome },
  nrs: {
    tabela: 'nrs', chave: 'codigo', colunas: 'codigo, nome', busca: 'nome', ordem: 'codigo',
    rotulo: (r) => `${r.codigo} - ${r.nome}`, somenteAtivos: false,
  },
  colaboradores: {
    tabela: 'colaboradores', colunas: 'id, nome, apelido', busca: 'nome', ordem: 'nome', rpc: 'colaboradores_opcoes',
    rotulo: (r) => (r.apelido ? `${r.nome} (${r.apelido})` : r.nome),
  },
  usuarios: {
    tabela: 'usuarios', colunas: 'id, nome', busca: 'nome', ordem: 'nome', rpc: 'usuarios_opcoes',
    rotulo: (r) => r.nome,
  },
} satisfies Record<string, Ref>;

export type RefChave = keyof typeof REFS;

export function obterRef(chave: string): Ref | undefined {
  return (REFS as Record<string, Ref>)[chave];
}
