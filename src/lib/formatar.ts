const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

export function fmtMoeda(v: unknown) {
  if (v === null || v === undefined || v === '') return '';
  return moeda.format(Number(v));
}

export function fmtNumero(v: unknown) {
  if (v === null || v === undefined || v === '') return '';
  return numero.format(Number(v));
}

/** 'AAAA-MM-DD' (ou timestamp) → 'DD/MM/AAAA' sem deslocar fuso. */
export function fmtData(v: unknown) {
  if (!v) return '';
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  if (s.length > 10) {
    return new Date(s).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function fmtDataHora(v: unknown) {
  if (!v) return '';
  return new Date(String(v)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}

export function fmtBool(v: unknown) {
  if (v === null || v === undefined) return '';
  return v ? 'Sim' : 'Não';
}

export function fmtTamanho(bytes: unknown) {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function hojeISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** Valor por extenso em reais (usado nos contratos). */
export function valorPorExtenso(valor: number) {
  const un = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze',
    'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dez = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const cen = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const ate999 = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100), r = n % 100;
    const partes: string[] = [];
    if (c) partes.push(cen[c]);
    if (r < 20) { if (r) partes.push(un[r]); }
    else { partes.push(dez[Math.floor(r / 10)] + (r % 10 ? ' e ' + un[r % 10] : '')); }
    return partes.join(' e ');
  };

  const inteiro = (n: number) => {
    if (n === 0) return 'zero';
    const grupos: [number, string, string][] = [
      [1_000_000_000, 'bilhão', 'bilhões'], [1_000_000, 'milhão', 'milhões'], [1000, 'mil', 'mil'],
    ];
    const partes: string[] = [];
    let resto = n;
    for (const [div, s, p] of grupos) {
      const q = Math.floor(resto / div);
      if (q) {
        partes.push(div === 1000 && q === 1 ? 'mil' : `${ate999(q)} ${q === 1 ? s : p}`);
        resto %= div;
      }
    }
    if (resto) partes.push(ate999(resto));
    if (partes.length > 1 && (resto < 100 || resto % 100 === 0) && resto) {
      const ultimo = partes.pop()!;
      return partes.join(', ') + ' e ' + ultimo;
    }
    return partes.join(', ');
  };

  const reais = Math.floor(Math.round(valor * 100) / 100);
  const centavos = Math.round((valor - reais) * 100);
  let txt = `${inteiro(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (centavos) txt += ` e ${inteiro(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  return txt;
}
