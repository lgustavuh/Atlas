import { BotaoLink, Cartao } from '@/components/ui';

export default function SemAcesso() {
  return (
    <Cartao>
      <div className="py-10 text-center">
        <h1 className="text-lg font-semibold">Acesso restrito</h1>
        <p className="mt-1 text-sm text-slate-500">Seu nível de acesso não permite abrir esta parte do sistema. Fale com o administrador.</p>
        <BotaoLink href="/" className="mt-4">Voltar ao painel</BotaoLink>
      </div>
    </Cartao>
  );
}
