import { redirect } from 'next/navigation';
import { Navegacao } from '@/components/Navegacao';
import { montarMenu } from '@/lib/menu';
import { obterSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

async function sair() {
  'use server';
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessao();
  if (!sessao) redirect('/login');

  return (
    <div className="min-h-screen">
      <Navegacao grupos={montarMenu(sessao)} nome={sessao.nome} podeBuscar={pode(sessao, 'colaboradores', 2)} sair={sair} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
