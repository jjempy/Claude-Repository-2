'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { CAUSE_CATEGORIES, PROCESS_TYPES, SYMPTOM_OPTIONS, SEVERITY_OPTIONS, TOOL_TYPES } from '@/lib/constants';
import { CheckCircleIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const STEPS = [
  { id: 1, title: 'Problem Info', desc: 'Describe the issue' },
  { id: 2, title: 'Location', desc: 'Machine & facility' },
  { id: 3, title: 'Process Context', desc: 'Process & material' },
  { id: 4, title: 'Symptoms', desc: 'What was observed' },
  { id: 5, title: 'Possible Causes', desc: '6M Fishbone analysis' },
  { id: 6, title: 'Root Cause', desc: 'Identify the cause' },
  { id: 7, title: 'Corrective Action', desc: 'Assign & schedule' },
  { id: 8, title: 'Review', desc: 'Submit the RCA' },
];

export default function NewProblemPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [facilities, setFacilities] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', severity: 'medium',
    facilityId: '', machineId: '',
    processType: '', materialBatch: '', toolType: '', parameters: '',
    observedSymptoms: [] as string[],
    suspectedCauses: [] as string[],
    rootCauseCategory: '', rootCause: '',
    correctiveAction: '', responsiblePersonId: '', dueDate: '',
    estimatedCostImpact: '', outcome: '',
  });

  useEffect(() => {
    Promise.all([api.getFacilities(), api.users()])
      .then(([f, u]) => {
        setFacilities(f.facilities);
        setUsers(u.users);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (form.facilityId) {
      api.getMachines(form.facilityId)
        .then((d) => setMachines(d.machines))
        .catch(console.error);
    } else {
      api.getMachines().then((d) => setMachines(d.machines)).catch(console.error);
    }
  }, [form.facilityId]);

  const toggleSymptom = (id: string) => {
    setForm((f) => ({
      ...f,
      observedSymptoms: f.observedSymptoms.includes(id)
        ? f.observedSymptoms.filter((s) => s !== id)
        : [...f.observedSymptoms, id],
    }));
  };

  const toggleCause = (cause: string) => {
    setForm((f) => ({
      ...f,
      suspectedCauses: f.suspectedCauses.includes(cause)
        ? f.suspectedCauses.filter((c) => c !== cause)
        : [...f.suspectedCauses, cause],
    }));
  };

  const canProceed = () => {
    if (step === 1) return form.title.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const data = await api.createProblem({
        title: form.title,
        description: form.description,
        severity: form.severity,
        facilityId: form.facilityId || undefined,
        machineId: form.machineId || undefined,
        processType: form.processType || undefined,
        materialBatch: form.materialBatch || undefined,
        toolType: form.toolType || undefined,
        parameters: form.parameters ? { notes: form.parameters } : undefined,
        observedSymptoms: form.observedSymptoms,
        suspectedCauses: form.suspectedCauses,
        rootCauseCategory: form.rootCauseCategory || undefined,
        rootCause: form.rootCause || undefined,
        correctiveAction: form.correctiveAction || undefined,
        responsiblePersonId: form.responsiblePersonId || undefined,
        dueDate: form.dueDate || undefined,
        estimatedCostImpact: form.estimatedCostImpact || undefined,
        outcome: form.outcome || undefined,
        actionStatus: form.responsiblePersonId ? 'IN_PROGRESS' : 'OPEN',
      });
      router.push(`/problems/${data.problem.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create RCA');
      setSubmitting(false);
    }
  };

  const selectedCauseCategory = CAUSE_CATEGORIES.find((c) => c.id === form.rootCauseCategory);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log New Issue</h1>
          <p className="text-gray-500 text-sm">Follow the guided steps to complete your RCA</p>
        </div>

        {/* Progress */}
        <div className="card py-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                    s.id < step
                      ? 'bg-green-500 text-white cursor-pointer'
                      : s.id === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-default'
                  }`}
                >
                  {s.id < step ? <CheckCircleIcon className="w-4 h-4" /> : s.id}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 ${s.id < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Step {step}: {STEPS[step - 1].title}
            </span>
            <span className="text-sm text-gray-500 ml-2">— {STEPS[step - 1].desc}</span>
          </div>
        </div>

        {/* Step content */}
        <div className="card min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Problem Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input text-base"
                  placeholder="e.g. Surface finish defect on aluminum parts"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Additional details about the problem..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm({ ...form, severity: s.value })}
                      className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.severity === s.value
                          ? `${s.bg} ${s.color} border-current`
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label">Facility</label>
                <select className="input" value={form.facilityId} onChange={(e) => setForm({ ...form, facilityId: e.target.value, machineId: '' })}>
                  <option value="">Select facility...</option>
                  {facilities.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Machine</label>
                <select className="input" value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })}>
                  <option value="">Select machine...</option>
                  {machines.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {machines.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No machines configured. Add machines in Settings.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="label">Process Type</label>
                <select className="input" value={form.processType} onChange={(e) => setForm({ ...form, processType: e.target.value })}>
                  <option value="">Select process...</option>
                  {PROCESS_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tool Type (if applicable)</label>
                <select className="input" value={form.toolType} onChange={(e) => setForm({ ...form, toolType: e.target.value })}>
                  <option value="">Select tool type...</option>
                  {TOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Material Batch / Lot #</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. LOT-2024-042"
                  value={form.materialBatch}
                  onChange={(e) => setForm({ ...form, materialBatch: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Process Parameters / Notes</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="e.g. Feed rate: 0.2mm/rev, Speed: 1200 RPM"
                  value={form.parameters}
                  onChange={(e) => setForm({ ...form, parameters: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select all observed symptoms:</p>
              {['Dimensional', 'Surface Quality', 'Structural', 'Functional', 'Process', 'Equipment'].map((cat) => {
                const catSymptoms = SYMPTOM_OPTIONS.filter((s) => s.category === cat);
                return (
                  <div key={cat} className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {catSymptoms.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSymptom(s.id)}
                          className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                            form.observedSymptoms.includes(s.id)
                              ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {form.observedSymptoms.includes(s.id) && '✓ '}{s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {form.observedSymptoms.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">{form.observedSymptoms.length} symptom(s) selected</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select possible causes from the 6M Fishbone categories:
              </p>
              <div className="space-y-4">
                {CAUSE_CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <h4 className={`text-xs font-bold uppercase px-2 py-1 rounded mb-2 inline-flex items-center gap-1 border ${cat.color}`}>
                      <span>{cat.icon}</span> {cat.label}
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {cat.causes.map((cause) => (
                        <button
                          key={cause}
                          type="button"
                          onClick={() => toggleCause(cause)}
                          className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                            form.suspectedCauses.includes(cause)
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {form.suspectedCauses.includes(cause) && '✓ '}{cause}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="label">Root Cause Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CAUSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, rootCauseCategory: cat.id, rootCause: '' })}
                      className={`flex items-center gap-2 px-3 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.rootCauseCategory === cat.id
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCauseCategory && (
                <div>
                  <label className="label">Specific Root Cause</label>
                  <div className="space-y-1.5">
                    {selectedCauseCategory.causes.map((cause) => (
                      <button
                        key={cause}
                        type="button"
                        onClick={() => setForm({ ...form, rootCause: cause })}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          form.rootCause === cause
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {form.rootCause === cause && '✓ '}{cause}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Additional Root Cause Notes</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Add any additional root cause context..."
                  value={!CAUSE_CATEGORIES.flatMap((c) => c.causes).includes(form.rootCause) ? form.rootCause : ''}
                  onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div>
                <label className="label">Corrective Action</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe the corrective action to be taken..."
                  value={form.correctiveAction}
                  onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Responsible Person</label>
                <select
                  className="input"
                  value={form.responsiblePersonId}
                  onChange={(e) => setForm({ ...form, responsiblePersonId: e.target.value })}
                >
                  <option value="">Select person...</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="label">Estimated Cost Impact ($)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={form.estimatedCostImpact}
                  onChange={(e) => setForm({ ...form, estimatedCostImpact: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Review Your RCA</h3>

              <div className="space-y-3 text-sm">
                <ReviewRow label="Problem" value={form.title} />
                <ReviewRow label="Severity" value={form.severity} />
                <ReviewRow label="Machine" value={machines.find((m) => m.id === form.machineId)?.name} />
                <ReviewRow label="Process Type" value={form.processType} />
                <ReviewRow label="Symptoms" value={form.observedSymptoms.length > 0 ? `${form.observedSymptoms.length} selected` : undefined} />
                <ReviewRow label="Suspected Causes" value={form.suspectedCauses.length > 0 ? `${form.suspectedCauses.length} selected` : undefined} />
                <ReviewRow label="Root Cause Category" value={form.rootCauseCategory} />
                <ReviewRow label="Root Cause" value={form.rootCause} />
                <ReviewRow label="Corrective Action" value={form.correctiveAction} />
                <ReviewRow label="Assigned To" value={users.find((u) => u.id === form.responsiblePersonId)?.name} />
                <ReviewRow label="Due Date" value={form.dueDate} />
                {form.estimatedCostImpact && (
                  <ReviewRow label="Cost Impact" value={`$${parseFloat(form.estimatedCostImpact).toLocaleString()}`} />
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </button>

          <span className="text-xs text-gray-400">{step} / {STEPS.length}</span>

          {step < 8 ? (
            <button
              type="button"
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.title}
              className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
            >
              {submitting ? 'Submitting...' : 'Submit RCA'}
              {!submitting && <CheckCircleIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-500 w-36 flex-shrink-0">{label}:</span>
      <span className={`flex-1 ${value ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 italic'}`}>
        {value || 'Not specified'}
      </span>
    </div>
  );
}
