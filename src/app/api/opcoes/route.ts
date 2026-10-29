import { NextResponse, type NextRequest } from 'next/server';
import { buscarOpcoes } from '@/lib/crud';
import { obterRef } from '@/lib/refs';

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref') ?? '';
  if (!obterRef(ref)) return NextResponse.json([], { status: 400 });
  const q = req.nextUrl.searchParams.get('q') ?? undefined;
  return NextResponse.json(await buscarOpcoes(ref, q));
}
