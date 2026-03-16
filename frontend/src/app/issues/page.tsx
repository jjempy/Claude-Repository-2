'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { PlusCircleIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function IssuesPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [machines, setMachines] = useState<any[]>([]);
  const [machineFilter, setMachineFilter] = useState('');

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params: any = { limit: '50', page: '1' };
      if (filters.status) params.status = filters.status;
      if (machineFilter) params.machineId = machineFilter;
      if (filters.search) params.search = filters.search;
      const data = await api.getProblems(params);
      setProblems(data.problems);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getMachines().then((d) => setMachines(d.machines)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [filters.status, machineFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProblems();
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateProblem(id, { actionStatus: status });
      fetchProblems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Issues</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} total issues</p>
          </div>
          <Link href="/problems/new" className="btn-primary flex items-center gap-2">
            <PlusCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Log Issue</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="card py-4">
          <div className="flex flex-wrap gap-3 items-end">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Search issues..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-secondary px-3">Search</button>
            </form>

            <div className="flex gap-2">
              <select
                className="input w-auto"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <select
                className="input w-auto"
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
              >
                <option value="">All Machines</option>
                {machines.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Issues table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">No issues found.</p>
              <Link href="/problems/new" className="btn-primary mt-3 text-sm">Log First Issue</Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Problem</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Machine</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {problems.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.problemId}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{p.title}</div>
                          {p.severity && <SeverityBadge severity={p.severity} />}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {p.machine?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {p.responsiblePerson?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600"
                            value={p.actionStatus}
                            onChange={(e) => updateStatus(p.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/problems/${p.id}`}
                            className="text-blue-600 text-xs hover:underline font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {problems.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/problems/${p.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono text-gray-400">{p.problemId}</span>
                        <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{p.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {p.machine?.name || 'No machine'} · {p.responsiblePerson?.name || 'Unassigned'}
                        </div>
                      </div>
                      <StatusBadge status={p.actionStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
