'use client';

import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from '@petearth/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { EnterClinicButton } from '@/components/EnterClinicButton';

type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  is_active: boolean;
};

type StaffRow = {
  id: string;
  user_id: string;
  role: StaffRole;
  status: string;
  branch_id: string | null;
  fullName: string | null;
  email: string | null;
};

export function OrgWorkspace({
  organization,
  branches,
  staff,
}: {
  organization: { id: string; name: string; slug: string };
  branches: Branch[];
  staff: StaffRow[];
}) {
  const router = useRouter();
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('vet');
  const [staffBranchId, setStaffBranchId] = useState(branches[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'branch' | 'staff' | null>(null);

  async function addBranch(event: React.FormEvent) {
    event.preventDefault();
    setBusy('branch');
    setError(null);
    const response = await fetch(`/api/platform/orgs/${organization.id}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: branchName, address: branchAddress }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(null);
    if (!response.ok) {
      setError(payload?.error ?? 'No se pudo crear la sucursal.');
      return;
    }
    setBranchName('');
    setBranchAddress('');
    router.refresh();
  }

  async function addStaff(event: React.FormEvent) {
    event.preventDefault();
    setBusy('staff');
    setError(null);
    const response = await fetch(`/api/platform/orgs/${organization.id}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        branchId: staffBranchId || null,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(null);
    if (!response.ok) {
      setError(payload?.error ?? 'No se pudo agregar al staff.');
      return;
    }
    setStaffName('');
    setStaffEmail('');
    setStaffPassword('');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pe-kicker">Veterinaria</p>
          <h1 className="font-serif text-3xl font-semibold">{organization.name}</h1>
          <p className="mt-1 text-sm text-[#6b5e55]">{organization.slug}</p>
        </div>
        {branches[0] ? (
          <EnterClinicButton organizationId={organization.id} branchId={branches[0].id} />
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="pe-card p-5">
        <h2 className="font-serif text-xl font-semibold">Sucursales</h2>
        <ul className="mt-3 divide-y divide-[var(--pe-line)]">
          {branches.map((branch) => (
            <li key={branch.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{branch.name}</p>
                <p className="text-sm text-[#6b5e55]">{branch.address || 'Sin dirección'}</p>
              </div>
              <EnterClinicButton organizationId={organization.id} branchId={branch.id} label="Abrir sucursal" />
            </li>
          ))}
        </ul>
        <form onSubmit={(event) => void addBranch(event)} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="pe-input"
            placeholder="Nueva sucursal"
            required
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
          <input
            className="pe-input"
            placeholder="Dirección"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
          />
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={busy === 'branch'}>
            {busy === 'branch' ? 'Guardando…' : 'Agregar'}
          </button>
        </form>
      </section>

      <section className="pe-card p-5">
        <h2 className="font-serif text-xl font-semibold">Staff</h2>
        <ul className="mt-3 divide-y divide-[var(--pe-line)]">
          {staff.map((row) => (
            <li key={row.id} className="py-3">
              <p className="font-medium">{row.fullName || row.email || 'Sin nombre'}</p>
              <p className="text-sm text-[#6b5e55]">
                {row.email} · {STAFF_ROLE_LABELS[row.role]} · {row.status}
              </p>
            </li>
          ))}
        </ul>
        <form onSubmit={(event) => void addStaff(event)} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="pe-input"
            placeholder="Nombre"
            required
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
          />
          <input
            type="email"
            className="pe-input"
            placeholder="Correo"
            required
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
          />
          <input
            type="password"
            className="pe-input"
            placeholder="Contraseña (si es cuenta nueva)"
            minLength={8}
            value={staffPassword}
            onChange={(e) => setStaffPassword(e.target.value)}
          />
          <select className="pe-input" value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRole)}>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {STAFF_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <select className="pe-input" value={staffBranchId} onChange={(e) => setStaffBranchId(e.target.value)}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={busy === 'staff'}>
            {busy === 'staff' ? 'Guardando…' : 'Agregar staff'}
          </button>
        </form>
        <p className="mt-2 text-xs text-[#6b5e55]">Si el correo ya existe, se liga a esta clínica sin cambiar la contraseña.</p>
      </section>
    </div>
  );
}
