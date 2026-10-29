import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServidor } from '@/lib/supabase/server';

/** Baixa um arquivo do bucket privado. A permissão é checada pelo próprio armazenamento (RLS). */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path || path.includes('..')) return new NextResponse('Arquivo inválido.', { status: 400 });

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.storage.from('arquivos').createSignedUrl(path, 60, { download: req.nextUrl.searchParams.has('baixar') });
  if (error || !data) return new NextResponse('Arquivo não encontrado ou sem permissão.', { status: 404 });

  // Documentação de colaboradores: registra quem baixou (como no sistema antigo).
  if (path.startsWith('documentos/')) {
    const { data: doc } = await supabase.from('documentos_colaborador').select('id').eq('arquivo_path', path).maybeSingle();
    const { data: auth } = await supabase.auth.getClaims();
    const usuario = auth?.claims.sub;
    if (doc && usuario) await supabase.from('documentos_colaborador_downloads').insert({ documento_id: doc.id, usuario_id: usuario });
  }
  return NextResponse.redirect(data.signedUrl);
}
