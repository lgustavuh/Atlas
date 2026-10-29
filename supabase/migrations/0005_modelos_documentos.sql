-- Modelos dos documentos padronizados, convertidos dos geradores FPDF do sistema antigo.
-- Podem ser editados pela tela Documentos → Modelos de documentos.

insert into public.modelos_documentos (codigo, nome, conteudo) values
('acordocompensacaohoras', 'Acordo de compensação de horas', '# ACORDO PARA COMPENSAÇÃO DE
HORAS DE TRABALHO

Entre {{empresa}}, estabelecida em {{empresa_cidade}} à {{empresa_endereco}}, e o seu funcionário Sr. {{nome}} portador do CPF: {{cpf}}; fica convencionado de acordo com disposto do art. 59 e seu § 2 (aprovado pelo Decreto lei nº 5.452 de 1º de Maio de 1943 Consolidação das Leis do Trabalho), que a jornada de trabalho excedente em um dia será compensado em dias posteriores, totalizando 44 horas semanais, podendo ocorrer os seguintes horários de trabalho:

- de segunda à quinta feira - 07:00 x 17:00 horas com uma hora de intervalo para refeição;
- sexta feira - 07:00 x 16:00 horas com uma hora de intervalo para refeição; 
OU,
- de segunda à quinta feira - 07:30 x 17:30 horas com uma hora de intervalo para refeição;
- sexta feira - 07:30 x 16:30 horas com uma hora de intervalo para refeição;
OU,
- de segunda à quinta feira - 08:00 x 18:00 horas com uma hora de intervalo para refeição;
- sexta feira – 08:00X17:00 horas com uma hora de intervalo para refeição;
OU,
- de segunda à sexta feira - 07:00 x 16:48 horas com uma hora de intervalo para refeição;
OU,
- de segunda à sexta feira - 07:20 x 17:08 horas com uma hora de intervalo para refeição, de acordo com  o horário administrativo da Empresa contratante dos serviço.

E, por estarem de pleno acordo, as partes assinam o presente acordo, o qual vigorará durante a vigência do pacto laboral.

**{{cidade}} / {{uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}**'),
('autorizacaodepositoconta', 'Autorização de depósito em conta', '# AUTORIZAÇÃO PARA DEPÓSITO
DO PAGAMENTO DO
FUNCIONÁRIO EM CONTA
BANCÁRIA

FUNCIONÁRIO: {{nome}}

Autorizo a empresa {{empresa}} a efetuar o depósito de meus pagamentos mensais na conta descrita abaixo:

BANCO:
AGÊNCIA:
OPERAÇÃO (informar somente quando for da C.E.F.):
CONTA:           [          ] Corrente          [          ] Poupança          [          ] Salário
Nº DA CONTA:
CONTA EM NOME DE:

**{{cidade}} / {{uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}**'),
('comprovantedevolucaoctps', 'Comprovante de devolução da CTPS', '# COMPROVANTE DE DEVOLUÇÃO CTPS

**Nome do Colaborador: {{nome}}**

**CTPS: {{ctps}}**

**Série: {{ctps_serie}}**

**Eu, {{nome}}, recebi como devolução, minha CTPS, com todas as anotações devidas no ato da ADMISSÃO, entregue pelo Setor Administrativo da Obra {{obra}}, conforme as disposições legais vigentes na CLT.**

**{{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}**

[assinaturas: {{nome}}
{{cargo_registro}}]'),
('contratoctps', 'Recibo de entrega da CTPS', '^ {{empresa}}

^ CNPJ: {{empresa_cnpj}}

^ {{empresa_endereco}}
CENTRO - CEP: 37.975-000
{{empresa_cidade}} / {{empresa_uf}}

CARGO: {{cargo_registro}}

CBO:

ADMISSÃO: {{admissao}}

REGISTRO Nº: {{rh}}

FLS/FICHA: {{ficha}}

{{salario_registro}}
({{salario_registro_extenso}}){{unidade_salario}}.

^ Ass. do Empregador ou a rogo c/testemunhas'),
('contratodeexperiencia', 'Contrato de experiência', '# CONTRATO DE TRABALHO A TÍTULO DE EXPERIÊNCIA

**Entre a firma {{empresa}} com sede em {{empresa_cidade}} à {{empresa_endereco}}, doravante designada simplesmente EMPREGADORA e {{nome}} portador da Carteira de Trabalho nº {{ctps}} Série {{ctps_serie}} seguir chamado apenas EMPREGADO, é celebrado o presente CONTRATO DE EXPERIÊNCIA, que terá vigência a partir da data de inicio da prestação de serviços, de acordo com as condições a seguir especificadas:**

**1 - Fica o EMPREGADO admitido no quadro de funcionários da EMPREGADORA para exercer as funções de {{cargo_registro}} mediante a remuneração de R$ {{salario_registro}} ({{salario_registro_extenso}}){{unidade_salario}}, a circunstância, porém, de ser a função especificada não importa na instransferibilidade do EMPREGADO para outro serviço, no qual demonstre melhor capacidade de adaptação desde que compatível com sua condição pessoal.**

2 - O horário de trabalho será anotado na sua ficha de registro e a eventual redução de jornada, por determinação da EMPREGADORA, não inovará este ajuste, permanecendo sempre íntegra a obrigação do EMPREGADO de cumprir o horário que lhe for determinado, observando o limite legal.

3 - Obriga-se também o empregado a prestar serviços em horas extraordinárias, sempre que lhe for determinado pela EMPREGADORA, na forma prevista em Lei. Na hipótese desta faculdade pela EMPREGADORA, o EMPREGADO receberá as horas extraordinárias com o acréscimo legal, salvo a ocorrência de compensação, com a conseqüente redução de jornada de trabalho em outro dia.

4 - Aceita o EMPREGADO, expressamente, a condição de prestar serviços em qualquer dos turnos de trabalho, isto é, tanto durante o dia como a noite, desde que sem simultaneidade, observadas as prescrições legais reguladoras do assunto, quanto à remuneração.

5 - Fica ajustado nos termos do que dispõe o § 1º do artigo 469, da Consolidação das Leis de Trabalho, que o EMPREGADO acatará á ordem emanada da EMPREGADORA para a prestação de serviços tanto na localidade de celebração do Contrato de Trabalho, como em qualquer outra Cidade, Capital ou Vila do Território Nacional, quer essa transferência seja transitória, quer seja definitiva.

6 - No ato da assinatura deste contrato, o EMPREGADO recebe o Regulamento Interno da Empresa cujas cláusulas fazem parte do Contrato de Trabalho, e a violação de qualquer delas implicará em sanção, cuja graduação dependerá da gravidade da mesma, culminando com a rescisão do contrato.

7 - Em caso de dano causado pelo EMPREGADO, fica a EMPREGADORA, autorizada a efetivar o desconto da importância correspondente ao prejuízo, o qual fará, com fundamento no § 1º do artigo 462 da Consolidação das Leis do Trabalho, já que essa possibilidade fica expressamente prevista em Contrato.

**8 - O presente Contrato, vigerá durante {{admissao}} A {{primeira_experiencia}} sendo celebrado para as partes verificarem reciprocamente, a conveniência ou não de se vincular em caráter definitivo a um Contrato de Trabalho. A Empresa passando a conhecer as aptidões do EMPREGADO e suas qualidades pessoais e morais; o EMPREGADO verificando se o ambiente e os métodos de trabalho atendem à sua conveniência.**

9 - Na hipótese deste ajuste transformar-se em Contrato de Prazo Indeterminado, pelo decurso do tempo, continuarão em plena vigência as cláusulas de 1 (um) a 7 (sete), enquanto durarem as relações do Empregado com a EMPREGADORA.

E por estarem de pleno acordo, as partes contratantes, assinam o presente Contrato de Experiência em duas vias, ficando a primeira em poder da EMPREGADORA, e a segunda com o EMPREGADO, que dela dará o competente recibo.

{{empresa_cidade}}, {{dia}} DE {{mes_extenso}} DE {{ano}}

[assinaturas: Testemunha | Empregador | Testemunha | Empregado]

# TERMO DE PRORROGAÇÃO

Por mútuo acordo entre as partes, fica o presente contrato de experiência, que deveria vencer nesta data prorrogado até ______/______/__________.

^ ______________________________________, ________ de ____________________ de ________.

[assinaturas: Testemunha | Empregador | Testemunha | Empregado]'),
('declaracaodisponibilidadeepi', 'Declaração de disponibilidade de EPI', '# DECLARAÇÃO DE
DISPONIBILIDADE DE EPCs/EPIs

NOME: {{nome}}

DATA: {{data_hoje}}

Declaro para os devidos fins que, estou ciente de que em toda atividade executada, a empresa disponibilizará os EPC''s/EPI''s (Equipamentos de Proteção Coletiva/Individual) conforme discriminados abaixo e outros de acordo com a atividade a ser executada, bem como, a orientação quanto ao uso correto. Comprometo-me a utilizá-los para as devidas finalidades, tendo a responsabilidade de mantê-los em boas condições de uso.

ÓCULOS MAÇARIQUEIRO;

LUVAS;

MÁSCARA DE SOLDA;

PROTETOR FACIAL;

CINTO DE SEGURANÇA TIPO PÁRA-QUEDISTA;

PERNEIRA DE RASPA;

MANGOTE DE RASPA;

AVENTAL DE RASPA;

{{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}'),
('declaracaotermovaletransporte', 'Declaração / termo de vale-transporte', '# DECLARAÇÃO E TERMO DE COMPROMISSO VALE-TRANSPORTE

FUNCIONÁRIO: {{nome}}

# Assinale com um X se você deseja adquirir vales-transporte:

# [      ]SIM                                                                     [      ]NÃO

# Se a sua opção for NÃO, apenas assine o formulário; se for SIM preencha-o com os dados necessários.

Eu, {{nome}}, funcionário da empresa {{empresa}}, desejando adquirir vales-transporte, declaro que estou morando no endereço {{logradouro}} e necessito diariamente, no meu deslocamento residência - trabalho - residência, dos seguintes vales-transporte:

# QUANTIDADE

# LINHA

# TARIFA

Assumo o compromisso de utilizar o vale-transporte exclusivamente para o meu efetivo deslocamento residência - trabalho - residência, e afirmo ter conhecimento do artigo 7º parágrafo 3º do Decreto nº 95.247, de 17/11/87, de que constitui falta grave o seu uso indevido ou a falsidade desta declaração.

Comprometo-me a atualizar anualmente as informações ou a qualquer tempo quando ocorrer mudança residencial no(s) meio(s) de transporte.

Autorizo a empresa a descontar mensalmente, até 6% do meu salário-base o valor destinado a cobrir o fornecimento de vales-transporte por mim utilizados.

Por ser a expressão da verdade, firmo a presente declaração e termo de compromisso.

{{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}

[assinaturas: Assinatura]

**ETC066**'),
('dependentesimpostoderenda', 'Declaração de dependentes (IR)', '# DECLARAÇÃO DE DEPENDENTES
IMPOSTO DE RENDA NA FONTE

**Nome: {{nome}} - CPF: {{cpf}}**

**Função: {{cargo_registro}} - RH: {{rh}}**

**Estado Cívil: {{estado_civil}} - Nascimento: {{data_nascimento}}**

# Podem ser dependentes, para efeito do Imposto de Renda:

1 - Companheiro (a) com quem o contribuinte tenha filho ou viva há mais de 5 anos, ou cônjuge;
2 - Filho (a) ou enteado (a) até 21 anos de idade, ou, em qualquer idade, quando incapacitado física ou mentalmente para o trabalho;
3 - Filho (a) ou enteado (a) universitário ou cursando escola técnica de segundo grau, até 24 anos;
4 - Irmão (ã), neto (a) ou bisneto (a), sem arrimo dos pais, de quem o contribuinte detenha a guarda judicial, até 21 anos, ou em qualquer idade, quando incapacitado física ou mentalmente para o trabalho;
5 - Irmão (ã), neto (a) ou bisneto (a), sem arrimo dos pais, com idade de 21 anos até 24 anos, se ainda estiver cursando estabelecimento de ensino superior ou escola técnica de segundo grau, desde que o contribuinte tenha detido sua guarda judicial até os 21 anos;
6 - Pais, avós e bisavós que, em 2007, tenham recebido rendimentos, tributáveis ou não, até R$ 14.992,32;
7 - Menor pobre até 21 anos que o contribuinte crie e eduque e de quem detenha a guarda judicial;
8 - Pessoa absolutamente incapaz, da qual o contribuinte seja tutor ou curador.

**ATENÇÃO:**

Filho de pais separados:

I -          O contribuinte pode considerar como dependentes os filhos que ficarem sob sua guarda, em cumprimento de descisão judicial ou acordo homologado judicialmente. Nesse caso, deve oferecer à tributação, na sua declaração os rendimentos recebidos pelos filhos, inclusive a importância recebida do ex-cônjuge a título de pensão alimentícia;
II -         O responsável pelo pagamento da pensão alimentícia pode deduzir o valor efetivamente pago a este título, sendo vedada a dedução do valor correspondente ao dependente, exceto no caso de separação judicial ocorrida em 2007, quando podem ser deduzidos, nesse ano, os valores relativos a dependente e a pensão alimentícia.

O fato de os dependentes receberem no ano-calendário rendimentos tributáveis ou não, não descaracteriza essa condição, desde que tais rendimentos sejam somados aos do declarante.

(Lei nº. 9.250, de 1995, art. 35; RIR/1999, art.77, § 1º; IN SRF nº.15, de 2001, art.38)

^ DADOS DO DEPENDENTE

[dependentes]

Assumo inteira responsabilidade pela exatidão das informações contidas nesta declaração e comprometo-me a comunicar qualquer alteração que venha ocorrer.'),
('entregacracha', 'Termo de entrega de crachá', '# ENTREGA CRACHÁ - {{empresa}}

^ {{obra}}

**Estou recebendo nesta data o CRACHÁ PROVISÓRIO e após meu período de experiência será entregue um CRACHÁ EM PVC, pertencente à {{empresa}}, para identificação e liberação de minha Entrada e Saída da Fábrica {{obra}}. Comprometo-me desde já, a zelar pelo seu estado de conservação. Sou ciente que em caso de perda ou extravio do mesmo, Autorizo a {{empresa}}, a debitar de meus vencimentos o valor de R$ 20,00 (Vinte Reais) na folha de pagamento subsequente ao acontecido e estou ciente que em meu desligamento da empresa tenho a obrigação de devolvê-lo.**

**{{cidade}}/{{uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}**

**Recebi em {{data_hoje}}**

^ _______________________________________________________

^ {{nome}}'),
('ficharegistrofrente', 'Ficha de registro (frente)', '# FICHA DE REGISTRO DE EMPREGADO

^ {{empresa}} — CNPJ {{empresa_cnpj}} — {{empresa_endereco}} — {{empresa_cidade}} - {{empresa_uf}} — CEP {{empresa_cep}}

| NÚMERO DE ORDEM (FICHA) | NÚMERO DE RH | FOTOGRAFIA 3X4 / AUTENTICAÇÃO
| {{ficha}} | {{rh}} |

| NOME
| {{nome}}

| FILIAÇÃO | NOME | NACIONALIDADE
| PAI | {{nome_pai}} | {{nacionalidade_pai}}
| MÃE | {{nome_mae}} | {{nacionalidade_mae}}

| DATA DO NASCIMENTO | IDADE | NACIONALIDADE | ESTADO CIVIL | LOCAL DO NASCIMENTO | ESTADO
| {{data_nascimento}} | {{idade}} | {{nacionalidade}} | {{estado_civil}} | {{naturalidade}} | {{naturalidade_uf}}

| CÉDULA DE IDENTIDADE | CART. PROFISSIONAL | SÉRIE | CART. RESERVISTA | CATEGORIA
| {{rg}} {{rg_orgao_emissor}} | {{ctps}} | {{ctps_serie}} | {{reservista}} | {{reservista_categoria}}

| C.P.F. | TÍTULO DE ELEITOR | CARTEIRA DE SAÚDE | PIS
| {{cpf}} | {{titulo_eleitor}} | {{carteira_saude}} | {{pis}}

| QUANDO ESTRANGEIRO | DATA DE CHEGADA AO BRASIL | CART. MOD. 19 | Nº REG. GERAL | NATURALIZADO? | CASADO(A) COM BRASILEIRO(A)? | FILHOS BRASILEIROS?
| | | | | | |

| ENDEREÇO
| {{logradouro}} {{complemento}} / BAIRRO: {{bairro}} / {{cidade}} - {{uf}} / CEP: {{cep}}

| MUDANÇA DE ENDEREÇO
|

| CARACTERÍSTICAS FÍSICAS | COR | ALTURA | PESO | CABELOS | OLHOS | SINAIS
| | | | | | |

^ BENEFICIÁRIOS

[dependentes]

| PROGRAMA DE INTEGRAÇÃO SOCIAL | CADASTRO EM | SOB Nº | DEP. NO BANCO | BANCO | AGÊNCIA
| | | {{pis}} | | {{banco}} | {{banco_agencia}}

| DATA DA ADMISSÃO | DATA DO REGISTRO | CARGO | SALÁRIO INICIAL | COMISSÕES | TAREFA | FORMA DE PAGAMENTO
| {{admissao}} | {{admissao}} | {{cargo_registro}} | R$ {{salario_registro}}{{unidade_salario}} | | | MENSAL

| FGTS — É OPTANTE? | DATA DA OPÇÃO | DATA DA RETRATAÇÃO | BANCO DEPOSITÁRIO
| SIM | {{admissao}} | |

| HORÁRIO DE TRABALHO | ENTRADA | REFEIÇÃO | SAÍDA | DESCANSO SEMANAL
| | 07:00 | 11:00 / 12:00 | 17:00 | SÁBADO / DOMINGO

^ Estou de pleno acordo com as declarações acima que exprimem a verdade.

[assinaturas: Assinatura do empregado | Carimbo e visto do empregador]

| POLEGAR DIREITO | DATA DA DEMISSÃO
| |'),
('integracaofuncionarios', 'Integração de funcionários', '# INTEGRAÇÃO DE FUNCIONÁRIOS

# PROCEDIMENTOS OPERACIONAIS

NOME: {{nome}}

FUNÇÃO: {{cargo_registro}}

REGISTRO: {{rh}}

LOCAL: {{cidade}} / {{uf}}

DATA: {{data_hoje}}

Declaro que participei do Treinamento Admissional conforme NR-18, item 18.28 antes do início de  minhas atividades no Canteiro de Obras. Recebi todas as instruções, orientações das Normas de Segurança e demais informações inerente à minha função de acordo com os Procedimentos abaixo. Comprometo-me a cumprir as normas abaixo adaptando-as de acordo com os procedimentos da empresa onde estarei prestando o serviço.

^ PROCEDIMENTOS / NORMAS DE SEGURANÇA

^ CÓDIGO

Bloqueio elétrico

^ ATLAS 001/00

Retirada de fusíveis

^ ATLAS 002/00

Isolamento de área e interdição de vias

^ ATLAS 003/00

Uso de pendentes de iluminação e cabos de extensão

^ ATLAS 004/00

Corte e solda oxi-acetilênica

^ ATLAS 005/00

Utilização de EPI''s na área industrial

^ ATLAS 006/00

Utilização de equipamentos elétricos

^ ATLAS 007/00

Uso de escadas portáteis

^ ATLAS 008/00

Utilização de equipamentos portáteis "lixadeira"

^ ATLAS 009/00

Utilização de rádios transceptores

^ ATLAS 010/00

Utilização de máscaras de proteção respiratoria

^ ATLAS 011/00

Utilização de multimetro digital

^ ATLAS 012/00

Trabalhos sobre telhados

^ ATLAS 013/00

Operação de transportes motorizados

^ ATLAS 014/00

Procedimento em caso de acidente do trabalho

^ ATLAS 015/00

Montagem e utilização de andaimes

^ ATLAS 016/00

Bombas submersas

^ ATLAS 017/00

Escavação e demolição em área industrial

^ ATLAS 018/00

Transporte e içamento de cargas

^ ATLAS 019/00

Armazenamento, transporte e empilhamento de materiais

^ ATLAS 020/00

Detonação

^ ATLAS 021/00

Norma e procedimento para controle de EPI''s

^ ATLAS 022/00

Utilização do suporte de içamento de bobinas

^ ATLAS 023/00

Trabalho em altura

^ ATLAS 024/00

Espaço confinado

^ ATLAS 025/00

Ergonomia

^ ATLAS 026/00

5 S

^ ATLAS 027/00

Plano de emergência

^ ATLAS 028/00

Direção defensiva

^ ATLAS 029/00

Disposição de resíduos

^ ATLAS 030/00

Registro de acidente, incidente, condição insegura

^ ATLAS 031/00

Aterramento de equipamento

^ ATLAS 032/00

Compra de EPI''s

^ ATLAS 033/00

Trabalho a quente

^ ATLAS 034/00

Trabalhos com tintas e solventes

^ ATLAS 035/00

Utilização de roupa anti-chamas

^ ATLAS 036/00

Mobilização e desmobilização de canteiro de obras

^ ATLAS 037/00

Furadeira radial

^ ATLAS 038/00

Máquina de solda

^ ATLAS 039/00

Lixadeira

^ ATLAS 040/00

Prensa terminal hidráulico

^ ATLAS 041/00

Serra tico tico

^ ATLAS 042/00

Realização de treinamentos

^ ATLAS 043/00

Uso de veículos automotivos

^ ATLAS 044/00

Plataformas de trabalho aéreo

^ ATLAS 045/00

HiPot - Meid

^ ATLAS 046/00

Uso do filtro solar

^ ATLAS 047/00

Prevenção e controle do uso indevido de alcool e drogas no trabalho

^ ATLAS 048/00

Uso restrito do celular durante o trabalho

^ ETC078

Gestão de treinamentos

^ ETC079'),
('integracaoseguranca', 'Integração de segurança', '# INTEGRAÇÃO DE SEGURANÇA

# TREINAMENTO INTRODUTÓRIO

NOME: {{nome}}

FUNÇÃO: {{cargo_registro}}

REGISTRO: {{rh}}

INSTRUTOR:

DURAÇÃO:       HORAS.

DATA: {{data_hoje}}

^ Conteúdo Programático:

01 - A Empresa - Principais Atividades

02 - Dimensionamento do SESMT e CIPA

03 - Análise dos Riscos
* APR Geral / APR de Bolso / Check List
* Conhecimento dos riscos por função e atividade a ser executada

04 - Acidentes
* Procedimentos quando da ocorrência
* Tipo: Típico, Trajeto, Doença Ocupacional
* Comunicação (CAT) / Estatisticas
* Noções básicas de Primeiros Socorros

05 - Causas do Acidente
* Ato Inseguro / Condição Insegura

06 - Fatores contribuintes para um acidente
* Pessoal / Impessoal

07 - Consequência de um acidente
* Empregado / Empregador
* Família / Sociedade

08 - Equipamento de Proteção Individual - EPIs
* Obrigatóriedade, conservação, higienização, substituição e uso

09 - Medicina do trabalho
* Exames Ocupacionais / Doença do Trabalho

10 - Trabalho com Eletricidade - NR10
* Roupa anti-chamas / Bloqueio
* Treinamentos (40 HS) e Reciclagem (16 HS)
* Autorização para trabalho

11 - Operação de Equipamentos Elétricos
* Treinamento e autorização para utilização

12 - Trabalhos e Espaço Confinado - NR33
* Treinamento para entrante (20 HS)
* Autorização para trabalho

13 - Trabalho em Altura - NR35
* Utilização de escadas e andaimes
* Treinamento (08 HS)
* Autorização para trabalho

14 - Período de Experiência / Aprendiz
* Acompanhamento de Novos colaboradores

15 - Sinalização de Área / Isolamento de Área
* Conhecimento e identificação da sinalização

16 - Combate a Incêndio
* Noções básicas, classes de incêndio, agente extintor, aplicação

17 - Ergonomia - Levantamento e Transporte de Peso
* Levantamento e Transporte de Peso, Postura inadequada

18 - Controle do Uso Indevido de Alcool e Drogas
* PO 48

19 - Uso de Filtro Solar

20 - Organização e Limpeza - 5S

21 - Higiene Pessoal e Coletiva

22 - Ordem de Serviço

23 - Uso Restrito do Celular Durante o Trabalho

24 - Gestão de Treinamentos

Observações:
Essa integração deverá ser complementada com a integração de segurança da fábrica onde prestaremos serviços.

Declaro para os devidos fins que recebi e compreendi as orientações acima conforme exigido pela NR18.28. Neste recebi tambem o treinamento do uso correto dos EPIS. Declaro ainda que a partir desta data assumo inteira responsabilidade pelo cumprimento destas normas.'),
('recebimentoepi', 'Recebimento de EPI', '# TERMO DE RESPONSABILIDADE DE RECEBIMENTO DE EQUIPAMENTO
DE PROTEÇÃO INDIVIDUAL - EPI

NOME: {{nome}}

CPF: {{cpf}}

DATA DE ADMISSÃO: {{admissao}}

REGISTRO: {{rh}}

FUNÇÃO: {{cargo_registro}}

DECLARO PARA TODOS OS EFEITOS LEGAIS, QUE RECEBI OS "EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL" RELACIONADOS E FORNECIDOS GRATUITAMENTE NOS TERMOS DO ARTIGO 166 DA CLT, E ITEM 6.2.1.2 DA NR 6 DA PORTARIA 3.214 DE 08/06/78:
QUE PELA PRESENTE E FORMA DE DIREITO, DECLARO ESTAR CIENTE DAS OBRIGAÇÕES QUE PASSO A ASSUMIR COM RELAÇÃO AO EPI MENCIONADO, CONSTANTE NA NORMA REGULAMENTADORA NR-6 DA PORTARIA 3214/78 DO MTb, SUB-ITEM 6.7.1 A SABER:

a) QUE DEVO USAR O EPI APENAS PARA A FINALIDADE A QUE SE DESTINA, RESPONSABILIZANDO-ME PELA GUARDA E CONSERVAÇÃO DO EPI, COMUNICANDO A SEÇÃO DE SEGURANÇA DA EMPRESA QUALQUER ALTERAÇÃO QUE TORNE O EPI IMPRÓPRIO PARA USO;
b) QUE ME ENCONTRO CIENTE E DE PLENO A CORDO COM AS DISPOSIÇÕES DO ART.462 § 1º DA CLT, AUTORIZANDO O DESCONTO SALARIAL PROPORCIONAL AO CUSTO DA REPARAÇÃO OU RESSARCIMENTO DO DANO QUE EVENTUALMENTE VENHO A PROVOCAR NO EPI EM QUESTÃO, JÁ QUE ATESTO TÊ-LO RECEBIDO EM PERFEITAS CONDIÇÕES;
c) QUE CIENTE DA DISPOSIÇÃO LEGAL CONSTANTE NA NR-1 SUBITEM 1.8.1, DE QUE CONSTITUI ATO FALTOSO A RECUSA INJUSTIFICADA DE USAR O EPI ORA FORNECIDO PELA EMPRESA, INCORRENDO NAS PENALIDADES PREVISTAS EM LEI.
d) Art. 158 § letra "B" da CLT DEVO USAR OBRIGATORIAMENTE ESTES EQUIPAMENTOS DURANTE TODA A MINHA JORNADA DE TRABALHO.

DECLARO TER RECEBIDO TREINAMENTO, MINISTRADO PELA ÁREA DE SEGURANÇA, QUANTO AO USO DOS EPIs ESPECIFICADO NESTE DOCUMENTO, E SE TIVER ALGUMA DÚVIDA QUANTO AOS EPI´S PROCURAREI A ÁREA DE SEGURANÇA PARA ESCLARECIMENTO NÉCESSÁRIOS.
ART482 - ALINEA H DA CLT E NR-6 DA PORTARIA Nº3214 DE 08/07/78 - MINHA ASSINATURA NO LOCAL ABAIXO INDICADO CONFIRMA A MINHA CONCORDANCIA.

**CIDADE: {{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}};**

ASSINATURA DO FUNCIONÁRIO POR EXTENSO:

**_______________________________________________________**

| EPI | CA | FABRICANTE | QTD | DATA RECEB. | DATA DEVOL. | TIPO DEVOL. | ASSINATURA
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

[pagina]

| EPI | CA | FABRICANTE | QTD | DATA RECEB. | DATA DEVOL. | TIPO DEVOL. | ASSINATURA
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |'),
('recebimentoepi2', 'Recebimento de EPI (modelo 2)', '# TERMO DE RESPONSABILIDADE DE RECEBIMENTO DE EQUIPAMENTO
DE PROTEÇÃO INDIVIDUAL - EPI

NOME: {{nome}}

CPF: {{cpf}}

DATA DE ADMISSÃO: {{admissao}}

REGISTRO: {{rh}}

FUNÇÃO: {{cargo_registro}}

DECLARO PARA TODOS OS EFEITOS LEGAIS, QUE RECEBI OS "EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL" RELACIONADOS E FORNECIDOS GRATUITAMENTE NOS TERMOS DO ARTIGO 166 DA CLT, E ITEM 6.2.1.2 DA NR 6 DA PORTARIA 3.214 DE 08/06/78:
QUE PELA PRESENTE E FORMA DE DIREITO, DECLARO ESTAR CIENTE DAS OBRIGAÇÕES QUE PASSO A ASSUMIR COM RELAÇÃO AO EPI MENCIONADO, CONSTANTE NA NORMA REGULAMENTADORA NR-6 DA PORTARIA 3214/78 DO MTb, SUB-ITEM 6.7.1 A SABER:

a) QUE DEVO USAR O EPI APENAS PARA A FINALIDADE A QUE SE DESTINA, RESPONSABILIZANDO-ME PELA GUARDA E CONSERVAÇÃO DO EPI, COMUNICANDO A SEÇÃO DE SEGURANÇA DA EMPRESA QUALQUER ALTERAÇÃO QUE TORNE O EPI IMPRÓPRIO PARA USO;
b) QUE ME ENCONTRO CIENTE E DE PLENO A CORDO COM AS DISPOSIÇÕES DO ART.462 § 1º DA CLT, AUTORIZANDO O DESCONTO SALARIAL PROPORCIONAL AO CUSTO DA REPARAÇÃO OU RESSARCIMENTO DO DANO QUE EVENTUALMENTE VENHO A PROVOCAR NO EPI EM QUESTÃO, JÁ QUE ATESTO TÊ-LO RECEBIDO EM PERFEITAS CONDIÇÕES;
c) QUE CIENTE DA DISPOSIÇÃO LEGAL CONSTANTE NA NR-1 SUBITEM 1.8.1, DE QUE CONSTITUI ATO FALTOSO A RECUSA INJUSTIFICADA DE USAR O EPI ORA FORNECIDO PELA EMPRESA, INCORRENDO NAS PENALIDADES PREVISTAS EM LEI.
d) Art. 158 § letra "B" da CLT DEVO USAR OBRIGATORIAMENTE ESTES EQUIPAMENTOS DURANTE TODA A MINHA JORNADA DE TRABALHO.

DECLARO TER RECEBIDO TREINAMENTO, MINISTRADO PELA ÁREA DE SEGURANÇA, QUANTO AO USO DOS EPIs ESPECIFICADO NESTE DOCUMENTO, E SE TIVER ALGUMA DÚVIDA QUANTO AOS EPI´S PROCURAREI A ÁREA DE SEGURANÇA PARA ESCLARECIMENTO NÉCESSÁRIOS.
ART482 - ALINEA H DA CLT E NR-6 DA PORTARIA Nº3214 DE 08/07/78 - MINHA ASSINATURA NO LOCAL ABAIXO INDICADO CONFIRMA A MINHA CONCORDANCIA.

**CIDADE: {{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}};**

ASSINATURA DO FUNCIONÁRIO POR EXTENSO:

**_______________________________________________________**

[pagina]

| EPI | CA | FABRICANTE | QTD | DATA RECEB. | DATA DEVOL. | TIPO DEVOL. | ASSINATURA
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |'),
('termocompromisso', 'Termo de compromisso', '# TERMO DE COMPROMISSO

FUNCIONÁRIO: {{nome}}

Comprometo-me a utilizar as vestimentas adequadas às minhas atividades, conforme NR-10 (item 10.2.9) contemplando, sempre que preciso a condutibilidade, inflamabilidade e influências eletromagnéticas, nos trabalhos em instalações elétricas, quando as medidas de proteção coletiva forem tecnicamente inviáveis ou insuficientes para controlar os riscos. Declaro não executar nenhuma atividade sem que primeiro a empresa me forneça os EPIs e EPCs necessários à execução das atividades, conforme treinamentos a mim ministrados.

ROUPA ESPECIAL QUE ATENDE A NR-10

CAPUZ ESPECIAL QUE ATENDE A NR-10

LUVA ESPECIAL QUE ATENDE A NR-10

{{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}'),
('termodeciencia', 'Termo de ciência', '# TERMO DE CIÊNCIA

EU, {{nome}}, DECLARO ESTAR CIENTE DAS NORMAS INTERNAS PREVISTA NO ACORDO COLETIVO 2014/2015 PACTUADO EM 09/12/2014, ATRAVÉS DO SITICOM DE ITAÚ DE MINAS E HOMOLOGAÇÃO DO MINISTÉRIO DO TRABALHO, Nº4623900007/201512 E REGISTRADO NA UNIDADE DO MTE SOB O NÚMERO MG000170/2015, SENDO ESTE TERMO PARA RATIFICAR A SEGUINTE CLÁUSULA:

**CLÁUSULA DÉCIMA QUARTA - ESCALAÇÃO DE FUNCIONÁRIOS PARA SERVIÇOS EM OUTRAS LOCALIDADES**

A Empresa poderá escalar funcionários para prestação de serviços em outras localidades do país, ficando os funcionários obrigados a cumprir tal escalação, sob pena de desobediência, nos termos do artigo 469, §§ 1º e 3º e artigo 482, letra h da CLT.

# CLT

**Art. 469. Ao empregador é vedado transferir o empregado, sem a sua anuência, para localidade diversa da que resultar do contrato, não se considerando transferência a que não acarretar necessariamente a mudança do seu domicílio.

§ 1º. Não estão compreendidos na proibição deste artigo os empregados que exerçam cargos de confiança e aqueles cujos contratos tenham como condição, implícita ou explícita, a transferência, quando esta decorra de real necessidade de serviço.

§ 3º. Em caso de necessidade de serviço o empregador poderá transferir o empregado para localidade diversa da que resultar do contrato.

Art. 482. Constituem justa causa para rescisão do contrato de trabalho pelo empregador:

h) ato de indisciplina ou de insubordinação;**

(indisciplina é a desobediência a normas gerais da empresa, contidas em regulamentos ou em normas internas de serviços)

DECLARO AINDA QUE, NA ADMISSÃO, INFORMEI A EMPRESA, MINHA DISPONIBILIDADE PARA VIAGENS, INDEPENDENTEMENTE DOS LOCAIS E DATAS QUE ESTAS FOREM NECESSÁRIAS.

{{empresa_cidade}}, {{dia}} DE {{mes_extenso}} DE {{ano}}

[assinaturas: Assinatura do Funcionário]'),
('termosalariofamilia', 'Termo de responsabilidade — salário-família', '# TERMO DE RESPONSABILIDADE

^ (CONCESSÃO DE SALÁRIO-FAMÍLIA - PORTARIA NºMPAS - 3.040/82)

**EMPRESA:**

{{empresa}}

**NºCNPJ:**

{{empresa_cnpj}}

**NOME DO SEGURADO: {{nome}}**

**CPF: {{cpf}}**

^ BENEFICIÁRIOS

[dependentes: salario_familia]

Pelo presente TERMO DE RESPONSABILIDADE declaro estar ciente de que deverei comunicar de imediato a ocorrência dos seguintes fatos ou ocorrências que determinem a perda do direito ao salário-família.

*ÓBITO DE FILHO;
*CESSAÇÃO DA INVALIDES DE FILHO INVÁLIDO;
*SENTENÇA JUDICIAL QUE DETERMINE O PAGAMENTO A OUTREM
(Casos de desquite ou separação, abandono de filho ou perda do pátrio poder).

Estou ciente, ainda, de que a falta de cumprimento do compromisso ora assumido, além de obrigar à devolução das importâncias indevidas, sujeitar-me-á às penalidades previstas no art. 171 do Código Penal e à rescisão do contrato de trabalho, por justa causa, nos termos do art. 482 da Consolidação das Leis do Trabalho.

LOCAL:

{{obra_cidade}} - {{obra_uf}}

DATA:

{{data_hoje}}'),
('testetoxicologico', 'Autorização de teste toxicológico', '# TERMO DE CIÊNCIA E CONSENTIMENTO
DE TESTE TOXICOLOGICO

NOME: {{nome}}

DATA: {{data_hoje}}

Declaro para os devidos fins que, estou ciente que todos os colaboradores sem distinção, inclusive EU, estou sujeito a realização de TESTE TOXICOLOGICO por meio de ETILOMETRO e/ou EXAME DE URINA, qual venho nesta autorizar a realização destes exames caso seja solicitado.

A orientação especifica sobre o teste, obtive o conhecimento através do Procedimento Operacional nº 48 - Prevenção e Controle do uso indevido de Álcool e Drogas no Trabalho.

Comprometo-me a colaborar para as devidas finalidades, tendo a responsabilidade de zelar pela Saúde e Segurança na execução das atividades laborais adotados pela {{empresa}}.

# {{obra_cidade}} / {{obra_uf}}, {{dia}} DE {{mes_extenso}} DE {{ano}}

[assinaturas: Assinatura do Funcionário]

**ETC074**')
on conflict (codigo) do nothing;
