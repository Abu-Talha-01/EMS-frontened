import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Plus, X, CheckCircle, XCircle, Clock, Calendar,
  ChevronLeft, ChevronRight, AlertTriangle, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const leaveAPI = {
  apply:       (d) => api.post('/leave', d),
  getMyLeaves: (p) => api.get('/leave/my', { params: p }),
  getBalance:  (p) => api.get('/leave/balance', { params: p }),
  getPending:  ()  => api.get('/leave/pending'),
  action:      (id, d) => api.patch(`/leave/${id}/action`, d),
  cancel:      (id, d) => api.patch(`/leave/${id}/cancel`, d),
  getPolicies: ()  => api.get('/leave/policies'),
};

const LEAVE_COLORS = {
  casual:    '#3b82f6', sick:      '#ef4444', earned:    '#10b981',
  maternity: '#ec4899', paternity: '#8b5cf6', comp_off:  '#f59e0b',
  bereavement:'#94a3b8',unpaid:    '#6b7280',
};

const STATUS_STYLE = {
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b',  label: 'Pending'   },
  approved:  { bg: 'rgba(16,185,129,0.1)', color: '#10b981',  label: 'Approved'  },
  rejected:  { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444',  label: 'Rejected'  },
  cancelled: { bg: 'rgba(148,163,184,0.1)',color: '#94a3b8',  label: 'Cancelled' },
};

const TAB_STYLE = (active) => ({
  padding: '0.5rem 1.25rem',
  background: active ? 'var(--bg-overlay)' : 'transparent',
  border: 'none',
  borderRadius: 8,
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  fontWeight: active ? 600 : 400,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'var(--transition)',
  whiteSpace: 'nowrap',
});

export default function LeavePage() {
  const { user } = useSelector((s) => s.auth);
  const qc = useQueryClient();
  const isManager = ['SuperAdmin', 'Admin', 'HRManager', 'HR', 'Manager'].includes(user?.role);

  const [tab, setTab] = useState('my');        // my | approvals | all
  const [showApply, setShowApply] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { request, type }
  const [actionComment, setActionComment] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    leaveType: 'casual', from: '', to: '', reason: '', isHalfDay: false, halfDaySession: 'morning',
  });

  const year = new Date().getFullYear();

  const { data: balanceData } = useQuery({
    queryKey: ['leave-balance', year],
    queryFn: () => leaveAPI.getBalance({ year }).then((r) => r.data),
  });

  const { data: myLeavesData, isLoading: myLoading } = useQuery({
    queryKey: ['my-leaves', page],
    queryFn: () => leaveAPI.getMyLeaves({ page, limit: 8 }).then((r) => r.data),
    enabled: tab === 'my',
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => leaveAPI.getPending().then((r) => r.data),
    enabled: tab === 'approvals' && isManager,
    refetchInterval: 60000,
  });

  const { data: policiesData } = useQuery({
    queryKey: ['leave-policies'],
    queryFn: () => leaveAPI.getPolicies().then((r) => r.data),
  });

  const applyMut = useMutation({
    mutationFn: () => leaveAPI.apply(form),
    onSuccess: () => {
      toast.success('Leave application submitted!');
      setShowApply(false);
      setForm({ leaveType: 'casual', from: '', to: '', reason: '', isHalfDay: false, halfDaySession: 'morning' });
      qc.invalidateQueries(['my-leaves']);
      qc.invalidateQueries(['leave-balance']);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to apply'),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }) => leaveAPI.action(id, { action, comment: actionComment }),
    onSuccess: (_, { action }) => {
      toast.success(`Leave ${action} successfully`);
      setActionModal(null);
      setActionComment('');
      qc.invalidateQueries(['pending-leaves']);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Action failed'),
  });

  const cancelMut = useMutation({
    mutationFn: (id) => leaveAPI.cancel(id, { reason: 'Cancelled by employee' }),
    onSuccess: () => {
      toast.success('Leave cancelled');
      qc.invalidateQueries(['my-leaves']);
      qc.invalidateQueries(['leave-balance']);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Cancel failed'),
  });

  const selectedPolicy = policiesData?.policies?.find((p) => p.leaveType === form.leaveType);
  const selectedBalance = balanceData?.balance?.balances?.find((b) => b.leaveType === form.leaveType);

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Leave Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>{year} Leave Year</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApply(true)}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Balance Cards */}
      {balanceData?.balance?.balances?.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}>
          {balanceData.balance.balances.map((b) => {
            const color = LEAVE_COLORS[b.leaveType] || '#94a3b8';
            const pct = b.allocated > 0 ? (b.used / b.allocated) * 100 : 0;
            return (
              <div key={b.leaveType} className="card" style={{ padding: '0.875rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {b.code}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>
                  {b.available}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  of {b.allocated} days left
                </div>
                {/* Mini progress bar */}
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, marginTop: 8 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
                {b.pending > 0 && (
                  <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: 4 }}>
                    {b.pending} pending
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '0.25rem',
        marginBottom: '1rem', width: 'fit-content',
      }}>
        <button style={TAB_STYLE(tab === 'my')} onClick={() => setTab('my')}>
          My Leaves
        </button>
        {isManager && (
          <button style={TAB_STYLE(tab === 'approvals')} onClick={() => setTab('approvals')}>
            Pending Approvals
            {pendingData?.total > 0 && (
              <span style={{
                marginLeft: 6, background: '#ef4444', color: '#fff',
                borderRadius: 99, fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700,
              }}>
                {pendingData.total}
              </span>
            )}
          </button>
        )}
      </div>

      {/* My Leaves Tab */}
      {tab === 'my' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myLoading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : myLeavesData?.requests?.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No leave applications yet
                  </td></tr>
                ) : (
                  myLeavesData?.requests?.map((req) => {
                    const st = STATUS_STYLE[req.status] || {};
                    const color = LEAVE_COLORS[req.leaveType] || '#94a3b8';
                    return (
                      <tr key={req._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ textTransform: 'capitalize' }}>{req.leaveType.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td>{new Date(req.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td>{new Date(req.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ fontWeight: 600 }}>{req.totalDays}</td>
                        <td>
                          <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td>
                          {req.status === 'pending' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                if (window.confirm('Cancel this leave application?')) cancelMut.mutate(req._id);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                          {req.status === 'approved' && new Date(req.from) > new Date() && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                if (window.confirm('Cancel this approved leave?')) cancelMut.mutate(req._id);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {myLeavesData?.total > 8 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Page {page}
              </span>
              <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Approvals Tab */}
      {tab === 'approvals' && isManager && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pendingLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
          ) : pendingData?.requests?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--success)' }} />
              No pending approvals — you're all caught up!
            </div>
          ) : (
            pendingData?.requests?.map((req) => {
              const color = LEAVE_COLORS[req.leaveType] || '#94a3b8';
              const emp = req.employee;
              return (
                <div key={req._id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem', color: '#fff', flexShrink: 0,
                      }}>
                        {emp?.personal?.firstName?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {emp?.personal?.firstName} {emp?.personal?.lastName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {emp?.employeeId} · {emp?.professional?.designation}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 99, background: `${color}18`, color, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>
                            {req.leaveType.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {new Date(req.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {' → '}
                            {new Date(req.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {' · '}<strong>{req.totalDays} day{req.totalDays !== 1 ? 's' : ''}</strong>
                          </span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 400 }}>
                          <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {req.reason}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        className="btn"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.4rem 1rem' }}
                        onClick={() => setActionModal({ request: req, type: 'rejected' })}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                      <button
                        className="btn"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '0.4rem 1rem' }}
                        onClick={() => setActionModal({ request: req, type: 'approved' })}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                    </div>
                  </div>

                  {/* Approval chain */}
                  <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {req.approvalChain?.map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: step.action === 'approved' ? '#10b981' : step.action === 'rejected' ? '#ef4444' : '#f59e0b',
                        }} />
                        <span style={{ color: 'var(--text-muted)' }}>L{step.level} {step.role}</span>
                        <span style={{ color: step.action === 'pending' ? '#f59e0b' : step.action === 'approved' ? '#10b981' : '#ef4444', fontWeight: 600, textTransform: 'capitalize' }}>
                          {step.action}
                        </span>
                        {i < req.approvalChain.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApply && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Apply for Leave</h3>
              <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => setShowApply(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select className="form-input" value={form.leaveType} onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}>
                  {policiesData?.policies?.map((p) => (
                    <option key={p.leaveType} value={p.leaveType}>{p.name} ({p.code})</option>
                  ))}
                </select>
                {selectedBalance && (
                  <div style={{ fontSize: '0.75rem', color: LEAVE_COLORS[form.leaveType], marginTop: 4 }}>
                    Available: {selectedBalance.available} day(s) of {selectedBalance.allocated}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="form-label">From *</label>
                  <input className="form-input" type="date" value={form.from} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">To *</label>
                  <input className="form-input" type="date" value={form.to} min={form.from || new Date().toISOString().split('T')[0]} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.isHalfDay} onChange={(e) => setForm((f) => ({ ...f, isHalfDay: e.target.checked }))} />
                Half Day
              </label>

              {form.isHalfDay && (
                <div className="form-group">
                  <label className="form-label">Session</label>
                  <select className="form-input" value={form.halfDaySession} onChange={(e) => setForm((f) => ({ ...f, halfDaySession: e.target.value }))}>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Brief reason for leave..."
                />
              </div>

              {selectedPolicy?.requiresApproval && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: 'rgba(59,130,246,0.06)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
                  This leave requires approval from your reporting manager and HR.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowApply(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => applyMut.mutate()}
                disabled={applyMut.isPending || !form.from || !form.to || !form.reason}
              >
                {applyMut.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              {actionModal.type === 'approved'
                ? <CheckCircle size={20} color="#10b981" />
                : <XCircle size={20} color="#ef4444" />
              }
              <h3 style={{ fontWeight: 600, textTransform: 'capitalize' }}>{actionModal.type} Leave</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {actionModal.type === 'approved' ? 'Approve' : 'Reject'} leave request from{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {actionModal.request.employee?.personal?.firstName} {actionModal.request.employee?.personal?.lastName}
              </strong>
              {' '}({actionModal.request.totalDays} days)?
            </p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Comment {actionModal.type === 'rejected' ? '*' : '(Optional)'}</label>
              <textarea
                className="form-input"
                style={{ minHeight: 72, resize: 'vertical' }}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={actionModal.type === 'rejected' ? 'Reason for rejection...' : 'Add a note...'}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setActionModal(null); setActionComment(''); }}>Cancel</button>
              <button
                className="btn"
                style={actionModal.type === 'approved'
                  ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                  : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
                }
                onClick={() => actionMut.mutate({ id: actionModal.request._id, action: actionModal.type })}
                disabled={actionMut.isPending || (actionModal.type === 'rejected' && !actionComment)}
              >
                {actionMut.isPending ? 'Processing...' : `Confirm ${actionModal.type === 'approved' ? 'Approve' : 'Reject'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
