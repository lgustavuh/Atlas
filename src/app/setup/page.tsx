import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { FormSetup } from './FormSetup';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configuração inicial' };

/** Só funciona enquanto não existe nenhum usuário: cria o primeiro administrador. */
export default async function Setup() {
  const { count } = await supabaseAdmin().from('usuarios').select('id', { count: 'exact', head: true });
  if ((count ?? 0) > 0) redirect('/login');
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h1 className="text-lg font-semibold">Configuração inicial</h1>
        <p className="mt-1 mb-5 text-sm text-slate-500">Crie o primeiro usuário. Ele será o administrador do sistema e poderá cadastrar os demais.</p>
        <FormSetup />
      </div>
    </main>
  );
}
