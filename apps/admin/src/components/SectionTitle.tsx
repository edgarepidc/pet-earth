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

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden className="block h-full w-full">
      <rect width="48" height="48" rx="12" fill="#fff8f1" />
      {children}
    </svg>
  );
}

const MARKS: Record<SectionMarkName, React.ReactNode> = {
  hoy: (
    <Svg>
      <circle cx="24" cy="20" r="9" fill="#f0c15a" />
      <path d="M24 7v3M24 30v3M11 20h3M34 20h3M14 11l2 2M32 29l2 2M34 11l-2 2M14 29l-2 2" stroke="#c45c32" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="24" cy="39" rx="11" ry="4" fill="#1f2428" />
      <circle cx="20" cy="38" r="1.4" fill="#fff8f1" />
      <circle cx="28" cy="38" r="1.4" fill="#fff8f1" />
    </Svg>
  ),
  agenda: (
    <Svg>
      <rect x="10" y="12" width="28" height="26" rx="4" fill="#fff" stroke="#1f2428" strokeWidth="1.6" />
      <path d="M10 18h28" stroke="#c45c32" strokeWidth="8" />
      <rect x="16" y="9" width="3" height="7" rx="1.5" fill="#1f2428" />
      <rect x="29" y="9" width="3" height="7" rx="1.5" fill="#1f2428" />
      <circle cx="18" cy="28" r="1.6" fill="#1f2428" />
      <circle cx="24" cy="28" r="1.6" fill="#1f2428" />
      <circle cx="30" cy="28" r="1.6" fill="#c45c32" />
      <circle cx="18" cy="33" r="1.6" fill="#1f2428" />
      <circle cx="24" cy="33" r="1.6" fill="#c45c32" />
    </Svg>
  ),
  pacientes: (
    <Svg>
      <ellipse cx="17" cy="16" rx="5" ry="7" fill="#c45c32" transform="rotate(-18 17 16)" />
      <ellipse cx="31" cy="16" rx="5" ry="7" fill="#c45c32" transform="rotate(18 31 16)" />
      <ellipse cx="24" cy="27" rx="12" ry="11" fill="#e2b07a" />
      <ellipse cx="24" cy="30" rx="7" ry="6" fill="#f3d7b5" />
      <circle cx="19.5" cy="25" r="1.6" fill="#1f2428" />
      <circle cx="28.5" cy="25" r="1.6" fill="#1f2428" />
      <ellipse cx="24" cy="29.5" rx="2.2" ry="1.5" fill="#1f2428" />
      <path d="M22 32.5c1.2 1.4 2.8 1.4 4 0" stroke="#c45c32" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </Svg>
  ),
  tutores: (
    <Svg>
      <circle cx="22" cy="17" r="7" fill="#e2b07a" />
      <path d="M10 38c1-8 6-12 12-12s11 4 12 12" fill="#1f2428" />
      <circle cx="34" cy="28" r="6" fill="#c45c32" />
      <circle cx="32.2" cy="26.6" r="1.1" fill="#fff8f1" />
      <circle cx="35.8" cy="26.6" r="1.1" fill="#fff8f1" />
      <path d="M32 30.2c1.2 1 2.8 1 4 0" stroke="#fff8f1" strokeWidth="1.2" fill="none" />
    </Svg>
  ),
  seguimiento: (
    <Svg>
      <path d="M16 20a8 8 0 1 1 16 0c0 6 2 8 3 10H13c1-2 3-4 3-10Z" fill="#f0c15a" stroke="#1f2428" strokeWidth="1.4" />
      <path d="M21 34a3 3 0 0 0 6 0" fill="#c45c32" />
      <circle cx="32" cy="14" r="5" fill="#c45c32" />
      <path d="M30 14l1.4 1.4L34.2 12.6" stroke="#fff8f1" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </Svg>
  ),
  caja: (
    <Svg>
      <rect x="12" y="11" width="24" height="28" rx="3" fill="#fff" stroke="#1f2428" strokeWidth="1.6" />
      <path d="M12 11h24v6H12z" fill="#c45c32" />
      <path d="M17 24h14M17 29h10M17 34h8" stroke="#1f2428" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="33" cy="16" r="5.5" fill="#f0c15a" />
      <path d="M33 13v6M31 14.5c1.8-1.2 3.8 0 3.8 1.5s-2 2.2-3.8 1.5" fill="none" stroke="#1f2428" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  ),
  catalogo: (
    <Svg>
      <rect x="16" y="10" width="16" height="8" rx="2" fill="#c45c32" />
      <rect x="14" y="17" width="20" height="22" rx="4" fill="#e2b07a" stroke="#1f2428" strokeWidth="1.4" />
      <path d="M24 24v10M19 29h10" stroke="#fff8f1" strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  ),
  informes: (
    <Svg>
      <rect x="11" y="12" width="26" height="26" rx="4" fill="#fff" stroke="#1f2428" strokeWidth="1.5" />
      <rect x="16" y="28" width="5" height="6" rx="1" fill="#e2b07a" />
      <rect x="22.5" y="22" width="5" height="12" rx="1" fill="#f0c15a" />
      <rect x="29" y="17" width="5" height="17" rx="1" fill="#c45c32" />
    </Svg>
  ),
  clinicas: (
    <Svg>
      <path d="M10 38V22l14-10 14 10v16H10Z" fill="#fff" stroke="#1f2428" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="20" y="26" width="8" height="12" fill="#c45c32" />
      <circle cx="34" cy="16" r="6" fill="#f0c15a" />
      <path d="M31.5 18.2c.8 1.2 2.2 1.6 3.2.4.8 1.2 2.4.8 3.2-.4-1.2-1.6-3.2-2.6-3.2-2.6s-2 .9-3.2 2.6Z" fill="#c45c32" />
    </Svg>
  ),
  consulta: (
    <Svg>
      <path
        d="M16 16a6 6 0 0 1 12 0v4a4 4 0 0 0 8 0"
        fill="none"
        stroke="#1f2428"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="36" cy="20" r="5" fill="#c45c32" />
      <circle cx="16" cy="16" r="4" fill="#e2b07a" stroke="#1f2428" strokeWidth="1.4" />
    </Svg>
  ),
  cartilla: (
    <Svg>
      <path d="M12 12h11v26H14a2 2 0 0 1-2-2V12Z" fill="#fff" stroke="#1f2428" strokeWidth="1.5" />
      <path d="M25 12h11v24a2 2 0 0 1-2 2H25V12Z" fill="#f0c15a" stroke="#1f2428" strokeWidth="1.5" />
      <path d="M16 18h5M16 23h5M16 28h4" stroke="#c45c32" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="31" cy="24" r="4" fill="#c45c32" />
    </Svg>
  ),
  perro: (
    <Svg>
      <ellipse cx="17" cy="16" rx="5" ry="7" fill="#c45c32" transform="rotate(-18 17 16)" />
      <ellipse cx="31" cy="16" rx="5" ry="7" fill="#c45c32" transform="rotate(18 31 16)" />
      <ellipse cx="24" cy="27" rx="12" ry="11" fill="#e2b07a" />
      <circle cx="19.5" cy="25" r="1.6" fill="#1f2428" />
      <circle cx="28.5" cy="25" r="1.6" fill="#1f2428" />
      <ellipse cx="24" cy="29.5" rx="2.2" ry="1.5" fill="#1f2428" />
    </Svg>
  ),
  gato: (
    <Svg>
      <path d="M12 20 18 8l5 10L25 8l6 12" fill="#1f2428" />
      <ellipse cx="24" cy="28" rx="12" ry="11" fill="#e8c48a" />
      <circle cx="19" cy="26" r="1.5" fill="#1f2428" />
      <circle cx="29" cy="26" r="1.5" fill="#1f2428" />
      <path d="M24 29l-2 3h4l-2-3Z" fill="#c45c32" />
      <path d="M11 28h7M30 28h7" stroke="#1f2428" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  ),
  otro: (
    <Svg>
      <circle cx="24" cy="24" r="12" fill="#e2b07a" />
      <ellipse cx="18" cy="16" rx="4" ry="5" fill="#c45c32" />
      <ellipse cx="30" cy="16" rx="4" ry="5" fill="#c45c32" />
      <circle cx="20" cy="23" r="1.5" fill="#1f2428" />
      <circle cx="28" cy="23" r="1.5" fill="#1f2428" />
      <path d="M20 29c2.4 2 5.6 2 8 0" stroke="#1f2428" strokeWidth="1.6" fill="none" />
    </Svg>
  ),
  sala: (
    <Svg>
      <rect x="14" y="20" width="20" height="12" rx="2" fill="#e2b07a" stroke="#1f2428" strokeWidth="1.4" />
      <path d="M18 20v-6h12v6" fill="none" stroke="#1f2428" strokeWidth="1.8" />
      <path d="M14 32v6M34 32v6" stroke="#1f2428" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2" fill="#c45c32" />
    </Svg>
  ),
  alta: (
    <Svg>
      <circle cx="24" cy="24" r="12" fill="#7d9b74" />
      <path d="M18 24h12M24 18v12" stroke="#fff8f1" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  ),
  missed: (
    <Svg>
      <circle cx="24" cy="24" r="12" fill="#ede8e1" stroke="#1f2428" strokeWidth="1.6" />
      <path d="M18 18l12 12M30 18 18 30" stroke="#c45c32" strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  ),
  stock: (
    <Svg>
      <rect x="12" y="16" width="24" height="18" rx="3" fill="#e2b07a" stroke="#1f2428" strokeWidth="1.4" />
      <path d="M12 22h24" stroke="#1f2428" strokeWidth="1.4" />
      <rect x="18" y="12" width="12" height="6" rx="1.5" fill="#c45c32" />
    </Svg>
  ),
};

export function SectionMark({
  name,
  size = 'md',
}: {
  name: SectionMarkName;
  size?: 'sm' | 'md';
}) {
  return (
    <span className={size === 'sm' ? 'pe-mark pe-mark-sm' : 'pe-mark'} aria-hidden>
      {MARKS[name]}
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
