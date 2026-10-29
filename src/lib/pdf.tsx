import 'server-only';
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { Bloco, Dependente } from './documentos';
import { fmtData } from './formatar';

// Sem hifenização: o padrão da biblioteca usa regras do inglês e quebra palavras em português errado.
Font.registerHyphenationCallback((palavra) => [palavra]);

const s = StyleSheet.create({
  pagina: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 40, fontSize: 9, fontFamily: 'Helvetica', lineHeight: 1.3 },
  titulo: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 8 },
  centro: { textAlign: 'center', marginBottom: 4 },
  paragrafo: { textAlign: 'justify', marginBottom: 5 },
  negrito: { textAlign: 'justify', marginBottom: 5, fontFamily: 'Helvetica-Bold' },
  tabela: { borderWidth: 0.5, borderColor: '#555', marginBottom: 8 },
  linha: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#555' },
  celula: { flex: 1, padding: 3, minHeight: 15, borderRightWidth: 0.5, borderColor: '#555' },
  cabecalho: { fontFamily: 'Helvetica-Bold', backgroundColor: '#eeeeee' },
  assinaturas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 8, marginBottom: 8 },
  assinatura: { width: '42%', borderTopWidth: 0.7, borderColor: '#000', paddingTop: 3, textAlign: 'center', marginTop: 24 },
  rodape: { position: 'absolute', bottom: 18, left: 42, right: 42, fontSize: 7, color: '#777', flexDirection: 'row', justifyContent: 'space-between' },
});

function Tabela({ linhas }: { linhas: string[][] }) {
  const cols = Math.max(...linhas.map((l) => l.length));
  return (
    <View style={s.tabela}>
      {linhas.map((l, i) => (
        <View key={i} style={[s.linha, i === linhas.length - 1 ? { borderBottomWidth: 0 } : {}]} wrap={false}>
          {Array.from({ length: cols }).map((_, j) => (
            <Text key={j} style={[s.celula, i === 0 ? s.cabecalho : {}, j === cols - 1 ? { borderRightWidth: 0 } : {}]}>{l[j] ?? ''}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function paginas(blocos: Bloco[]) {
  const grupos: Bloco[][] = [[]];
  for (const b of blocos) {
    if (b.tipo === 'pagina') grupos.push([]);
    else grupos.at(-1)!.push(b);
  }
  return grupos.filter((g) => g.length);
}

export async function gerarPdf(titulo: string, nomeColaborador: string, blocos: Bloco[], dependentes: Dependente[]) {
  const doc = (
    <Document title={`${titulo} — ${nomeColaborador}`} author="ATLAS" language="pt-BR">
      {paginas(blocos).map((grupo, gi) => (
        <Page key={gi} size="A4" style={s.pagina}>
          {grupo.map((b, i) => {
            switch (b.tipo) {
              case 'titulo': return <Text key={i} style={s.titulo}>{b.texto}</Text>;
              case 'centro': return <Text key={i} style={s.centro}>{b.texto}</Text>;
              case 'negrito': return <Text key={i} style={s.negrito}>{b.texto}</Text>;
              case 'paragrafo': return <Text key={i} style={s.paragrafo}>{b.texto}</Text>;
              case 'espaco': return <View key={i} style={{ height: 16 }} />;
              case 'tabela': return <Tabela key={i} linhas={b.linhas} />;
              case 'assinaturas':
                return (
                  <View key={i} style={s.assinaturas} wrap={false}>
                    {b.nomes.map((n, j) => <Text key={j} style={s.assinatura}>{n}</Text>)}
                  </View>
                );
              case 'dependentes': {
                const lista = dependentes.filter((d) => !b.salarioFamilia || d.salario_familia);
                const linhas = b.salarioFamilia
                  ? [['Nome do filho(a)', 'Data de nascimento'], ...lista.map((d) => [d.nome, fmtData(d.data_nascimento)])]
                  : [['Nome', 'Grau de parentesco', 'Data de nascimento'], ...lista.map((d) => [d.nome, d.parentesco ?? '', fmtData(d.data_nascimento)])];
                // linhas em branco para preenchimento à mão, como no formulário antigo
                while (linhas.length < 7) linhas.push(b.salarioFamilia ? ['', ''] : ['', '', '']);
                return <Tabela key={i} linhas={linhas} />;
              }
              default: return null;
            }
          })}
          <View style={s.rodape} fixed>
            <Text>ATLAS — {titulo}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
  return renderToBuffer(doc);
}
