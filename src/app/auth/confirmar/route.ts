import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServidor } from '@/lib/supabase/server';

/** Retorno dos links enviados por e-mail (recuperação de senha / convite). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const proximo = sp.get('proximo')?.startsWith('/') ? sp.get('proximo')! : '/';
  const supabase = await supabaseServidor();

  const code = sp.get('code');
  const tokenHash = sp.get('token_hash');
  const tipo = sp.get('type') as EmailOtpType | null;
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && tipo
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : { error: new Error('Link inválido') };

  const url = req.nextUrl.clone();
  url.search = '';
  url.pathname = error ? '/login' : proximo;
  return NextResponse.redirect(url);
}
