'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  hourSelectClocks,
  hoursLabelFromSchedule,
  parseBranchSettings,
  WEEKDAY_CHIPS,
  type BranchSchedule,
} from '@petearth/shared';

import { ClinicFiscalForm } from '@/components/ClinicFiscalForm';
import { ClinicTeam, type ClinicStaffRow } from '@/components/ClinicTeam';
import { ChartCard, PageHeading, SectionMark } from '@/components/SectionTitle';
import type { ClinicListRow } from '@/lib/clinicLists';

export type ClinicBranchRow = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  is_active: boolean;
  settings: unknown;
};

type Draft = {
  name: string;
  address: string;
  phone: string;
  image: string;
  open: string;
  close: string;
  days: number[];
};

function draftFrom(branch?: ClinicBranchRow | null, schedule?: BranchSchedule): Draft {
  const hours = schedule ?? parseBranchSettings(branch?.settings);
  return {
    name: branch?.name ?? '',
    address: branch?.address ?? '',
    phone: hours.phone ?? '',
    image: hours.image ?? '',
    open: hours.open,
    close: hours.close,
    days: hours.days,
  };
}

function emptyDraft(): Draft {
  return draftFrom(null, parseBranchSettings({}));
}

export function ClinicSettings({
  species,
  clinicName,
  branches,
  staff,
  fiscal,
  pacReady = false,
}: {
  species: ClinicListRow[];
  clinicName: string;
  branches: ClinicBranchRow[];
  staff: ClinicStaffRow[];
  fiscal: {
    rfc?: string | null;
    razonSocial?: string | null;
    regimen?: string | null;
    codigoPostal?: string | null;
  };
  pacReady?: boolean;
}) {
  const router = useRouter();
  const clocks = useMemo(() => hourSelectClocks(), []);
  const [name, setName] = useState(clinicName);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  function openNew() {
    setError(null);
    setDraft(emptyDraft());
    setEditingId('new');
  }

  function openEdit(branch: ClinicBranchRow) {
    setError(null);
    setDraft(draftFrom(branch));
    setEditingId(branch.id);
  }

  async function saveClinic(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy('clinic');
    const response = await fetch('/api/clinic/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar la clínica.');
      return;
    }
    router.refresh();
  }

  async function saveBranch(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim()) {
      setError('El nombre de la sucursal es obligatorio.');
      return;
    }
    if (draft.days.length === 0) {
      setError('Elige al menos un día abierto.');
      return;
    }
    setBusy('branch');
    const creating = editingId === 'new';
    const response = await fetch('/api/clinic/branches', {
      method: creating ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: creating ? undefined : editingId,
        name: draft.name,
        address: draft.address,
        phone: draft.phone,
        open: draft.open,
        close: draft.close,
        days: draft.days,
        image: draft.image,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar la sucursal.');
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function toggleBranch(branch: ClinicBranchRow) {
    setError(null);
    setBusy(branch.id);
    const response = await fetch('/api/clinic/branches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: branch.id, isActive: !branch.is_active }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo actualizar la sucursal.');
      return;
    }
    router.refresh();
  }

  async function addSpecies(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/clinic/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'species', label }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agregar.');
      return;
    }
    setLabel('');
    router.refresh();
  }

  async function patchSpecies(id: string, body: { label?: string; isActive?: boolean }) {
    setError(null);
    setBusy(id);
    const response = await fetch('/api/clinic/lists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    router.refresh();
  }

  async function removeSpecies(id: string) {
    setError(null);
    setBusy(id);
    const response = await fetch(`/api/clinic/lists?id=${id}`, { method: 'DELETE' });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo eliminar.');
      return;
    }
    router.refresh();
  }

  const preview = hoursLabelFromSchedule(draft.days, draft.open, draft.close);

  return (
    <section className="space-y-4">
      <PageHeading
        mark="clinicas"
        kicker="Administración"
        title="Configuración"
        description="Sucursales, equipo, fiscales y listas del consultorio."
      />
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard mark="clinicas" title="Clínica">
          <form onSubmit={(event) => void saveClinic(event)} className="mt-3 grid gap-2">
            <p className="text-xs text-pe-muted">Nombre público: receta, cartilla y página web.</p>
            <input className="pe-input" value={name} onChange={(e) => setName(e.target.value)} required />
            <button type="submit" className="pe-btn-primary justify-self-start px-4 py-2 text-sm" disabled={busy === 'clinic'}>
              {busy === 'clinic' ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        </ChartCard>
        <ChartCard mark="informes" title="Emisor fiscal">
          <ClinicFiscalForm
            rfc={fiscal.rfc}
            razonSocial={fiscal.razonSocial}
            regimen={fiscal.regimen}
            codigoPostal={fiscal.codigoPostal}
            pacReady={pacReady}
          />
        </ChartCard>
      </div>

      <section className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
              <SectionMark name="sala" size="sm" />
              Sucursales
            </h2>
            <p className="mt-1 text-xs text-pe-muted">Nombre, dirección, teléfono y horario. Eso sale en la web y arma el piso.</p>
          </div>
          <button
            type="button"
            className={`whitespace-nowrap px-3 py-1.5 text-sm ${editingId === 'new' ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'}`}
            onClick={() => (editingId === 'new' ? setEditingId(null) : openNew())}
          >
            Agregar
          </button>
        </div>
        {editingId === 'new' ? (
          <BranchForm
            clocks={clocks}
            draft={draft}
            preview={preview}
            busy={busy === 'branch'}
            submitLabel="Agregar"
            onChange={setDraft}
            onCancel={() => setEditingId(null)}
            onSubmit={(event) => void saveBranch(event)}
          />
        ) : null}
        <div className="pe-card overflow-x-auto px-1 py-2">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                <th className="w-16 px-3 py-2.5">Foto</th>
                <th className="px-3 py-2.5">Nombre</th>
                <th className="px-3 py-2.5">Dirección</th>
                <th className="px-3 py-2.5">Teléfono</th>
                <th className="px-3 py-2.5">Horario</th>
                <th className="px-3 py-2.5">Sitio</th>
                <th className="px-3 py-2.5 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr className="border-b border-pe-line">
                  <td className="px-3 py-6 text-pe-muted" colSpan={7}>
                    No hay sucursales.
                  </td>
                </tr>
              ) : (
                branches.flatMap((branch) => {
                  const schedule = parseBranchSettings(branch.settings);
                  const open = editingId === branch.id;
                  const main = (
                    <tr
                      key={branch.id}
                      className={`border-b border-pe-line last:border-0 ${
                        branch.is_active
                          ? 'bg-[#fbfcf8] shadow-[0_4px_14px_rgba(22,26,22,0.08)] hover:bg-white'
                          : 'bg-pe-wash/40 text-pe-muted'
                      }`}
                    >
                      <td className="border-l-[3px] border-pe-clay bg-[#eef2e6] px-3 py-2">
                        {schedule.image ? (
                          <img src={schedule.image} alt="" className="h-11 w-14 rounded-md object-cover" />
                        ) : (
                          <span className="flex h-11 w-14 items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-[0.08em] text-pe-clay-700">
                            {branch.name.slice(0, 1)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-pe-ink">{branch.name}</td>
                      <td className="max-w-[14rem] truncate px-3 py-2.5 text-pe-muted">{branch.address || '—'}</td>
                      <td className="px-3 py-2.5 tabular-nums text-pe-muted">{schedule.phone || '—'}</td>
                      <td className="px-3 py-2.5 text-pe-muted">{schedule.hours}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-semibold ${branch.is_active ? 'text-pe-clay-700' : 'text-pe-muted'}`}>
                          {branch.is_active ? 'Visible' : 'Oculta'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex gap-1">
                          <button
                            type="button"
                            className={`px-3 py-1.5 text-sm ${open ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`}
                            onClick={() => (open ? setEditingId(null) : openEdit(branch))}
                          >
                            {open ? 'Cerrar' : 'Editar'}
                          </button>
                          <button
                            type="button"
                            className="pe-btn-ghost px-3 py-1.5 text-sm"
                            disabled={busy === branch.id}
                            onClick={() => void toggleBranch(branch)}
                          >
                            {branch.is_active ? 'Ocultar' : 'Mostrar'}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                  if (!open) return [main];
                  return [
                    main,
                    <tr key={`${branch.id}-edit`} className="border-b border-pe-line bg-white">
                      <td className="px-3 py-3" colSpan={7}>
                        <BranchForm
                          clocks={clocks}
                          draft={draft}
                          preview={preview}
                          busy={busy === 'branch'}
                          submitLabel="Guardar"
                          onChange={setDraft}
                          onCancel={() => setEditingId(null)}
                          onSubmit={(event) => void saveBranch(event)}
                        />
                      </td>
                    </tr>,
                  ];
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ClinicTeam staff={staff} branches={branches} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ChartCard mark="pacientes" title="Especies">
          <p className="mt-1 text-xs text-pe-muted">Perro y gato vienen de fábrica. Agrega conejo, ave u otra.</p>
          <form onSubmit={(event) => void addSpecies(event)} className="mt-3 flex gap-2">
            <input
              className="pe-input h-8 min-w-0 flex-1 py-1 text-sm"
              placeholder="Nueva especie"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
            <button type="submit" className="pe-btn-primary h-8 px-3 text-sm">
              Agregar
            </button>
          </form>
          <ul className="mt-3 divide-y divide-pe-line">
            {species.map((item) => (
              <li key={item.id} className="flex items-center gap-1.5 py-1.5">
                <input
                  className="pe-input h-8 min-w-0 flex-1 py-1 text-sm"
                  defaultValue={item.label}
                  disabled={busy === item.id}
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next && next !== item.label) void patchSpecies(item.id, { label: next });
                  }}
                />
                <button
                  type="button"
                  className="pe-btn-ghost px-2 py-1 text-[11px]"
                  disabled={busy === item.id}
                  onClick={() => void patchSpecies(item.id, { isActive: !item.is_active })}
                >
                  {item.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  type="button"
                  className="pe-btn-ghost px-2 py-1 text-[11px] text-pe-danger"
                  disabled={busy === item.id}
                  onClick={() => void removeSpecies(item.id)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </section>
  );
}

function BranchForm({
  clocks,
  draft,
  preview,
  busy,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: {
  clocks: string[];
  draft: Draft;
  preview: string;
  busy: boolean;
  submitLabel: string;
  onChange: (draft: Draft) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  function toggleDay(day: number) {
    const days = draft.days.includes(day) ? draft.days.filter((value) => value !== day) : [...draft.days, day];
    onChange({ ...draft, days });
  }

  return (
    <form onSubmit={onSubmit} className={`${submitLabel === 'Agregar' ? 'pe-card p-4' : 'py-1'} grid gap-2 sm:grid-cols-2`}>
      <input
        className="pe-input"
        placeholder="Nombre"
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        required
      />
      <input
        className="pe-input"
        placeholder="Teléfono"
        value={draft.phone}
        onChange={(e) => onChange({ ...draft, phone: e.target.value })}
      />
      <input
        className="pe-input sm:col-span-2"
        placeholder="Dirección"
        value={draft.address}
        onChange={(e) => onChange({ ...draft, address: e.target.value })}
      />
      <input
        className="pe-input sm:col-span-2"
        placeholder="Foto (/catalog/… o https://)"
        value={draft.image}
        onChange={(e) => onChange({ ...draft, image: e.target.value })}
      />
      <div className="flex flex-wrap gap-1.5 sm:col-span-2">
        {WEEKDAY_CHIPS.map((chip) => {
          const on = draft.days.includes(chip.day);
          return (
            <button
              key={chip.day}
              type="button"
              className={`px-2.5 py-1 text-sm ${on ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`}
              onClick={() => toggleDay(chip.day)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      <label className="text-sm">
        Abre
        <select className="pe-input mt-1" value={draft.open} onChange={(e) => onChange({ ...draft, open: e.target.value })}>
          {clocks.map((clock) => (
            <option key={clock} value={clock}>
              {clock}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Cierra
        <select className="pe-input mt-1" value={draft.close} onChange={(e) => onChange({ ...draft, close: e.target.value })}>
          {clocks.map((clock) => (
            <option key={clock} value={clock}>
              {clock}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-pe-muted sm:col-span-2">{preview}</p>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={busy}>
          {busy ? 'Guardando…' : submitLabel}
        </button>
        <button type="button" className="pe-btn-ghost px-3 py-2 text-sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
