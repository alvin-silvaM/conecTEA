// "Ana Beatriz Lima" -> "AL" (primeira e última palavra)
export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export const apenasDigitos = (valor = '') => valor.replace(/\D/g, '');

// Máscara de telefone BR enquanto digita, tipo (85) 90000-0000 ou (85) 3000-0000
export function mascararTelefone(valor = '') {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const corte = d.length > 10 ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

// 00.000.000/0000-00 (a API recebe só os 14 dígitos e não mais q isso)
export function mascararCnpj(valor = '') {
  const d = apenasDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export const emailValido = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;

export const enderecoEmTexto = (e) => (e ? `${e.rua}, ${e.numero} — ${e.municipio}/${e.estado}` : '');
