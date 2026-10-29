import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="mt-1 text-sm text-slate-500">O endereço não existe ou o registro foi removido.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-marca-600 hover:underline">Ir para o painel</Link>
      </div>
    </main>
  );
}
