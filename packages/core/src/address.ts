/**
 * Endereço parcial mostrado no fechamento do pedido: a rua inteira, sem número nem complemento, para
 * o cliente reconhecer o endereço sem que quem souber o telefone dele veja onde fica exatamente.
 * "Rua Itupava, 1234" → "Rua Itupava"; "Rua Dom Pedro II 450 - fundos" → "Rua Dom Pedro II".
 * O bairro vai à parte, ao lado.
 */
export function maskAddress(street: string): string {
  const [beforeComma] = street.split(',');
  const [beforeDash] = beforeComma.split(/\s[-–—]\s/);
  return beforeDash
    .trim()
    .replace(/\s+(?:n(?:[º°o.]|úmero)?\s*)?\d+[a-z]?$/i, '')
    .replace(/\s+/g, ' ');
}
