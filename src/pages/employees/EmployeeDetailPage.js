import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { ChevronLeft, Mail, Phone, MapPin, Calendar, Briefcase, Building2, AlertTriangle, Pencil, Save, X, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../services/api';

const INFO_ROW = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
    <Icon size={15} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', marginTop: 2 }}>{value || '—'}</div>
    </div>
  </div>
);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [showTerminate, setShowTerminate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    personal: { firstName: '', lastName: '', gender: '', phone: '', dateOfBirth: '', bloodGroup: '', address: { city: '' } },
    professional: { department: '', designation: '', employmentType: '', workLocation: '', joiningDate: '', reportingManager: '', skills: [] },
    salary: { ctc: '', basic: '', hra: '' },
  });

  const canManage = ['SuperAdmin', 'Admin', 'HRManager', 'HR'].includes(user?.role);
  const canDelete = user?.role === 'SuperAdmin';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeAPI.getOne(id).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeAPI.update(id, data),
    onSuccess: () => {
      toast.success('Employee updated');
      queryClient.invalidateQueries(['employee', id]);
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee-stats']);
      setEditMode(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update employee'),
  });

  const terminateMutation = useMutation({
    mutationFn: () => employeeAPI.terminate(id, { reason: terminateReason, terminationDate: new Date() }),
    onSuccess: () => {
      toast.success('Employee terminated');
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee-stats']);
      navigate('/employees');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const activateMutation = useMutation({
    mutationFn: () => employeeAPI.activate(id),
    onSuccess: () => {
      toast.success('Employee activated');
      queryClient.invalidateQueries(['employee', id]);
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee-stats']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to activate employee'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => employeeAPI.delete(id),
    onSuccess: () => {
      toast.success('Employee deleted permanently');
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee', id]);
      queryClient.invalidateQueries(['employee-stats']);
      navigate('/employees');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete employee'),
  });

  const handleEditOpen = (employee) => {
    setForm({
      personal: {
        firstName: employee.personal?.firstName || '',
        lastName: employee.personal?.lastName || '',
        gender: employee.personal?.gender || '',
        phone: employee.personal?.phone || '',
        dateOfBirth: employee.personal?.dateOfBirth ? new Date(employee.personal.dateOfBirth).toISOString().split('T')[0] : '',
        bloodGroup: employee.personal?.bloodGroup || '',
        address: { city: employee.personal?.address?.city || '' },
      },
      professional: {
        department: employee.professional?.department?._id || '',
        designation: employee.professional?.designation || '',
        employmentType: employee.professional?.employmentType || '',
        workLocation: employee.professional?.workLocation || '',
        joiningDate: employee.professional?.joiningDate ? new Date(employee.professional.joiningDate).toISOString().split('T')[0] : '',
        reportingManager: employee.professional?.reportingManager?._id || '',
        skills: employee.professional?.skills || [],
      },
      salary: {
        ctc: employee.salary?.ctc || '',
        basic: employee.salary?.basic || '',
        hra: employee.salary?.hra || '',
      },
    });
    setEditMode(true);
  };

  const setField = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleUpdate = () => {
    const payload = {
      personal: { ...form.personal, address: { city: form.personal.address.city } },
      professional: {
        ...form.professional,
        skills: Array.isArray(form.professional.skills)
          ? form.professional.skills
          : String(form.professional.skills).split(',').map((s) => s.trim()).filter(Boolean),
      },
      salary: {
        ctc: Number(form.salary.ctc) || 0,
        basic: Number(form.salary.basic) || 0,
        hra: Number(form.salary.hra) || 0,
      },
    };
    updateMutation.mutate({ id, data: payload });
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;
  if (isError) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Employee not found</div>;

  const { employee } = data;
  const p = employee.personal;
  const pro = employee.professional;

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" style={{ padding: '0.4rem' }} onClick={() => navigate('/employees')}>
          <ChevronLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Employee Profile</h1>
        {canManage && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            {editMode ? (
              <>
                <button className="btn btn-ghost" onClick={() => setEditMode(false)}>
                  <X size={14} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdate} disabled={updateMutation.isPending}>
                  <Save size={14} /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : employee.status === 'active' ? (
              <>
                <button className="btn btn-ghost" onClick={() => handleEditOpen(employee)}>
                  <Pencil size={14} /> Edit
                </button>
                <button className="btn btn-danger" onClick={() => setShowTerminate(true)}>
                  <AlertTriangle size={14} /> Terminate
                </button>
                {canDelete && (
                  <button className="btn btn-danger" style={{ minWidth: 130 }} onClick={() => setShowDelete(true)}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}>
                <CheckCircle2 size={14} /> {activateMutation.isPending ? 'Activating...' : 'Activate'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.5rem', color: '#fff', flexShrink: 0,
          }}>
            {p?.firstName?.charAt(0)}{p?.lastName?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {p?.firstName} {p?.lastName}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
              {pro?.designation} · {pro?.department?.name}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'DM Mono, monospace', fontSize: '0.75rem',
                padding: '2px 10px', borderRadius: 6,
                background: 'var(--bg-raised)', color: 'var(--primary-light)',
                border: '1px solid var(--border)',
              }}>
                {employee.employeeId}
              </span>
              <span className={`badge badge-${employee.status}`}>
                {employee.status?.replace('_', ' ')}
              </span>
              <span style={{
                padding: '2px 10px', borderRadius: 6,
                background: 'var(--bg-raised)', fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}>
                {pro?.employmentType}
              </span>
              <span style={{
                padding: '2px 10px', borderRadius: 6,
                background: 'var(--bg-raised)', fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}>
                {pro?.workLocation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {editMode ? (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>Edit Employee</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.personal.firstName} onChange={(e) => setField('personal', 'firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.personal.lastName} onChange={(e) => setField('personal', 'lastName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.personal.phone} onChange={(e) => setField('personal', 'phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.personal.address.city} onChange={(e) => setField('personal', 'address', { city: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <input className="form-input" value={form.personal.gender} onChange={(e) => setField('personal', 'gender', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input className="form-input" value={form.personal.bloodGroup} onChange={(e) => setField('personal', 'bloodGroup', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input className="form-input" type="date" value={form.professional.joiningDate} onChange={(e) => setField('professional', 'joiningDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.professional.designation} onChange={(e) => setField('professional', 'designation', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <input className="form-input" value={form.professional.employmentType} onChange={(e) => setField('professional', 'employmentType', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Skills (comma-separated)</label>
              <input className="form-input" value={Array.isArray(form.professional.skills) ? form.professional.skills.join(', ') : form.professional.skills} onChange={(e) => setField('professional', 'skills', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">CTC (Annual)</label>
              <input className="form-input" type="number" value={form.salary.ctc} onChange={(e) => setField('salary', 'ctc', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Basic Salary (Monthly)</label>
              <input className="form-input" type="number" value={form.salary.basic} onChange={(e) => setField('salary', 'basic', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">HRA (Monthly)</label>
              <input className="form-input" type="number" value={form.salary.hra} onChange={(e) => setField('salary', 'hra', e.target.value)} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Contact */}
          <div className="card">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Contact
            </h3>
            <INFO_ROW icon={Mail} label="Email" value={employee.user?.email} />
            <INFO_ROW icon={Phone} label="Phone" value={p?.phone} />
            <INFO_ROW icon={MapPin} label="City" value={p?.address?.city} />
          </div>

          {/* Professional */}
          <div className="card">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Professional
            </h3>
            <INFO_ROW icon={Building2} label="Department" value={pro?.department?.name} />
            <INFO_ROW icon={Briefcase} label="Reports To" value={
              pro?.reportingManager
                ? `${pro.reportingManager.personal?.firstName} ${pro.reportingManager.personal?.lastName} (${pro.reportingManager.employeeId})`
                : 'No manager assigned'
            } />
            <INFO_ROW icon={Calendar} label="Joining Date" value={
              pro?.joiningDate
                ? new Date(pro.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : null
            } />
          </div>

          {/* Skills */}
          {pro?.skills?.length > 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {pro.skills.map((s) => (
                  <span key={s} style={{
                    padding: '4px 12px', borderRadius: 99,
                    background: 'rgba(59,130,246,0.1)', color: 'var(--primary-light)',
                    border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.8rem',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Salary (HR/Admin only) */}
          {canManage && employee.salary?.ctc > 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Compensation (Confidential)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'CTC (Annual)', val: `₹${(employee.salary.ctc / 100000).toFixed(2)} LPA` },
                  { label: 'Basic (Monthly)', val: employee.salary.basic ? `₹${employee.salary.basic.toLocaleString('en-IN')}` : '—' },
                  { label: 'HRA (Monthly)', val: employee.salary.hra ? `₹${employee.salary.hra.toLocaleString('en-IN')}` : '—' },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontFamily: 'DM Mono, monospace', fontSize: '0.95rem' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '1.5rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={20} color="var(--danger)" />
              <h3 style={{ fontWeight: 600 }}>Terminate Employee</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              This will deactivate <strong style={{ color: 'var(--text-primary)' }}>{p?.firstName} {p?.lastName}'s</strong> account and mark them as terminated. This action cannot be easily reversed.
            </p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Reason for Termination</label>
              <textarea
                className="form-input"
                style={{ minHeight: 80, resize: 'vertical' }}
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder="Resignation, performance, end of contract..."
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowTerminate(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => terminateMutation.mutate()}
                disabled={terminateMutation.isPending || !terminateReason}
              >
                {terminateMutation.isPending ? 'Processing...' : 'Confirm Terminate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '1.5rem',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Trash2 size={20} color="var(--danger)" />
              <h3 style={{ fontWeight: 600 }}>Delete Employee Permanently</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              This will permanently remove <strong>{p?.firstName} {p?.lastName}</strong> and the associated user account.
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
