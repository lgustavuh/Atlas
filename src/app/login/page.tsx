import { redirect } from 'next/navigation';
import { FormLogin } from './FormLogin';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Entrar' };

export default async function Login() {
  // Sistema recém-instalado (sem usuários): vai para a configuração inicial.
  try {
    const { count } = await supabaseAdmin().from('usuarios').select('id', { count: 'exact', head: true });
    if (count === 0) redirect('/setup');
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e; // redirect
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-grid size-12 place-items-center rounded-lg bg-marca-600 text-lg font-bold text-white">A</span>
          <h1 className="mt-3 text-lg font-semibold text-white">Atlas</h1>
          <p className="text-sm text-slate-400">Sistema de gestão</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-xl">
          <FormLogin />
        </div>
      </div>
    </main>
  );
}
