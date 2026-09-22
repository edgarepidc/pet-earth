export type SectionMarkName =
  | 'hoy'
  | 'agenda'
  | 'pacientes'
  | 'tutores'
  | 'seguimiento'
  | 'caja'
  | 'catalogo'
  | 'informes'
  | 'clinicas'
  | 'consulta'
  | 'cartilla'
  | 'perro'
  | 'gato'
  | 'conejo'
  | 'otro'
  | 'sala'
  | 'alta'
  | 'missed'
  | 'stock';

export function SectionMark({
  name,
  size = 'md',
}: {
  name: SectionMarkName;
  size?: 'sm' | 'md';
}) {
  return (
    <span className={size === 'sm' ? 'pe-mark pe-mark-sm' : 'pe-mark'} aria-hidden>
      <img src={`/marks/${name}.png`} alt="" />
    </span>
  );
}

export function PageHeading({
  mark,
  kicker,
  title,
  description,
  size = 'md',
  serif = false,
}: {
  mark: SectionMarkName;
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: 'md' | 'lg';
  serif?: boolean;
}) {
  const titleClass =
    size === 'lg'
      ? `text-3xl font-semibold tracking-tight ${serif ? 'font-serif' : ''}`
      : `text-2xl font-semibold tracking-tight ${serif ? 'font-serif' : ''}`;

  return (
    <div className="min-w-0">
      <p className={`pe-kicker h-4 truncate leading-4 ${kicker ? '' : 'invisible'}`}>{kicker || '\u00a0'}</p>
      <div className="mt-1 flex h-11 items-center gap-3">
        <SectionMark name={mark} />
        <h1 className={`${titleClass} truncate whitespace-nowrap`}>{title}</h1>
      </div>
      <p className={`mt-1 h-5 truncate text-sm leading-5 text-pe-muted ${description ? '' : 'invisible'}`}>
        {description || '\u00a0'}
      </p>
    </div>
  );
}

export function ChartCard({
  mark,
  title,
  children,
}: {
  mark: SectionMarkName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pe-card p-4">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
        <SectionMark name={mark} size="sm" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function speciesMark(species: string | null | undefined): SectionMarkName {
  const value = (species ?? '').toLowerCase();
  if (value === 'cat' || value === 'gato') return 'gato';
  if (value === 'conejo' || value === 'rabbit' || value === 'liebre') return 'conejo';
  if (value === 'other' || value === 'otra' || value === 'otro') return 'otro';
  if (value === 'dog' || value === 'perro') return 'perro';
  return 'otro';
}

export function petAvatarSrc(species: string | null | undefined, photoUrl?: string | null) {
  if (photoUrl) return photoUrl;
  const value = (species ?? '').toLowerCase();
  if (value === 'cat' || value === 'gato') return '/marks/gato.png';
  if (value === 'conejo' || value === 'rabbit' || value === 'liebre' || value === 'other' || value === 'otra') {
    return '/marks/conejo.png';
  }
  if (value === 'dog' || value === 'perro') return '/marks/perro.png';
  return '/marks/otro.png';
}
