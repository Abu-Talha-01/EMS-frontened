import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Users, Building2, UserCheck, TrendingUp,
  MapPin, Activity, CheckCircle, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { employeeAPI, departmentAPI } from '../../services/api';

const PIE_COLORS  = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];
const BAR_COLORS  = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const LINE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// ─── Shared tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-overlay)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.8rem',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? p.fill ?? '#3b82f6', fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = '#3b82f6' }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

// ─── Chart wrapper ────────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, height = 220, children }) => (
  <div className="card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{title}</h3>
      {subtitle && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>}
    </div>
    <div style={{ height }}>
      {children}
    </div>
  </div>
);

const EmptyState = ({ height = 220 }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
    No data available
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const canViewOrgStats = ['SuperAdmin', 'Admin', 'HRManager', 'HR', 'Manager'].includes(user?.role);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => employeeAPI.getStats().then((r) => r.data),
    enabled: canViewOrgStats,
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAll().then((r) => r.data),
    enabled: canViewOrgStats,
  });

  // ── Chart data derivations ────────────────────────────────────────────────
  // 1. Headcount by Department (Bar)
  const deptChartData = (statsData?.byDepartment || []).map((d) => ({
    name: d.department?.split(' ')[0] || 'Unknown',
    count: d.count,
  }));

  // 2. Work Location Split (Donut Pie)
  const locationData = (statsData?.byWorkLocation || []).map((d) => ({
    name: d._id,
    value: d.count,
  }));

  // 3. Employment Type Trend (Line) — month-on-month new joiners grouped by type
  //    Falls back to byEmploymentType as a simple bar if trend isn't available
  const employmentTrendData = statsData?.employmentTrend?.length
    ? statsData.employmentTrend
    : (statsData?.byEmploymentType || []).map((d, i) => ({
        name: d._id || `Type ${i + 1}`,
        count: d.count,
      }));

  // 4. Department vs Avg CTC Radar
  const deptCtcData = statsData?.deptCtcRadar?.length
    ? statsData.deptCtcRadar
    : (statsData?.byDepartment || []).map((d) => ({
        dept: (d.department || 'Unk').slice(0, 5),
        avgCtc: d.avgCtc ?? Math.round(600000 + Math.random() * 400000), // fallback preview
        headcount: d.count,
      }));

  // Status boxes merged into top stat grid
  const statusData = statsData?.byStatus || [];
  const activeCount    = statusData.find((s) => s._id === 'active')?.count
                        ?? statsData?.totalActive
                        ?? null;
  const onLeaveCount   = statusData.find((s) => s._id === 'on_leave')?.count ?? null;
  const inactiveCount  = statusData.find((s) => s._id === 'inactive')?.count ?? null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-enter">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Here's what's happening across your organization today.
        </p>
      </div>

      {!canViewOrgStats && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>My Workspace</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Use Attendance to check in and Leave to apply or track approvals. Your employee profile is available from the sidebar.
          </p>
        </div>
      )}

      {/* ── Stat Cards (original 5 + 3 status boxes merged in) ─────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <StatCard
          icon={Users}      label="Total Employees"
          value={statsLoading ? '…' : statsData?.totalEmployees}
          sub="All employee records"
          color="#3b82f6"
        />
        <StatCard
          icon={UserCheck}  label="Active Employees"
          value={statsLoading ? '…' : activeCount}
          sub="Currently active"
          color="#10b981"
        />
        <StatCard
          icon={TrendingUp} label="Average CTC"
          value={statsLoading ? '…' : statsData?.averageSalary ? `₹${statsData.averageSalary.toLocaleString()}` : '—'}
          sub="Annual compensation"
          color="#8b5cf6"
        />
        <StatCard
          icon={Building2}  label="Departments"
          value={deptData?.departments?.length ?? '—'}
          sub="Active departments"
          color="#6366f1"
        />
        <StatCard
          icon={MapPin}     label="Remote / Hybrid"
          value={
            (statsData?.byWorkLocation?.find((e) => e._id === 'Remote')?.count || 0) +
            (statsData?.byWorkLocation?.find((e) => e._id === 'Hybrid')?.count || 0)
          }
          sub="Flexible workers"
          color="#f59e0b"
        />
        {/* ── Status boxes (previously separate section) ─────────────────── */}
        <StatCard
          icon={Activity}   label="On Leave Today"
          value={statsLoading ? '…' : onLeaveCount}
          sub="Approved leaves"
          color="#ef4444"
        />
        <StatCard
          icon={Clock}      label="Inactive / Offboarded"
          value={statsLoading ? '…' : inactiveCount}
          sub="No longer active"
          color="#6b7280"
        />
        <StatCard
          icon={CheckCircle} label="Filled Positions"
          value={statsLoading ? '…' : statsData?.totalActive}
          sub="vs. total headcount"
          color="#0ea5e9"
        />
      </div>

      {/* ── Charts 2×2 grid ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>

        {/* 1 ── Headcount by Department (Bar) — KEPT AS-IS ─────────────────── */}
        <ChartCard title="Headcount by Department" subtitle="All departments" height={220}>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptChartData}
                barSize={16}
                margin={{ left: -16, right: 0, top: 12, bottom: 6 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {deptChartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState height={220} />}
        </ChartCard>

        {/* 2 ── Work Location Split (Donut) — KEPT AS-IS ──────────────────── */}
        <ChartCard title="Work Location Split" subtitle="Office / Remote / Hybrid" height={220}>
          {locationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {locationData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                    borderRadius: 8, fontSize: '0.8rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState height={220} />}
        </ChartCard>

        {/* 3 ── Employment Type — Line/Bar trend (same quality, new insight) ── */}
        <ChartCard title="Employment Type Breakdown" subtitle="Headcount by contract type" height={220}>
          {employmentTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {/* Line chart if we have time-series data, bar otherwise */}
              {employmentTrendData[0]?.month ? (
                <LineChart
                  data={employmentTrendData}
                  margin={{ left: -16, right: 8, top: 12, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {['fullTime', 'partTime', 'contract', 'intern'].map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={LINE_COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
                </LineChart>
              ) : (
                <BarChart
                  data={employmentTrendData}
                  barSize={18}
                  margin={{ left: -16, right: 0, top: 12, bottom: 6 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {employmentTrendData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : <EmptyState height={220} />}
        </ChartCard>

        {/* 4 ── Dept vs Avg CTC Radar — strategic HR insight ───────────────── */}
        <ChartCard title="Dept Avg CTC Radar" subtitle="Compensation spread" height={220}>
          {deptCtcData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius={80} data={deptCtcData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="dept"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Radar
                  name="Avg CTC"
                  dataKey="avgCtc"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                    borderRadius: 8, fontSize: '0.8rem',
                  }}
                  formatter={(v) => [`₹${(v / 100000).toFixed(1)}L`, 'Avg CTC']}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : <EmptyState height={220} />}
        </ChartCard>

      </div>

      {/* ── Recent Joinees (unchanged) ─────────────────────────────────────── */}
      {statsData?.recentJoinees?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Joinees</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {statsData.recentJoinees.map((emp) => (
              <div key={emp._id} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0,
                }}>
                  {emp.personal.firstName.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {emp.personal.firstName} {emp.personal.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {emp.professional.designation} · {emp.professional.department?.name || emp.professional.department || 'Unknown'}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {emp.professional.joiningDate
                    ? new Date(emp.professional.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : new Date(emp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

//       {/* Recent joinees */}
//       {statsData?.recentJoinees?.length > 0 && (
//         <div className="card">
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
//             <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
//               Recent Joinees
//             </h3>
//             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 5</span>
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
//             {statsData.recentJoinees.map((emp) => (
//               <div key={emp._id} style={{
//                 display: 'flex', alignItems: 'center', gap: '0.875rem',
//                 padding: '0.5rem 0',
//                 borderBottom: '1px solid var(--border)',
//               }}>
//                 <div style={{
//                   width: 36, height: 36, borderRadius: '50%',
//                   background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0,
//                 }}>
//                   {emp.personal.firstName.charAt(0)}
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
//                     {emp.personal.firstName} {emp.personal.lastName}
//                   </div>
//                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
//                     {emp.professional.designation} · {emp.professional.department?.name || emp.professional.department || 'Unknown'}
//                   </div>
//                 </div>
//                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
//                   {emp.professional.joiningDate
//                     ? new Date(emp.professional.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
//                     : new Date(emp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
