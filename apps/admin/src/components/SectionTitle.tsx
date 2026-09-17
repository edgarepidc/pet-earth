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

const TONE: Record<SectionMarkName, string> = {
  hoy: 'bg-amber-100',
  agenda: 'bg-sky-100',
  pacientes: 'bg-orange-100',
  tutores: 'bg-stone-200',
  seguimiento: 'bg-yellow-100',
  caja: 'bg-orange-100',
  catalogo: 'bg-rose-100',
  informes: 'bg-teal-100',
  clinicas: 'bg-emerald-100',
  consulta: 'bg-sky-100',
  cartilla: 'bg-lime-100',
  perro: 'bg-orange-100',
  gato: 'bg-amber-100',
  otro: 'bg-stone-200',
  sala: 'bg-amber-50',
  alta: 'bg-emerald-100',
  missed: 'bg-rose-100',
  stock: 'bg-orange-100',
};

export function SectionMark({
  name,
  size = 'md',
}: {
  name: SectionMarkName;
  size?: 'sm' | 'md';
}) {
  return (
    <span className={`${size === 'sm' ? 'pe-mark pe-mark-sm' : 'pe-mark'} ${TONE[name]}`} aria-hidden>
      <img src={`/marks/${name}.png`} alt="" width={size === 'sm' ? 18 : 32} height={size === 'sm' ? 18 : 32} />
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
