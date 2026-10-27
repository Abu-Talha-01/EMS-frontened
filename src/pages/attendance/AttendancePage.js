import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  LogIn, LogOut, Clock, Calendar, Sun, Moon,
  CheckCircle, XCircle, Coffee, Home, Plane, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Inline API calls (merge into api.js in full project)
const attendanceAPI = {
  checkIn:   (d) => api.post('/attendance/check-in', d),
  checkOut:  (d) => api.post('/attendance/check-out', d),
  getToday:  ()  => api.get('/attendance/today'),
  getHistory:(p) => api.get('/attendance/history', { params: p }),
  getHolidays:(p)=> api.get('/attendance/holidays', { params: p }),
};

const STATUS_META = {
  present:       { label: 'Present',      color: '#10b981', icon: CheckCircle, bg: 'rgba(16,185,129,0.1)' },
  absent:        { label: 'Absent',       color: '#ef4444', icon: XCircle,     bg: 'rgba(239,68,68,0.1)' },
  half_day:      { label: 'Half Day',     color: '#f59e0b', icon: Coffee,      bg: 'rgba(245,158,11,0.1)' },
  work_from_home:{ label: 'WFH',          color: '#3b82f6', icon: Home,        bg: 'rgba(59,130,246,0.1)' },
  on_leave:      { label: 'On Leave',     color: '#8b5cf6', icon: Plane,       bg: 'rgba(139,92,246,0.1)' },
  holiday:       { label: 'Holiday',      color: '#06b6d4', icon: Star,        bg: 'rgba(6,182,212,0.1)' },
  weekly_off:    { label: 'Weekly Off',   color: '#94a3b8', icon: Moon,        bg: 'rgba(148,163,184,0.1)' },
};

const StatPill = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-raised)', borderRadius: 10, padding: '0.75rem 1rem',
    display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80,
  }}>
    <span style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</span>
    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
  </div>
);

