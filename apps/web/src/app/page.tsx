import Link from 'next/link';

import { formatMoney } from '@petearth/shared';

import { SiteHeader } from '@/components/SiteHeader';
import { SectionMark } from '@/components/SectionTitle';
import { loadPublicClinic } from '@/lib/clinic';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function ClinicHomePage() {
  const [clinic, tutor] = await Promise.all([loadPublicClinic(), getTutorContext()]);
  const profileHref = tutor ? '/cuenta' : '/login';

  return (
    <main className="pe-app min-h-screen px-5 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-14">
        <SiteHeader clinicName={clinic.name} signedIn={Boolean(tutor)} />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:items-end">
          <div>
            <p className="pe-kicker">Consultorio · {clinic.branchName}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Consulta, vacunas y el expediente de tu mascota.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-pe-muted">
              Piso de consultorio, no hospital. Te atendemos en {clinic.branchName} y dejas la cartilla
              digital para el siguiente refuerzo, el alta y las citas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={profileHref} className="pe-btn-primary px-5 py-2.5 text-sm">
                Entrar al perfil de tu mascota
              </Link>
              <a href="#servicios" className="pe-btn-secondary px-5 py-2.5 text-sm">
                Ver servicios
              </a>
            </div>
          </div>
          <aside className="pe-card p-5 text-sm">
            <p className="font-semibold">{clinic.branchName}</p>
            <p className="mt-1 text-pe-muted">{clinic.address}</p>
            <p className="mt-3 text-pe-muted">{clinic.hours}</p>
          </aside>
        </section>

        <section id="servicios" className="scroll-mt-8 space-y-6">
          <div>
            <p className="pe-kicker">Lo que hacemos aquí</p>
            <h2 className="mt-1 flex items-center gap-2 font-serif text-3xl font-semibold">
              <SectionMark name="consulta" />
              Servicios
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinic.services.map((item) => (
              <article key={item.id} className="pe-card p-5">
                <p className="font-serif text-xl font-semibold">{item.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
                <p className="mt-4 text-sm font-medium tabular-nums">{formatMoney(Number(item.unit_price))}</p>
              </article>
            ))}
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-serif text-2xl font-semibold">
              <SectionMark name="cartilla" size="sm" />
              Preventivos
            </h3>
            <p className="mt-1 max-w-xl text-sm text-pe-muted">
              Se aplican en consulta y quedan en la cartilla. El medicamento se cobra aparte cuando aplica.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.preventives.map((item) => (
                <article key={item.id} className="pe-card p-5">
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
                  <p className="mt-4 text-sm font-medium tabular-nums">{formatMoney(Number(item.unit_price))}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pe-card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold">¿Ya eres tutor de la clínica?</h2>
            <p className="mt-1 max-w-md text-sm text-pe-muted">
              Entra con tu correo para ver vacunas, altas y la próxima cita de tu mascota.
            </p>
          </div>
          <Link href={profileHref} className="pe-btn-primary px-5 py-2.5 text-sm">
            {tutor ? 'Ir a tu cartilla' : 'Acceder al perfil'}
          </Link>
        </section>
      </div>
    </main>
  );
}
