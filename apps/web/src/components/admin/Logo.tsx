/** Logo redonda do protótipo (a arte tem margem, por isso a imagem é maior que o círculo). */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <span
      className='relative block flex-none overflow-hidden rounded-full'
      style={{ width: size, height: size }}
    >
      <img
        src='/brand/logo.png'
        alt='Morro Verde Hortifruti'
        className='absolute max-w-none'
        style={{ width: size * 1.27, height: size * 1.27, left: -size * 0.136, top: -size * 0.136 }}
      />
    </span>
  );
}