export default function AttendancePage() {
  const { user } = useSelector((s) => s.auth);
  const qc = useQueryClient();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [isWFH, setIsWFH] = useState(false);

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceAPI.getToday().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: historyData, isLoading: histLoading } = useQuery({
    queryKey: ['attendance-history', viewMonth, viewYear],
    queryFn: () => attendanceAPI.getHistory({ month: viewMonth, year: viewYear }).then((r) => r.data),
  });

  const { data: holidayData } = useQuery({
    queryKey: ['holidays', viewYear],
    queryFn: () => attendanceAPI.getHolidays({ year: viewYear }).then((r) => r.data),
  });

  const checkInMut = useMutation({
    mutationFn: () => attendanceAPI.checkIn({ isWFH }),
    onSuccess: (r) => { toast.success(r.data.message); qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['attendance-history']); },
    onError: (e) => toast.error(e.response?.data?.error || 'Check-in failed'),
  });

  const checkOutMut = useMutation({
    mutationFn: () => attendanceAPI.checkOut({}),
    onSuccess: (r) => { toast.success(r.data.message); qc.invalidateQueries(['attendance-today']); qc.invalidateQueries(['attendance-history']); },
    onError: (e) => toast.error(e.response?.data?.error || 'Check-out failed'),
  });

  const isCheckedIn  = todayData?.isCheckedIn;
  const isCheckedOut = todayData?.isCheckedOut;
  const att = todayData?.attendance;
  const summary = historyData?.summary;

  // Build calendar
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const attendanceMap = {};
  historyData?.records?.forEach((r) => {
    const day = new Date(r.date).getDate();
    attendanceMap[day] = r;
  });
  const holidayMap = {};
  historyData?.holidays?.forEach((h) => {
    const day = new Date(h.date).getDate();
    holidayMap[day] = h;
  });

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Attendance</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Check In/Out Card */}
      <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.06))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'DM Mono, monospace', color: 'var(--primary-light)' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {att?.checkIn && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Checked in at {new Date(att.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                {att.checkOut && ` · Out at ${new Date(att.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                {att.hoursWorked > 0 && ` · ${Math.floor(att.hoursWorked / 60)}h ${att.hoursWorked % 60}m`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isCheckedIn && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={isWFH} onChange={(e) => setIsWFH(e.target.checked)} />
                Work from Home
              </label>
            )}

            {todayData?.holiday ? (
              <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                🎉 {todayData.holiday.name}
              </div>
            ) : !isCheckedIn ? (
              <button
                className="btn btn-primary"
                onClick={() => checkInMut.mutate()}
                disabled={checkInMut.isPending}
                style={{ padding: '0.6rem 1.5rem' }}
              >
                <LogIn size={16} /> {checkInMut.isPending ? 'Clocking In...' : 'Check In'}
              </button>
            ) : !isCheckedOut ? (
              <button
                className="btn"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.6rem 1.5rem' }}
                onClick={() => checkOutMut.mutate()}
                disabled={checkOutMut.isPending}
              >
                <LogOut size={16} /> {checkOutMut.isPending ? 'Clocking Out...' : 'Check Out'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                <CheckCircle size={18} /> Day complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      {summary && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }}>‹</button>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', minWidth: 160, textAlign: 'center' }}>{monthName}</span>
              <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }}>›</button>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {summary.workingDays} working days
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <StatPill label="Present"  value={summary.present}         color="#10b981" />
            <StatPill label="Absent"   value={summary.absent}          color="#ef4444" />
            <StatPill label="WFH"      value={summary.work_from_home}  color="#3b82f6" />
            <StatPill label="Half Day" value={summary.half_day}        color="#f59e0b" />
            <StatPill label="On Leave" value={summary.on_leave}        color="#8b5cf6" />
            <StatPill label="Hrs Worked" value={`${Math.floor(summary.totalHoursWorked / 60)}h`} color="var(--text-primary)" />
            {summary.totalLateMinutes > 0 && (
              <StatPill label="Late Mins" value={summary.totalLateMinutes} color="#ef4444" />
            )}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '0.25rem' }}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const rec = attendanceMap[day];
              const hol = holidayMap[day];
              const dateObj = new Date(viewYear, viewMonth - 1, day);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              const isWeekend = ['Saturday', 'Sunday'].includes(dayName);
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const isFuture = dateObj > new Date();

              let bg = 'var(--bg-raised)';
              let color = 'var(--text-muted)';
              let title = '';

              if (hol)          { bg = 'rgba(6,182,212,0.15)';      color = '#06b6d4';  title = hol.name; }
              else if (isWeekend){ bg = 'rgba(148,163,184,0.08)';   color = 'var(--text-muted)'; }
              else if (rec) {
                const meta = STATUS_META[rec.status] || {};
                bg    = meta.bg || 'var(--bg-raised)';
                color = meta.color || 'var(--text-secondary)';
                title = meta.label || rec.status;
              }

              return (
                <div
                  key={day}
                  title={title}
                  style={{
                    aspectRatio: '1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8, fontSize: '0.78rem', fontWeight: isToday ? 800 : 500,
                    background: bg, color,
                    border: isToday ? '2px solid var(--primary)' : '2px solid transparent',
                    opacity: isFuture && !isToday ? 0.4 : 1,
                    cursor: rec ? 'pointer' : 'default',
                    transition: 'var(--transition)',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.875rem' }}>
            {Object.entries(STATUS_META).map(([key, { label, color, bg }]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1px solid ${color}` }} />
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent records table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem' }}>
          Attendance Log
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {histLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : historyData?.records?.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No records found</td></tr>
              ) : (
                historyData?.records?.map((r) => {
                  const meta = STATUS_META[r.status] || { label: r.status, color: 'var(--text-muted)', bg: 'var(--bg-raised)' };
                  return (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 500 }}>
                        {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.82rem' }}>
                        {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.82rem' }}>
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.82rem' }}>
                        {r.hoursWorked > 0 ? `${Math.floor(r.hoursWorked / 60)}h ${r.hoursWorked % 60}m` : '—'}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                          background: meta.bg, color: meta.color,
                        }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.note || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
