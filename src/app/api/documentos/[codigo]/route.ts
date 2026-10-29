import { NextResponse, type NextRequest } from 'next/server';
import { dadosColaborador, interpretar } from '@/lib/documentos';
import { gerarPdf } from '@/lib/pdf';
import { obterSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Gera o PDF de um documento padronizado para um colaborador. Exige login e permissão (antes era aberto). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const sessao = await obterSessao();
  if (!sessao || !pode(sessao, 'documentos_padronizados', 2) || !pode(sessao, 'colaboradores', 2)) {
    return new NextResponse('Sem permissão.', { status: 403 });
  }
  const { codigo } = await params;
  const colaborador = Number(req.nextUrl.searchParams.get('colaborador'));
  if (!colaborador) return new NextResponse('Informe o colaborador.', { status: 400 });

  const supabase = await supabaseServidor();
  const { data: modelo } = await supabase.from('modelos_documentos').select('nome, conteudo').eq('codigo', codigo).eq('status', 'ativo').maybeSingle();
  if (!modelo) return new NextResponse('Modelo não encontrado.', { status: 404 });
  const dados = await dadosColaborador(colaborador);
  if (!dados) return new NextResponse('Colaborador não encontrado.', { status: 404 });

  const pdf = await gerarPdf(modelo.nome, dados.nome, interpretar(modelo.conteudo, dados.campos), dados.dependentes);
  const arquivo = `${codigo}-${dados.nome.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-')}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${arquivo}"`,
      'Cache-Control': 'no-store',
    },
  });
}
