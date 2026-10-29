import 'server-only';
import { supabaseAdmin } from './supabase/server';

/**
 * E-mails do fluxo de compras (substituem os envios via PHPMailer).
 * Sem RESEND_API_KEY configurada, apenas não envia — o fluxo segue normalmente.
 */
async function enviar(para: string[], assunto: string, html: string) {
  const chave = process.env.RESEND_API_KEY;
  const destinos = [...new Set(para.filter(Boolean))];
  if (!chave || !destinos.length) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE ?? 'Atlas <onboarding@resend.dev>',
        to: destinos,
        subject: assunto,
        html,
      }),
    });
  } catch (e) {
    console.error('Falha ao enviar e-mail', e);
  }
}

function link(caminho: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${caminho}`;
}

async function emailsAlcada(obraId: number, tipo: 'pode_liberar' | 'pode_aprovar') {
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data } = await supabaseAdmin().from('alcadas').select('usuarios(email, ativo)').eq('obra_id', obraId).eq(tipo, true).eq('status', 'ativo');
  return ((data as any[]) ?? []).filter((r) => r.usuarios?.ativo).map((r) => r.usuarios.email as string);
}

async function emailUsuario(id: string | null) {
  if (!id || !process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data } = await supabaseAdmin().from('usuarios').select('email').eq('id', id).maybeSingle();
  return data?.email ? [data.email] : [];
}

const corpo = (texto: string, caminho: string) =>
  `<p>${texto}</p><p><a href="${link(caminho)}">Abrir no sistema</a></p><p style="color:#64748b;font-size:12px">Atlas — mensagem automática</p>`;

export async function avisarRequisicaoFinalizada(req: { id: number; obra_id: number; urgente: boolean }) {
  await enviar(await emailsAlcada(req.obra_id, 'pode_liberar'),
    `${req.urgente ? '[URGENTE] ' : ''}Requisição nº ${req.id} aguardando liberação`,
    corpo(`A requisição nº ${req.id} foi finalizada e aguarda sua liberação.`, `/compras/${req.id}`));
}

export async function avisarLiberacao(req: { id: number; solicitante_id: string | null }, liberada: boolean, motivo?: string) {
  await enviar(await emailUsuario(req.solicitante_id),
    `Requisição nº ${req.id} ${liberada ? 'liberada' : 'não liberada'}`,
    corpo(liberada ? `Sua requisição nº ${req.id} foi liberada para compra.` : `Sua requisição nº ${req.id} não foi liberada. Motivo: ${motivo ?? '-'}`, `/compras/${req.id}`));
}

export async function avisarPedidoParaAprovacao(pedidoId: number, req: { id: number; obra_id: number }) {
  await enviar(await emailsAlcada(req.obra_id, 'pode_aprovar'),
    `Pedido de compra nº ${pedidoId} aguardando aprovação`,
    corpo(`O pedido nº ${pedidoId} (requisição nº ${req.id}) aguarda sua aprovação.`, `/compras/${req.id}`));
}

export async function avisarAprovacao(pedidoId: number, criadoPor: string | null, reqId: number, aprovado: boolean, motivo?: string) {
  await enviar(await emailUsuario(criadoPor),
    `Pedido nº ${pedidoId} ${aprovado ? 'aprovado' : 'reprovado'}`,
    corpo(aprovado ? `O pedido nº ${pedidoId} foi aprovado.` : `O pedido nº ${pedidoId} foi reprovado. Motivo: ${motivo ?? '-'}`, `/compras/${reqId}`));
}
