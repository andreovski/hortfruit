/**
 * Endereço parcial mostrado no fechamento do pedido, para quem souber o telefone de um restaurante
 * não ver o endereço inteiro: "Rua Itupava, 1234" → "Rua Itu…, 12…".
 */
export function maskAddress(street: string): string {
  const [namePart, ...rest] = street.split(',');
  const words = namePart.trim().split(/\s+/).filter(Boolean);
  let name: string;
  if (words.length <= 1) {
    name = words[0] ? `${words[0].slice(0, 3)}…` : '';
  } else {
    const [first, second] = words;
    name = `${first} ${second.slice(0, 3)}…`;
  }
  const numberMatch = rest.join(',').match(/\d+/);
  const number = numberMatch ? `, ${numberMatch[0].slice(0, 2)}…` : '';
  return `${name}${number}`;
}
