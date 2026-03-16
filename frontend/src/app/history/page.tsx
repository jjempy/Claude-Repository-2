'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CAUSE_CATEGORIES } from '@/lib/constants';

export default function HistoryPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: '', machineId: '', rootCauseCategory: '', dateFrom: '', dateTo: '', status: '',
  });

  useEffect(() => {
    api.getMachines().then((d) => setMachines(d.machines)).catch(() => {});
    fetchProblems();
  }, []);

  const fetchProblems = async (f = filters) => {
    setLoading(true);
    try {
      const params: any = { limit: '100', page: '1' };
      if (f.status) params.status = f.status;
      if (f.machineId) params.machineId = f.machineId;
      if (f.rootCauseCategory) params.rootCauseCategory = f.rootCauseCategory;
      if (f.search) params.search = f.search;
      if (f.dateFrom) params.dateFrom = f.dateFrom;
      if (f.dateTo) params.dateTo = f.dateTo;
      const data = await api.getProblems(params);
      setProblems(data.problems);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProblems(filters);
  };

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    if (key !== 'search') fetchProblems(updated);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RCA History</h1>
          <p className="text-gray-500 text-sm mt-0.5">Search and review past root cause analyses · {total} records</p>
        </div>

        {/* Filters */}
        <div className="card py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search by title, ID, or description..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              className="input"
              value={filters.machineId}
              onChange={(e) => handleFilterChange('machineId', e.target.value)}
            >
              <option value="">All Machines</option>
              {machines.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              className="input"
              value={filters.rootCauseCategory}
              onChange={(e) => handleFilterChange('rootCauseCategory', e.target.value)}
            >
              <option value="">All Root Causes</option>
              {CAUSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              className="input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="From date"
            />
          </div>
        </div>

        {/* Results */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Searching...</div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">No records found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Machine</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Root Cause</th>
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{p.machine?.name || '-'}</td>
                      <td className="px-4 py-3">
                        {p.rootCauseCategory ? (
                          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {p.rootCauseCategory}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.actionStatus} />
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
          )}
        </div>
      </div>
    </AppShell>
  );
}
