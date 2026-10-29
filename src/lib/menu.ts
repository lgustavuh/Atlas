import { MODULOS } from './modulos';
import { pode, type Sessao } from './sessao';

export type ItemMenu = { titulo: string; href: string };
export type GrupoMenu = { titulo: string; itens: ItemMenu[] };

type Entrada = { titulo: string; href: string; permissao: string; nivel?: number } | { modulo: string };

const ESTRUTURA: { titulo: string; entradas: Entrada[] }[] = [
  {
    titulo: 'Departamento Pessoal',
    entradas: [
      { modulo: 'colaboradores' },
      { titulo: 'Recrutamento e seleção', href: '/recrutamento', permissao: 'recrutamento_selecao' },
      { modulo: 'profissionais' }, { modulo: 'classificacoes' }, { modulo: 'ferias' }, { modulo: 'atestados' },
      { modulo: 'advertencias' }, { modulo: 'documentos-colaborador' },
      { titulo: 'Documentos padronizados', href: '/documentos', permissao: 'documentos_padronizados' },
      { titulo: 'Alertas administrativos', href: '/alertas', permissao: 'alerta_adm' },
      { modulo: 'cargos' },
    ],
  },
  {
    titulo: 'Segurança do Trabalho',
    entradas: [
      { modulo: 'seguranca' }, { modulo: 'treinamentos-nr' },
      { titulo: 'Lista de cipeiros', href: '/seguranca/cipeiros', permissao: 'seguranca' },
      { modulo: 'nrs' },
    ],
  },
  {
    titulo: 'Compras',
    entradas: [
      { titulo: 'Requisições', href: '/compras', permissao: 'requisicao' },
      { titulo: 'Minhas pendências', href: '/compras/pendencias', permissao: 'pcl' },
      { titulo: 'Aprovação de pedidos', href: '/compras/pendencias', permissao: 'pca' },
      { titulo: 'Painel de compras', href: '/compras', permissao: 'orcamento' },
    ],
  },
  { titulo: 'Almoxarifado', entradas: [{ modulo: 'materiais' }, { modulo: 'materiais-grupos' }, { modulo: 'veiculos' }, { modulo: 'manutencoes' }] },
  { titulo: 'Clientes', entradas: [{ modulo: 'obras' }, { modulo: 'republicas' }, { modulo: 'transporte' }] },
  { titulo: 'Cadastros', entradas: [{ modulo: 'fornecedores' }, { modulo: 'grupos-fornecedores' }, { modulo: 'cidades' }, { modulo: 'estados' }, { modulo: 'paises' }] },
  {
    titulo: 'Documentos',
    entradas: [
      { modulo: 'biblioteca' },
      { titulo: 'Compartilhamento de arquivos', href: '/arquivos', permissao: 'compartilhamentos' },
      { modulo: 'modelos-documentos' },
    ],
  },
  {
    titulo: 'Administração',
    entradas: [
      { titulo: 'Usuários e permissões', href: '/admin/usuarios', permissao: 'usuarios' },
      { modulo: 'alcadas' }, { modulo: 'recrutamento-parametros' }, { modulo: 'alertas-visualizadores' },
      { modulo: 'biblioteca-areas' },
      { titulo: 'Auditoria', href: '/admin/auditoria', permissao: 'logs' },
    ],
  },
];

export function montarMenu(sessao: Sessao): GrupoMenu[] {
  return ESTRUTURA.map((g) => {
    const vistos = new Set<string>();
    const itens: ItemMenu[] = [];
    for (const e of g.entradas) {
      let item: ItemMenu | null = null;
      if ('modulo' in e) {
        const m = MODULOS.find((x) => x.chave === e.modulo);
        if (m && pode(sessao, m.permissao, 2)) item = { titulo: m.titulo, href: `/m/${m.chave}` };
      } else if (pode(sessao, e.permissao, e.nivel ?? 2)) {
        item = { titulo: e.titulo, href: e.href };
      }
      if (item && !vistos.has(item.href)) {
        vistos.add(item.href);
        itens.push(item);
      }
    }
    return { titulo: g.titulo, itens };
  }).filter((g) => g.itens.length);
}
