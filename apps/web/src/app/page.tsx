import Link from 'next/link';

import { CATALOG_KIND_LABELS, formatMoney } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { SiteHeader } from '@/components/SiteHeader';
import { loadPublicClinic, type PublicCatalogItem } from '@/lib/clinic';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

function CatalogList({ items }: { items: PublicCatalogItem[] }) {
  return (
    <ul className="divide-y divide-[rgba(31,36,40,0.08)]">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="font-medium">{item.name}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.unit_price)}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function ClinicHomePage() {
  const [clinic, tutor] = await Promise.all([loadPublicClinic(), getTutorContext()]);
  let pets: { id: string; name: string }[] = [];
  if (tutor) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('patients')
      .select('id, name')
      .eq('client_id', tutor.clientId)
      .eq('is_active', true)
      .order('name');
    pets = data ?? [];
  }

  return (
    <main className="pe-app min-h-screen">
      <SiteHeader
        clinicName={clinic.name}
        branchName={clinic.branchName}
        address={clinic.address}
        hours={clinic.hours}
        signedIn={Boolean(tutor)}
        pets={pets}
      />

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center lg:py-16">
          <div>
            <p className="pe-kicker">Consultorio · {clinic.branchName}</p>
            <h1 className="mt-3 max-w-xl font-serif text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
              El consultorio de tu mascota, con la cartilla en casa.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-pe-muted">
              Consulta, vacunas y seguimiento en Roma Norte. Precios a la vista. El expediente viaja
              contigo: refuerzos, altas y la próxima cita.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#servicios" className="pe-btn-primary px-5 py-2.5 text-sm">
                Ver servicios
              </a>
              <a href="#catalogo" className="pe-btn-secondary px-5 py-2.5 text-sm">
                Catálogo y precios
              </a>
            </div>
          </div>
          <aside className="relative overflow-hidden rounded-2xl bg-pe-ink px-7 py-8 text-white shadow-lg">
            <div className="mb-8 flex items-end">
              <img
                src="/marks/perro.png"
                alt=""
                className="relative z-[3] h-24 w-24 rounded-full object-cover ring-[6px] ring-pe-ink"
              />
              <img
                src="/marks/gato.png"
                alt=""
                className="relative z-[2] -ml-6 h-20 w-20 rounded-full object-cover ring-[6px] ring-pe-ink"
              />
              <img
                src="/marks/consulta.png"
                alt=""
                className="relative z-[1] -ml-5 mb-1 h-16 w-16 rounded-full object-cover ring-[6px] ring-pe-ink"
              />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Sucursal</p>
            <p className="mt-2 font-serif text-3xl font-semibold">{clinic.branchName}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{clinic.address}</p>
            <p className="mt-2 text-sm text-white/75">{clinic.hours}</p>
          </aside>
        </section>

        <section className="grid gap-4 border-y border-[rgba(31,36,40,0.08)] py-8 sm:grid-cols-3">
          <div>
            <p className="font-serif text-xl font-semibold">Consulta en el piso</p>
            <p className="mt-1 text-sm leading-relaxed text-pe-muted">Exploración, plan y ticket. Sin inflar a hospital.</p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold">Cartilla digital</p>
            <p className="mt-1 text-sm leading-relaxed text-pe-muted">Vacunas y altas en el perfil de tu mascota.</p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold">Precios visibles</p>
            <p className="mt-1 text-sm leading-relaxed text-pe-muted">Servicios y productos del catálogo, sin sorpresa en caja.</p>
          </div>
        </section>

        <section id="servicios" className="scroll-mt-28 pt-14">
          <p className="pe-kicker">Atención clínica</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Servicios del consultorio</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-pe-muted">
            Lo que se hace en sala y consulta. Cada servicio queda en el expediente.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {clinic.services.map((item) => (
              <article key={item.id} className="pe-card flex flex-col p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pe-muted">
                  {CATALOG_KIND_LABELS[item.kind]}
                </p>
                <h3 className="mt-3 font-serif text-2xl font-semibold">{item.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
                <p className="mt-6 text-lg font-semibold tabular-nums">{formatMoney(item.unit_price)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="catalogo" className="scroll-mt-28 pt-16">
          <p className="pe-kicker">Lista de precios</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Catálogo</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-pe-muted">
            Servicios y productos activos de la clínica. El medicamento se indica en consulta.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="pe-card p-6">
              <h3 className="font-serif text-xl font-semibold">Servicios</h3>
              <CatalogList items={clinic.services} />
            </div>
            <div className="pe-card p-6">
              <h3 className="font-serif text-xl font-semibold">Productos</h3>
              <CatalogList items={clinic.products} />
            </div>
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-2xl bg-pe-ink px-6 py-10 text-white sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-lg">
              <p className="pe-kicker !text-white/55">Tutor</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">Tu cuenta y el perfil de cada mascota</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Arriba a la derecha: Mi cuenta para el resumen, Perfil para la cartilla, las citas y las
                altas. Una cuenta, todas tus mascotas.
              </p>
            </div>
            <Link href={tutor ? '/cuenta' : '/login'} className="pe-btn-primary px-5 py-2.5 text-sm">
              {tutor ? 'Ir a mi cuenta' : 'Entrar a mi cuenta'}
            </Link>
          </div>
        </section>

        <footer className="mt-16 border-t border-[rgba(31,36,40,0.08)] pt-8 text-sm text-pe-muted">
          <p className="font-medium text-pe-ink">{clinic.name}</p>
          <p className="mt-1">
            {clinic.branchName} · {clinic.address}
          </p>
          <p>{clinic.hours}</p>
        </footer>
      </div>
    </main>
  );
}
