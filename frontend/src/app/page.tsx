'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  ExclamationCircleIcon, CheckCircleIcon, ClockIcon,
  ArrowTrendingUpIcon, PlusCircleIcon,
} from '@heroicons/react/24/outline';

interface Summary { total: number; open: number; inProgress: number; resolved: number; avgResolutionHours: number; }

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rcaDist, setRcaDist] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [recentProblems, setRecentProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsSummary(),
      api.getRootCauseDistribution(),
      api.getTrend('month'),
      api.getProblems({ limit: '5', page: '1' }),
    ])
      .then(([sum, dist, tr, probs]) => {
        setSummary(sum);
        setRcaDist(dist.data);
        setTrend(tr.data);
        setRecentProblems(probs.problems);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </AppShell>
    );
  }

  const metrics = [
    { label: 'Total Issues', value: summary?.total ?? 0, icon: ArrowTrendingUpIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Open Issues', value: summary?.open ?? 0, icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'In Progress', value: summary?.inProgress ?? 0, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Resolved', value: summary?.resolved ?? 0, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Overview of your RCA activity</p>
          </div>
          <Link href="/problems/new" className="btn-primary flex items-center gap-2">
            <PlusCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Log Issue</span>
          </Link>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{m.label}</span>
                <div className={`p-2 rounded-lg ${m.bg}`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
              </div>
              <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Avg resolution */}
        {(summary?.avgResolutionHours ?? 0) > 0 && (
          <div className="card flex items-center gap-3 py-3">
            <ClockIcon className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Average resolution time:{' '}
              <strong className="text-gray-900 dark:text-white">
                {summary!.avgResolutionHours < 24
                  ? `${summary!.avgResolutionHours}h`
                  : `${Math.round(summary!.avgResolutionHours / 24)}d`}
              </strong>
            </span>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Root cause distribution */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Root Cause Distribution</h3>
            {rcaDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rcaDist} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No root cause data yet. Start logging issues!
              </div>
            )}
          </div>

          {/* Monthly trend */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Issues Logged (Monthly)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent issues */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Issues</h3>
            <Link href="/issues" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {recentProblems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ExclamationCircleIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No issues logged yet.</p>
              <Link href="/problems/new" className="btn-primary inline-block mt-3 text-sm">Log First Issue</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProblems.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/problems/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{p.problemId}</span>
                      {p.severity && <SeverityBadge severity={p.severity} />}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.machine?.name || 'No machine'} · {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={p.actionStatus} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
