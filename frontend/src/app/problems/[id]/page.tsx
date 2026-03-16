'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import { CAUSE_CATEGORIES, STATUS_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon, PaperClipIcon, PlusIcon, TrashIcon,
  CheckCircleIcon, PencilIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editStatus, setEditStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Action form
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionForm, setActionForm] = useState({ description: '', assignedToId: '', dueDate: '' });

  const fetchProblem = async () => {
    try {
      const data = await api.getProblem(id);
      setProblem(data.problem);
    } catch {
      router.push('/issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
    api.users().then((d) => setUsers(d.users)).catch(() => {});
  }, [id]);

  const updateStatus = async (status: string) => {
    await api.updateProblem(id, { actionStatus: status });
    fetchProblem();
    setEditStatus(false);
  };

  const addAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionForm.description || !actionForm.assignedToId) return;
    await api.createAction({ ...actionForm, problemId: id });
    setActionForm({ description: '', assignedToId: '', dueDate: '' });
    setShowActionForm(false);
    fetchProblem();
  };

  const updateActionStatus = async (actionId: string, status: string) => {
    await api.updateAction(actionId, { status });
    fetchProblem();
  };

  const deleteAction = async (actionId: string) => {
    if (!confirm('Delete this action?')) return;
    await api.deleteAction(actionId);
    fetchProblem();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      await api.uploadAttachments(id, files);
      fetchProblem();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteAttachment = async (attachId: string) => {
    if (!confirm('Delete this attachment?')) return;
    await api.deleteAttachment(attachId);
    fetchProblem();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
      </AppShell>
    );
  }

  if (!problem) return null;

  const causeCategory = CAUSE_CATEGORIES.find((c) => c.id === problem.rootCauseCategory);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/issues" className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-400">{problem.problemId}</span>
              <SeverityBadge severity={problem.severity} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{problem.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {editStatus ? (
              <select
                className="input w-auto text-sm"
                value={problem.actionStatus}
                onChange={(e) => updateStatus(e.target.value)}
                onBlur={() => setEditStatus(false)}
                autoFocus
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <button onClick={() => setEditStatus(true)} className="group flex items-center gap-1">
                <StatusBadge status={problem.actionStatus} />
                <PencilIcon className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
              </button>
            )}
          </div>
        </div>

        {/* Main info */}
        <div className="card space-y-4">
          <Section title="Problem Details">
            {problem.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{problem.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Machine" value={problem.machine?.name} />
              <InfoRow label="Facility" value={problem.facility?.name || problem.machine?.facility?.name} />
              <InfoRow label="Process" value={problem.processType} />
              <InfoRow label="Tool Type" value={problem.toolType} />
              <InfoRow label="Material Batch" value={problem.materialBatch} />
              <InfoRow label="Logged By" value={problem.operator?.name} />
              <InfoRow label="Date" value={new Date(problem.createdAt).toLocaleString()} />
              {problem.estimatedCostImpact && (
                <InfoRow label="Cost Impact" value={`$${problem.estimatedCostImpact.toLocaleString()}`} />
              )}
            </div>
          </Section>

          {problem.observedSymptoms?.length > 0 && (
            <Section title="Observed Symptoms">
              <div className="flex flex-wrap gap-2">
                {problem.observedSymptoms.map((s: string) => (
                  <span key={s} className="badge bg-orange-50 text-orange-700">{s}</span>
                ))}
              </div>
            </Section>
          )}

          {problem.suspectedCauses?.length > 0 && (
            <Section title="Suspected Causes">
              <div className="flex flex-wrap gap-2">
                {problem.suspectedCauses.map((c: string) => (
                  <span key={c} className="badge bg-yellow-50 text-yellow-700">{c}</span>
                ))}
              </div>
            </Section>
          )}

          {(problem.rootCauseCategory || problem.rootCause) && (
            <Section title="Root Cause">
              {causeCategory && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium mb-2 ${causeCategory.color}`}>
                  <span>{causeCategory.icon}</span>
                  <span>Category: {causeCategory.label}</span>
                </div>
              )}
              {problem.rootCause && (
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{problem.rootCause}</p>
              )}
            </Section>
          )}

          {problem.correctiveAction && (
            <Section title="Corrective Action">
              <p className="text-sm text-gray-800 dark:text-gray-200">{problem.correctiveAction}</p>
              <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                <InfoRow label="Assigned To" value={problem.responsiblePerson?.name} />
                <InfoRow label="Due Date" value={problem.dueDate ? new Date(problem.dueDate).toLocaleDateString() : undefined} />
                {problem.resolutionDate && (
                  <InfoRow label="Resolved On" value={new Date(problem.resolutionDate).toLocaleDateString()} />
                )}
              </div>
            </Section>
          )}

          {problem.outcome && (
            <Section title="Outcome">
              <p className="text-sm text-gray-800 dark:text-gray-200">{problem.outcome}</p>
            </Section>
          )}
        </div>

        {/* Corrective Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Corrective Actions</h3>
            <button
              onClick={() => setShowActionForm(!showActionForm)}
              className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3"
            >
              <PlusIcon className="w-4 h-4" />
              Add Action
            </button>
          </div>

          {showActionForm && (
            <form onSubmit={addAction} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div>
                <label className="label text-xs">Action Description</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="What needs to be done?"
                  value={actionForm.description}
                  onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Assigned To</label>
                  <select
                    className="input text-sm"
                    value={actionForm.assignedToId}
                    onChange={(e) => setActionForm({ ...actionForm, assignedToId: e.target.value })}
                    required
                  >
                    <option value="">Select person...</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Due Date</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={actionForm.dueDate}
                    onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm py-1.5">Add Action</button>
                <button type="button" onClick={() => setShowActionForm(false)} className="btn-secondary text-sm py-1.5">Cancel</button>
              </div>
            </form>
          )}

          {problem.actions?.length === 0 && !showActionForm ? (
            <p className="text-sm text-gray-400">No corrective actions yet.</p>
          ) : (
            <div className="space-y-2">
              {problem.actions?.map((action: any) => (
                <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => updateActionStatus(action.id, action.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      action.status === 'RESOLVED'
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {action.status === 'RESOLVED' && <CheckCircleIcon className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${action.status === 'RESOLVED' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {action.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-500">{action.assignedTo?.name}</span>
                      {action.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(action.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <select
                        className="text-xs border border-gray-200 rounded px-1 bg-white dark:bg-gray-800 dark:border-gray-600"
                        value={action.status}
                        onChange={(e) => updateActionStatus(action.id, e.target.value)}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAction(action.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Attachments ({problem.attachments?.length || 0})
            </h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.xlsx,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3"
              >
                <PaperClipIcon className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Attach File'}
              </button>
            </div>
          </div>

          {problem.attachments?.length === 0 ? (
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperClipIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Click to attach photos, videos, or documents</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {problem.attachments.map((att: any) => (
                <div key={att.id} className="group relative border border-gray-200 rounded-lg overflow-hidden">
                  {att.mimeType.startsWith('image/') ? (
                    <a href={`${API_URL}${att.url}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_URL}${att.url}`}
                        alt={att.filename}
                        className="w-full h-24 object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={`${API_URL}${att.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center h-24 bg-gray-50"
                    >
                      <PaperClipIcon className="w-8 h-8 text-gray-400" />
                    </a>
                  )}
                  <div className="p-1.5 bg-white border-t border-gray-100">
                    <p className="text-xs text-gray-600 truncate">{att.filename}</p>
                    <p className="text-xs text-gray-400">{(att.size / 1024).toFixed(0)}KB</p>
                  </div>
                  <button
                    onClick={() => deleteAttachment(att.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{value}</div>
    </div>
  );
}
