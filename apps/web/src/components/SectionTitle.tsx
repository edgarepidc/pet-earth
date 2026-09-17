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
    <div>
      {kicker ? <p className="pe-kicker">{kicker}</p> : null}
      <div className={`${kicker ? 'mt-1' : ''} flex items-center gap-3`}>
        <SectionMark name={mark} />
        <h1 className={titleClass}>{title}</h1>
      </div>
      {description ? <p className="mt-1 text-sm text-pe-muted">{description}</p> : null}
    </div>
  );
}

export function speciesMark(species: string | null | undefined): SectionMarkName {
  if (species === 'cat') return 'gato';
  if (species === 'other') return 'otro';
  return 'perro';
}

export function petAvatarSrc(species: string | null | undefined, photoUrl?: string | null) {
  if (photoUrl) return photoUrl;
  if (species === 'cat') return '/marks/gato.png';
  if (species === 'other') return '/marks/conejo.png';
  return '/marks/perro.png';
}
