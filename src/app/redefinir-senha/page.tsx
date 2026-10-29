import { FormSenha } from '@/components/FormSenha';

export const metadata = { title: 'Nova senha' };

export default function RedefinirSenha() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h1 className="mb-4 text-lg font-semibold">Criar nova senha</h1>
        <FormSenha destino="/" />
      </div>
    </main>
  );
}
