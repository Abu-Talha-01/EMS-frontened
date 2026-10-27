import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Save, User, Briefcase, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeAPI, departmentAPI, roleAPI } from '../../services/api';

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'salary', label: 'Salary', icon: DollarSign },
];

const Input = ({ label, error, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input className="form-input" {...props} />
    {error && <span className="form-error">{error}</span>}
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select className="form-input" style={{ cursor: 'pointer' }} {...props}>{children}</select>
  </div>
);

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState({
    email: '', password: 'EMS@123456', role: 'Employee',
    personal: { firstName: '', lastName: '', gender: '', phone: '', dateOfBirth: '', bloodGroup: '' },
    professional: {
      department: '', designation: '', employmentType: 'Full-Time',
      workLocation: 'On-Site', joiningDate: new Date().toISOString().split('T')[0],
      reportingManager: '', skills: '',
    },
    salary: { ctc: '', basic: '', hra: '' },
  });

  const queryClient = useQueryClient();

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAll().then((r) => r.data),
  });

  const { data: roleData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleAPI.getAll().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => employeeAPI.create(data),
    onSuccess: (res) => {
      toast.success(`Employee ${res.data.employee.employeeId} created!`);
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee-stats']);
      navigate('/employees');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create employee');
    },
  });

  const set = (section, key, value) => {
    if (section) {
      setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      professional: {
        ...form.professional,
        skills: form.professional.skills ? form.professional.skills.split(',').map((s) => s.trim()) : [],
      },
      salary: {
        ctc: Number(form.salary.ctc) || 0,
        basic: Number(form.salary.basic) || 0,
        hra: Number(form.salary.hra) || 0,
      },
    };
    mutation.mutate(payload);
  };

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" style={{ padding: '0.4rem' }} onClick={() => navigate('/employees')}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Employee</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Create employee profile & login account</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '0.25rem',
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.6rem',
              background: activeTab === id ? 'var(--bg-overlay)' : 'transparent',
              border: 'none', borderRadius: 8,
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === id ? 600 : 400,
              fontSize: '0.85rem', cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="card">
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="First Name *" value={form.personal.firstName} onChange={(e) => set('personal', 'firstName', e.target.value)} placeholder="John" required />
            <Input label="Last Name *" value={form.personal.lastName} onChange={(e) => set('personal', 'lastName', e.target.value)} placeholder="Doe" required />
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set(null, 'email', e.target.value)} placeholder="john.doe@company.com" required />
            </div>
            <Select label="Gender" value={form.personal.gender} onChange={(e) => set('personal', 'gender', e.target.value)}>
              <option value="">Select gender</option>
              {['Male', 'Female', 'Non-Binary', 'Prefer not to say'].map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select label="Blood Group" value={form.personal.bloodGroup} onChange={(e) => set('personal', 'bloodGroup', e.target.value)}>
              <option value="">Select blood group</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
            <Input label="Phone" type="tel" value={form.personal.phone} onChange={(e) => set('personal', 'phone', e.target.value)} placeholder="+91 9876543210" />
            <Input label="Date of Birth" type="date" value={form.personal.dateOfBirth} onChange={(e) => set('personal', 'dateOfBirth', e.target.value)} />
          </div>
        )}

        {/* Professional Tab */}
        {activeTab === 'professional' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select label="Department *" value={form.professional.department} onChange={(e) => set('professional', 'department', e.target.value)}>
              <option value="">Select department</option>
              {deptData?.departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Select>
            <Input label="Designation *" value={form.professional.designation} onChange={(e) => set('professional', 'designation', e.target.value)} placeholder="Software Engineer" required />
            <Select label="Employment Type" value={form.professional.employmentType} onChange={(e) => set('professional', 'employmentType', e.target.value)}>
              {['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Consultant'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Work Location" value={form.professional.workLocation} onChange={(e) => set('professional', 'workLocation', e.target.value)}>
              {['On-Site', 'Remote', 'Hybrid'].map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select label="Role" value={form.role} onChange={(e) => set(null, 'role', e.target.value)}>
              {(roleData?.roles || [
                { name: 'Employee', label: 'Employee' },
                { name: 'Manager', label: 'Manager' },
                { name: 'HRManager', label: 'HR Manager' },
                { name: 'Admin', label: 'Admin' },
                { name: 'Auditor', label: 'Auditor' },
              ])
                .filter((r) => r.name !== 'SuperAdmin')
                .map((r) => <option key={r.name} value={r.name}>{r.label || r.name}</option>)}
            </Select>
            <Input label="Joining Date *" type="date" value={form.professional.joiningDate} onChange={(e) => set('professional', 'joiningDate', e.target.value)} required />
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Skills (comma-separated)</label>
              <input className="form-input" value={form.professional.skills} onChange={(e) => set('professional', 'skills', e.target.value)} placeholder="React, Node.js, Python, MongoDB" />
            </div>
          </div>
        )}

        {/* Salary Tab */}
        {activeTab === 'salary' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">CTC (Annual) ₹</label>
              <input className="form-input" type="number" value={form.salary.ctc} onChange={(e) => set('salary', 'ctc', e.target.value)} placeholder="1200000" />
              {form.salary.ctc && (
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 4 }}>
                  ₹{(Number(form.salary.ctc) / 100000).toFixed(2)} LPA · ₹{Math.round(form.salary.ctc / 12).toLocaleString('en-IN')}/month
                </span>
              )}
            </div>
            <Input label="Basic Salary (Monthly) ₹" type="number" value={form.salary.basic} onChange={(e) => set('salary', 'basic', e.target.value)} placeholder="50000" />
            <Input label="HRA (Monthly) ₹" type="number" value={form.salary.hra} onChange={(e) => set('salary', 'hra', e.target.value)} placeholder="20000" />
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Default Password</label>
              <input className="form-input" value={form.password} onChange={(e) => set(null, 'password', e.target.value)} placeholder="EMS@123456" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Employee will be prompted to change on first login</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/employees')}>Cancel</button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab !== 'personal' && (
            <button className="btn btn-ghost" onClick={() => setActiveTab(activeTab === 'salary' ? 'professional' : 'personal')}>
              Back
            </button>
          )}
          {activeTab !== 'salary' ? (
            <button className="btn btn-primary" onClick={() => setActiveTab(activeTab === 'personal' ? 'professional' : 'salary')}>
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={mutation.isPending}>
              <Save size={15} />
              {mutation.isPending ? 'Creating...' : 'Create Employee'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
