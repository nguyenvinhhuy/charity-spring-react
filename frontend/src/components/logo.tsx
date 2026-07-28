import logoUrl from '@/assets/images/logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Renders the club's official logo image (Câu lạc bộ Thiện Nguyện Hương Sen emblem).
 *
 * @param size pixel width and height of the rendered image
 * @param className optional CSS classes applied to the image element
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt="Câu lạc bộ Thiện Nguyện Hương Sen"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
