# Atlas — sistema de gestão

Reconstrução do sistema PHP antigo (2012–2016) em **Next.js 15 + Supabase (PostgreSQL)**.

## O que tem

| Área | Telas |
|---|---|
| Departamento Pessoal | Colaboradores (ficha única com tudo), recrutamento em 3 etapas, profissional, classificação salarial (com histórico), férias, atestados (com arquivo), advertências, documentação de colaboradores, 18 documentos padronizados em PDF, alertas de contribuição sindical, cargos |
| Segurança do Trabalho | Ficha de segurança (ASO, CIPA, uniforme, CAT — com histórico), treinamentos NR com vencimento automático, lista de cipeiros |
| Compras | Requisição → liberação por alçada → orçamentos (mapa comparativo) → pedido → aprovação por limite de valor → situação de entrega → recebimento → conclusão; e-mails em cada etapa |
| Almoxarifado | Materiais e grupos, veículos, manutenções |
| Clientes / cadastros | Obras, repúblicas, transporte e hospedagem, fornecedores e grupos, cidades/estados/países |
| Documentos | Biblioteca padrão por área, compartilhamento de arquivos entre usuários |
| Administração | Usuários e níveis por módulo, alçadas, parâmetros do recrutamento, auditoria completa |

Painel inicial com vencimentos (NR, ASO, CNH, experiência, férias, documentos, seguro de veículo, entrega de república).

## Segurança (o que mudou em relação ao sistema antigo)

- **Permissões no banco (RLS)**: os níveis 2 (ver) · 3 (alterar) · 4 (cadastrar) · 5 (excluir/desativar) · 6 (especial) do sistema antigo valem para *toda* consulta. Nenhuma tela consegue esquecer a verificação.
- Etapas de compras só mudam por funções do banco que conferem alçada e limite de valor.
- Senhas com o Supabase Auth (bcrypt), recuperação por e-mail; nada de SHA1.
- Consultas parametrizadas (sem SQL injection); arquivos em bucket privado com links temporários.
- Dados pessoais só para quem tem o módulo; listas de seleção mostram apenas o nome.
- Auditoria automática de todas as tabelas (quem, quando, antes/depois).

## Banco de dados

`supabase/migrations/` (aplicar em ordem):

1. `0001_estrutura.sql` — tabelas, tipos, gatilhos (auditoria, histórico, vencimento de NR)
2. `0002_permissoes.sql` — módulos e políticas RLS
3. `0003_compras_alertas.sql` — fluxo de compras, recrutamento, alertas, painel de vencimentos, armazenamento
4. `0004_carga_dados.sql` — **somente dados não pessoais** do dump antigo (gerado por `scripts/importar_dump.py`)
5. `0005_modelos_documentos.sql` — modelos dos documentos padronizados (editáveis pelo sistema)

### O que foi importado do sistema antigo

Cidades/estados/países, cargos, obras, fornecedores pessoa jurídica (sem nome de contato e celulares), grupos, materiais, veículos, manutenções, repúblicas, áreas da biblioteca e o histórico de compras (101 requisições, 162 orçamentos, 132 pedidos) **sem as pessoas** (solicitante, comprador e aprovador ficam vazios).

**Não importado (só a estrutura)**: colaboradores e tudo ligado a eles, usuários/senhas, logs, alertas, compartilhamentos, alçadas e fornecedores pessoa física. Os arquivos enviados no sistema antigo não estavam na pasta, então a biblioteca começa vazia.

Para regenerar a carga: `npm run importar` (lê `../localhost.sql`).

Teste das migrações e das regras (PostgreSQL em WebAssembly, sem Docker):

```bash
npm i -D @electric-sql/pglite && node scripts/testes/testar_banco.mjs supabase/migrations
```

## Rodar

1. Crie um projeto no Supabase e aplique as migrações (SQL Editor ou `supabase db push`).
2. Copie `.env.example` para `.env.local` e preencha URL, chave publicável e `SUPABASE_SERVICE_ROLE_KEY`.
3. Em **Authentication → Sign In / Providers**, desative "Allow new users to sign up" (os usuários são criados pelo administrador).
4. `npm install && npm run dev` → abra http://localhost:3000. Na primeira vez, a tela **Configuração inicial** cria o administrador.
5. Publicação: Vercel (mesmas variáveis de ambiente). E-mails de compras: configure `RESEND_API_KEY` e `EMAIL_REMETENTE`.

## Estrutura do código

- `src/lib/modulos.ts` — catálogo das telas de cadastro (campos, listas, permissões). Uma entrada gera lista, formulário, desativação e exportação.
- `src/app/(app)/m/[modulo]` — telas genéricas de cadastro.
- `src/app/(app)/colaboradores/[id]` — ficha completa do colaborador.
- `src/app/(app)/compras` — fluxo de compras.
- `src/lib/documentos.ts` + `src/lib/pdf.tsx` — geração dos documentos padronizados.
