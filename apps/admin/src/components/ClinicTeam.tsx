'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from '@petearth/shared';

import { ChartCard } from '@/components/SectionTitle';

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
    <ChartCard mark="tutores" title="Equipo">
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-pe-muted">MVZ, recepción y dueño. La sucursal habitual es el piso al entrar.</p>
        <button
          type="button"
          className={`whitespace-nowrap px-3 py-1.5 text-sm ${editingId === 'new' ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'}`}
          onClick={() => (editingId === 'new' ? setEditingId(null) : openNew())}
        >
          Agregar
        </button>
      </div>
      {error ? <p className="pe-callout-amber mt-2 p-3 text-sm">{error}</p> : null}
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
      <ul className="mt-2 divide-y divide-pe-line">
        {staff.map((row) => {
          const open = editingId === row.id;
          const branchName = branches.find((branch) => branch.id === row.branch_id)?.name;
          return (
            <li key={row.id} className="py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="font-medium">{row.fullName || row.email || 'Sin nombre'}</span>
                  {row.status !== 'active' ? <span className="ml-2 text-xs text-pe-muted">Inactivo</span> : null}
                  <span className="mt-0.5 block truncate text-sm text-pe-muted">
                    {[row.email, STAFF_ROLE_LABELS[row.role], branchName ?? 'Toda la clínica'].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="flex shrink-0 gap-2">
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
              </div>
              {open ? (
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
              ) : null}
            </li>
          );
        })}
      </ul>
    </ChartCard>
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
    <form onSubmit={onSubmit} className="mt-3 grid gap-2 sm:grid-cols-2">
      <input
        className="pe-input"
        placeholder="Nombre"
        value={draft.fullName}
        onChange={(e) => onChange({ ...draft, fullName: e.target.value })}
        required
      />
      {creating ? (
        <input
          type="email"
          className="pe-input"
          placeholder="Correo"
          value={draft.email}
          onChange={(e) => onChange({ ...draft, email: e.target.value })}
          required
        />
      ) : (
        <p className="self-center truncate text-sm text-pe-muted">{draft.email || 'Sin correo'}</p>
      )}
      {creating ? (
        <input
          type="password"
          className="pe-input"
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
