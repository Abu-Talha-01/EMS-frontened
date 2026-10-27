import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Plus, Building2, Users, Pencil, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { departmentAPI } from '../../services/api';

export default function DepartmentsPage() {
  const { user } = useSelector((s) => s.auth);
  const qc = useQueryClient();
  const canManage = ['SuperAdmin', 'HR'].includes(user?.role);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', location: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => departmentAPI.create(d),
    onSuccess: () => { toast.success('Department created'); qc.invalidateQueries(['departments']); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => departmentAPI.update(id, data),
    onSuccess: () => { toast.success('Department updated'); qc.invalidateQueries(['departments']); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => departmentAPI.delete(id),
    onSuccess: () => { toast.success('Department deactivated'); qc.invalidateQueries(['departments']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const openCreate = () => { setForm({ name: '', code: '', description: '', location: '' }); setModal('create'); };
  const openEdit = (dept) => { setSelected(dept); setForm({ name: dept.name, code: dept.code, description: dept.description || '', location: dept.location || '' }); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => {
    if (modal === 'create') createMutation.mutate(form);
    else updateMutation.mutate({ id: selected._id, data: form });
  };

  const DEPT_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Departments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
            {data?.departments?.length ?? '...'} active departments
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {data?.departments?.map((dept, i) => (
            <div
              key={dept._id}
              className="card"
              style={{ position: 'relative', overflow: 'hidden', transition: 'var(--transition)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = DEPT_COLORS[i % DEPT_COLORS.length]}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Color accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: DEPT_COLORS[i % DEPT_COLORS.length],
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${DEPT_COLORS[i % DEPT_COLORS.length]}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={20} color={DEPT_COLORS[i % DEPT_COLORS.length]} />
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.3rem' }}
                      onClick={() => openEdit(dept)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.3rem' }}
                      onClick={() => {
                        if (window.confirm(`Deactivate ${dept.name}?`)) deleteMutation.mutate(dept._id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{dept.name}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: DEPT_COLORS[i % DEPT_COLORS.length], marginBottom: 8 }}>
                {dept.code}
              </div>
              {dept.description && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {dept.description}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Users size={13} />
                <span>{dept.headcount ?? 0} employee{dept.headcount !== 1 ? 's' : ''}</span>
                {dept.location && (
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>📍 {dept.location}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '1.5rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 600 }}>{modal === 'create' ? 'New Department' : 'Edit Department'}</h3>
              <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={closeModal}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label">Code * (max 10 chars)</label>
                <input className="form-input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ENG" maxLength={10} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ minHeight: 72, resize: 'vertical' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Department description..." />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Block A, Floor 3" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!form.name || !form.code || createMutation.isPending || updateMutation.isPending}
              >
                <Save size={15} />
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
