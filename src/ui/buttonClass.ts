export type ButtonVariant = 'primary' | 'soft' | 'help';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white',
  soft: 'bg-primary-soft text-ink',
  help: 'bg-help text-white',
};

/** Classes d'un gros bouton arrondi (≥ 64 px), réutilisables sur un lien. */
export const buttonClass = (variant: ButtonVariant = 'primary') =>
  `inline-flex min-h-touch items-center justify-center gap-3 rounded-full px-8 text-2xl font-extrabold shadow-[0_4px_0_rgb(0_0_0/0.15)] transition active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${variants[variant]}`;
