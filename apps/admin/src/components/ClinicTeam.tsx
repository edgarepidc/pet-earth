'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from '@petearth/shared';

import { SectionMark } from '@/components/SectionTitle';

export type ClinicStaffRow = {
  id: string;
  user_id: string;
  role: StaffRole;
  status: 'active' | 'inactive';
  branch_id: string | null;
  fullName: string | null;
  email: string | null;
};

type BranchOption = {
  id: string;
  name: string;
  is_active: boolean;
};

type Draft = {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
  branchId: string;
};

function emptyDraft(branchId: string): Draft {
  return { fullName: '', email: '', password: '', role: 'vet', branchId };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function ClinicTeam({
  staff,
  branches,
}: {
  staff: ClinicStaffRow[];
  branches: BranchOption[];
}) {
  const router = useRouter();
  const activeBranches = branches.filter((branch) => branch.is_active);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(activeBranches[0]?.id ?? ''));

  function openNew() {
    setError(null);
    setDraft(emptyDraft(activeBranches[0]?.id ?? ''));
    setEditingId('new');
  }

  function openEdit(row: ClinicStaffRow) {
    setError(null);
    setDraft({
      fullName: row.fullName ?? '',
      email: row.email ?? '',
      password: '',
      role: row.role,
      branchId: row.branch_id ?? '',
    });
    setEditingId(row.id);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const creating = editingId === 'new';
    if (!draft.fullName.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (creating && !draft.email.trim()) {
      setError('El correo es obligatorio.');
      return;
    }
    setBusy('save');
    const response = await fetch('/api/clinic/staff', {
      method: creating ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        creating
          ? {
              fullName: draft.fullName,
              email: draft.email,
              password: draft.password || undefined,
              role: draft.role,
              branchId: draft.branchId || null,
            }
          : {
              id: editingId,
              fullName: draft.fullName,
              role: draft.role,
              branchId: draft.branchId || null,
            },
      ),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function toggle(row: ClinicStaffRow) {
    setError(null);
    setBusy(row.id);
    const response = await fetch('/api/clinic/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, status: row.status === 'active' ? 'inactive' : 'active' }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo actualizar.');
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
            <SectionMark name="tutores" size="sm" />
            Equipo
          </h2>
          <p className="mt-1 text-xs text-pe-muted">MVZ, recepción y dueño. La sucursal habitual es el piso al entrar.</p>
        </div>
        <button
          type="button"
          className={`whitespace-nowrap px-3 py-1.5 text-sm ${editingId === 'new' ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'}`}
          onClick={() => (editingId === 'new' ? setEditingId(null) : openNew())}
        >
          Agregar
        </button>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {editingId === 'new' ? (
        <StaffForm
          draft={draft}
          branches={activeBranches}
          busy={busy === 'save'}
          creating
          submitLabel="Agregar"
          onChange={setDraft}
          onCancel={() => setEditingId(null)}
          onSubmit={(event) => void save(event)}
        />
      ) : null}
      <div className="pe-card overflow-x-auto px-1 py-2">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
              <th className="w-16 px-3 py-2.5"> </th>
              <th className="px-3 py-2.5">Nombre</th>
              <th className="px-3 py-2.5">Correo</th>
              <th className="px-3 py-2.5">Rol</th>
              <th className="px-3 py-2.5">Sucursal</th>
              <th className="px-3 py-2.5">Piso</th>
              <th className="px-3 py-2.5 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr className="border-b border-pe-line">
                <td className="px-3 py-6 text-pe-muted" colSpan={7}>
                  Nadie en el equipo.
                </td>
              </tr>
            ) : (
              staff.flatMap((row) => {
                const open = editingId === row.id;
                const branchName = branches.find((branch) => branch.id === row.branch_id)?.name;
                const name = row.fullName || row.email || 'Sin nombre';
                const main = (
                  <tr
                    key={row.id}
                    className={`border-b border-pe-line last:border-0 ${
                      row.status === 'active'
                        ? 'bg-[#fbfcf8] shadow-[0_4px_14px_rgba(22,26,22,0.08)] hover:bg-white'
                        : 'bg-pe-wash/40 text-pe-muted'
                    }`}
                  >
                    <td className="border-l-[3px] border-pe-clay bg-[#eef2e6] px-3 py-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-md text-[11px] font-bold tracking-[0.08em] text-pe-clay-700">
                        {initials(name)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-pe-ink">{name}</td>
                    <td className="px-3 py-2.5 text-pe-muted">{row.email ?? '—'}</td>
                    <td className="px-3 py-2.5">{STAFF_ROLE_LABELS[row.role]}</td>
                    <td className="px-3 py-2.5 text-pe-muted">{branchName ?? 'Toda la clínica'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${row.status === 'active' ? 'text-pe-clay-700' : 'text-pe-muted'}`}>
                        {row.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="inline-flex gap-1">
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-sm ${open ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`}
                          onClick={() => (open ? setEditingId(null) : openEdit(row))}
                        >
                          {open ? 'Cerrar' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          className="pe-btn-ghost px-3 py-1.5 text-sm"
                          disabled={busy === row.id}
                          onClick={() => void toggle(row)}
                        >
                          {row.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                      </span>
                    </td>
                  </tr>
                );
                if (!open) return [main];
                return [
                  main,
                  <tr key={`${row.id}-edit`} className="border-b border-pe-line bg-white">
                    <td className="px-3 py-3" colSpan={7}>
                      <StaffForm
                        draft={draft}
                        branches={activeBranches}
                        busy={busy === 'save'}
                        creating={false}
                        submitLabel="Guardar"
                        onChange={setDraft}
                        onCancel={() => setEditingId(null)}
                        onSubmit={(event) => void save(event)}
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
  );
}

function StaffForm({
  draft,
  branches,
  busy,
  creating,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: Draft;
  branches: BranchOption[];
  busy: boolean;
  creating: boolean;
  submitLabel: string;
  onChange: (draft: Draft) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className={`${creating ? 'pe-card p-4' : 'py-1'} grid gap-2 sm:grid-cols-2 lg:grid-cols-4`}>
      <input
        className="pe-input lg:col-span-2"
        placeholder="Nombre"
        value={draft.fullName}
        onChange={(e) => onChange({ ...draft, fullName: e.target.value })}
        required
      />
      {creating ? (
        <input
          type="email"
          className="pe-input lg:col-span-2"
          placeholder="Correo"
          value={draft.email}
          onChange={(e) => onChange({ ...draft, email: e.target.value })}
          required
        />
      ) : (
        <p className="self-center truncate text-sm text-pe-muted lg:col-span-2">{draft.email || 'Sin correo'}</p>
      )}
      {creating ? (
        <input
          type="password"
          className="pe-input lg:col-span-2"
          placeholder="Contraseña (si es cuenta nueva)"
          minLength={8}
          value={draft.password}
          onChange={(e) => onChange({ ...draft, password: e.target.value })}
        />
      ) : null}
      <select className="pe-input" value={draft.role} onChange={(e) => onChange({ ...draft, role: e.target.value as StaffRole })}>
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role}>
            {STAFF_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <select className="pe-input" value={draft.branchId} onChange={(e) => onChange({ ...draft, branchId: e.target.value })}>
        <option value="">Toda la clínica</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
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
