import Link from 'next/link';

import { formatMoney } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AddToCartButton } from '@/components/AddToCartButton';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import { SiteHeader } from '@/components/SiteHeader';
import { loadPublicClinic, scheduleHref } from '@/lib/clinic';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function ClinicHomePage() {
  const tutor = await getTutorContext();
  const clinic = await loadPublicClinic(tutor?.preferredBranchId);
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
  const branchNames = clinic.branches.map((branch) => branch.name).join(' · ') || clinic.branchName;

  return (
    <main className="pe-app min-h-screen">
      <SiteHeader
        clinicName={clinic.name}
        branchName={branchNames}
        address={clinic.selectedBranch.address}
        hours={clinic.selectedBranch.hours}
        signedIn={Boolean(tutor)}
        pets={pets}
      />

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <section className="py-12 lg:py-16">
          <p className="pe-kicker">Consultorio · {branchNames}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
            El consultorio de tu mascota, con la cartilla en casa.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pe-muted">
            Consulta, vacunas y seguimiento en {branchNames}. Precios a la vista. El expediente viaja
            contigo: refuerzos, altas y la próxima cita.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#servicios" className="pe-btn-primary px-5 py-2.5 text-sm">
              Ver servicios
            </a>
            <a href="#productos" className="pe-btn-secondary px-5 py-2.5 text-sm">
              Ver productos
            </a>
            <a href="#sucursales" className="pe-btn-ghost px-5 py-2.5 text-sm">
              Sucursales
            </a>
          </div>
        </section>

        <section id="sucursales" className="scroll-mt-28 grid gap-5 sm:grid-cols-2">
          {clinic.branches.map((branch) => {
            const preferred = branch.id === clinic.selectedBranch.id && Boolean(tutor);
            return (
              <article key={branch.id} className="relative min-h-[280px] overflow-hidden rounded-2xl shadow-lg">
                <img src={branch.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,36,40,0.88)] via-[rgba(31,36,40,0.35)] to-transparent" />
                <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end px-6 py-7 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                    {preferred ? 'Tu sucursal' : 'Sucursal'}
                  </p>
                  <p className="mt-2 font-serif text-3xl font-semibold">{branch.name}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{branch.address}</p>
                  <p className="mt-2 text-sm text-white/80">{branch.hours}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-12 grid gap-4 border-y border-[rgba(31,36,40,0.08)] py-8 sm:grid-cols-3">
          <div>
            <p className="font-serif text-xl font-semibold">Consulta en el piso</p>
            <p className="mt-1 text-sm leading-relaxed text-pe-muted">Exploración, plan y ticket. Sin inflar a hospital.</p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold">Cartilla digital</p>
            <p className="mt-1 text-sm leading-relaxed text-pe-muted">Vacunas y altas en el perfil de tu mascota.</p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold">Recolección en sucursal</p>
            <p className="mt-1 text-sm leading-relaxed text-pe-muted">Arma el carrito y pasa a recoger. Se paga en caja.</p>
          </div>
        </section>

        <section id="servicios" className="scroll-mt-28 pt-14">
          <p className="pe-kicker text-center">Atención clínica</p>
          <h2 className="mt-2 text-center font-serif text-3xl font-semibold">Servicios del consultorio</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-pe-muted">
            Cada servicio queda en el expediente. El carrusel avanza solo y vuelve a empezar.
          </p>
          <div className="mt-8 -mx-2 sm:-mx-3">
            <ServiceCarousel
              services={clinic.services.map((item) => ({
                ...item,
                href: scheduleHref(Boolean(tutor), pets, item.sku),
              }))}
            />
          </div>
        </section>

        <section id="productos" className="scroll-mt-28 pt-16">
          <p className="pe-kicker text-center">Sucursal</p>
          <h2 className="mt-2 text-center font-serif text-3xl font-semibold">Productos</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-pe-muted">
            Agrégalos al carrito y recógelos en {clinic.branchName}. El medicamento se entrega con
            indicación del veterinario.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clinic.products.map((item) => (
              <article key={item.id} className="pe-card flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-pe-wash">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(31,36,40,0.72)] to-transparent px-4 pb-3 pt-14">
                    <h3 className="font-serif text-xl font-semibold text-white">{item.name}</h3>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-white/90">
                      {formatMoney(item.unit_price)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex-1 text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
                  <div className="mt-4">
                    <AddToCartButton
                      id={item.id}
                      name={item.name}
                      unitPrice={item.unit_price}
                      image={item.image}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-2xl bg-pe-ink px-6 py-10 text-white sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-lg">
              <p className="pe-kicker !text-white/55">Tutor</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">Tu cuenta, el perfil y el carrito</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                En Mi cuenta eliges sucursal preferida, ves mascotas, citas y el carrito para recoger.
              </p>
            </div>
            <Link href={tutor ? '/cuenta' : '/login'} className="pe-btn-primary px-5 py-2.5 text-sm">
              {tutor ? 'Ir a mi cuenta' : 'Entrar a mi cuenta'}
            </Link>
          </div>
        </section>

        <footer className="mt-16 border-t border-[rgba(31,36,40,0.08)] pt-8 text-sm text-pe-muted">
          <p className="font-medium text-pe-ink">{clinic.name}</p>
          {clinic.branches.map((branch) => (
            <p key={branch.id} className="mt-1">
              {branch.name} · {branch.address}
            </p>
          ))}
        </footer>
      </div>
    </main>
  );
}
