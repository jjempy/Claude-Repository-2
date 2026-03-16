'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, TrashIcon, BuildingOfficeIcon, CpuChipIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'facilities' | 'machines' | 'team'>('facilities');

  // New facility form
  const [newFacility, setNewFacility] = useState('');
  const [savingFacility, setSavingFacility] = useState(false);

  // New machine form
  const [newMachine, setNewMachine] = useState({ name: '', machineType: '', facilityId: '' });
  const [savingMachine, setSavingMachine] = useState(false);

  const fetchData = () => {
    api.getFacilities().then((d) => setFacilities(d.facilities)).catch(console.error);
    api.getMachines().then((d) => setMachines(d.machines)).catch(console.error);
    api.users().then((d) => setUsers(d.users)).catch(console.error);
  };

  useEffect(() => { fetchData(); }, []);

  const addFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacility.trim()) return;
    setSavingFacility(true);
    try {
      await api.createFacility({ name: newFacility.trim() });
      setNewFacility('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingFacility(false);
    }
  };

  const addMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachine.name || !newMachine.facilityId) return;
    setSavingMachine(true);
    try {
      await api.createMachine(newMachine);
      setNewMachine({ name: '', machineType: '', facilityId: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingMachine(false);
    }
  };

  const deleteMachine = async (id: string) => {
    if (!confirm('Delete this machine? This will not delete associated RCA records.')) return;
    try {
      await api.deleteMachine(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canEdit = user?.role === 'MANAGER' || user?.role === 'ENGINEER';

  const tabs = [
    { id: 'facilities', label: 'Facilities', icon: BuildingOfficeIcon },
    { id: 'machines', label: 'Machines', icon: CpuChipIcon },
    { id: 'team', label: 'Team', icon: UserGroupIcon },
  ] as const;

  const roleColors: Record<string, string> = {
    MANAGER: 'bg-purple-100 text-purple-800',
    ENGINEER: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
    OPERATOR: 'bg-green-100 text-green-800',
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 text-sm">Manage facilities, machines, and team members</p>
        </div>

        {/* User profile */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <span className={`badge mt-1 ${roleColors[user?.role || ''] || 'bg-gray-100 text-gray-700'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Facilities tab */}
        {tab === 'facilities' && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Facilities</h3>

            {canEdit && (
              <form onSubmit={addFacility} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Facility name (e.g. Building A - Machining)"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                />
                <button type="submit" className="btn-primary flex items-center gap-1 px-3" disabled={savingFacility}>
                  <PlusIcon className="w-4 h-4" />
                  Add
                </button>
              </form>
            )}

            <div className="space-y-2">
              {facilities.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.machines?.length || 0} machines</div>
                  </div>
                </div>
              ))}
              {facilities.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No facilities yet. Add your first facility.</p>
              )}
            </div>
          </div>
        )}

        {/* Machines tab */}
        {tab === 'machines' && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Machines</h3>

            {canEdit && (
              <form onSubmit={addMachine} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Machine Name</label>
                    <input
                      type="text"
                      className="input text-sm"
                      placeholder="e.g. CNC Mill #1"
                      value={newMachine.name}
                      onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Machine Type</label>
                    <input
                      type="text"
                      className="input text-sm"
                      placeholder="e.g. CNC Milling"
                      value={newMachine.machineType}
                      onChange={(e) => setNewMachine({ ...newMachine, machineType: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Facility</label>
                  <select
                    className="input text-sm"
                    value={newMachine.facilityId}
                    onChange={(e) => setNewMachine({ ...newMachine, facilityId: e.target.value })}
                    required
                  >
                    <option value="">Select facility...</option>
                    {facilities.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary text-sm py-2" disabled={savingMachine}>
                  {savingMachine ? 'Adding...' : 'Add Machine'}
                </button>
              </form>
            )}

            <div className="space-y-2">
              {machines.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {m.machineType && `${m.machineType} · `}{m.facility?.name}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => deleteMachine(m.id)}
                      className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {machines.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No machines yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Team tab */}
        {tab === 'team' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Team Members ({users.length})</h3>
            </div>
            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                  <span className={`badge ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              To add team members, share your organization slug with new users during registration.
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
