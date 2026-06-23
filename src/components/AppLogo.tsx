import { cn } from '@/lib/utils';
import { COMPANY_BRAND_NAME } from '@/lib/invoice-branding';

/** Logo officiel servi depuis `public/tlr-logo.jpeg`. */
export const APP_LOGO_SRC = `${import.meta.env.BASE_URL}tlr-logo.jpeg`;

type AppLogoVariant = 'login' | 'sidebar' | 'header' | 'compact' | 'hero';

/**
 * Le fichier TLR est un logo horizontal. Les variantes privilégient une carte
 * blanche sobre pour préserver le contraste et éviter de rogner le visuel.
 */
const variantConfig: Record<
  AppLogoVariant,
  { wrapper: string; img: string }
> = {
  login: {
    wrapper: cn(
      'inline-flex items-center justify-center rounded-3xl p-3 sm:p-4',
      'bg-white ring-2 ring-white/70 shadow-2xl shadow-black/25',
    ),
    img: cn(
      'block object-contain object-center select-none',
      'h-auto w-[min(17rem,72vw)] max-h-44',
      'rounded-2xl',
    ),
  },
  sidebar: {
    wrapper: cn(
      'inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden',
      'h-12 w-32 px-2',
      'bg-white ring-1 ring-white/30 shadow-lg shadow-black/10',
    ),
    img: cn('max-h-11 w-auto max-w-full object-contain object-center select-none'),
  },
  header: {
    wrapper: cn(
      'inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden',
      'h-10 w-28 px-2',
      'bg-white ring-1 ring-border/80 shadow-sm',
    ),
    img: cn('max-h-full w-auto max-w-full object-contain object-center select-none'),
  },
  compact: {
    wrapper: cn(
      'inline-flex items-center justify-center rounded-lg overflow-hidden h-8 w-16 px-1',
      'bg-white ring-1 ring-border/60',
    ),
    img: cn('max-h-full max-w-full object-contain object-center p-px select-none'),
  },
  hero: {
    wrapper: cn(
      'inline-flex items-center justify-center rounded-2xl p-2',
      'bg-white ring-1 ring-border/50 shadow-md',
    ),
    img: cn(
      'block object-contain object-center select-none',
      'max-h-24 sm:max-h-28 w-auto max-w-[12rem]',
      'rounded-xl',
    ),
  },
};

export function AppLogo({
  variant = 'sidebar',
  className,
  alt = `${COMPANY_BRAND_NAME}, gestion de flotte`,
}: {
  variant?: AppLogoVariant;
  className?: string;
  alt?: string;
}) {
  const { wrapper, img } = variantConfig[variant];

  return (
    <span className={cn(wrapper, className)}>
      <img
        src={APP_LOGO_SRC}
        alt={alt}
        className={img}
        loading={variant === 'login' ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        fetchPriority={variant === 'login' ? 'high' : undefined}
      />
    </span>
  );
}
