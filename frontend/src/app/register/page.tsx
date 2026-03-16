'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { ROLE_OPTIONS } from '@/lib/constants';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'OPERATOR',
    orgName: '', joinOrg: false, orgSlug: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        orgName: form.joinOrg ? undefined : form.orgName,
        orgSlug: form.joinOrg ? form.orgSlug : undefined,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <WrenchScrewdriverIcon className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">LeanShop RCA</span>
          </div>
          <p className="text-blue-200">Root Cause Analysis Platform for Manufacturing</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="John Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="john@factory.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.joinOrg}
                  onChange={(e) => setForm({ ...form, joinOrg: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Join existing organization
              </label>
              {form.joinOrg ? (
                <div>
                  <label className="label">Organization Slug</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="my-factory"
                    value={form.orgSlug}
                    onChange={(e) => setForm({ ...form, orgSlug: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label className="label">Organization Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="My Factory"
                    value={form.orgName}
                    onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
