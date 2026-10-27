import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import { employeeAPI, departmentAPI } from '../../services/api';

const STATUS_MAP = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  terminated: 'badge-terminated',
  on_notice: 'badge-on_notice',
  on_leave: 'badge-on_leave',
};

export default function EmployeesPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const canAdd = ['SuperAdmin', 'Admin', 'HRManager', 'HR'].includes(user?.role);
  const canViewDirectory = ['SuperAdmin', 'Admin', 'HRManager', 'HR', 'Manager'].includes(user?.role);

  const [filters, setFilters] = useState({
    search: '', department: '', status: 'active',
    employmentType: '', page: 1, limit: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeAPI.getAll(filters).then((r) => r.data),
    keepPreviousData: true,
    enabled: canViewDirectory,
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentAPI.getAll().then((r) => r.data),
  });

  useEffect(() => {
    if (!canViewDirectory) {
      employeeAPI.getMe()
        .then((res) => navigate(`/employees/${res.data.employee._id}`, { replace: true }))
        .catch(() => navigate('/dashboard', { replace: true }));
    }
  }, [canViewDirectory, navigate]);

  if (!canViewDirectory) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;
  }

  const updateFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Employees</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
            {data?.pagination?.total ?? '...'} total records
          </p>
        </div>
        {canAdd && (
          <Link to="/employees/new" className="btn btn-primary">
            <Plus size={16} /> Add Employee
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
              placeholder="Search by name, ID, designation..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Department */}
          <select
            className="form-input"
            style={{ flex: '1 1 140px', minWidth: 140, fontSize: '0.85rem' }}
            value={filters.department}
            onChange={(e) => updateFilter('department', e.target.value)}
          >
            <option value="">All Departments</option>
            {deptData?.departments?.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            className="form-input"
            style={{ flex: '1 1 120px', minWidth: 120, fontSize: '0.85rem' }}
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
            <option value="on_notice">On Notice</option>
            <option value="on_leave">On Leave</option>
          </select>

          {/* Employment Type */}
          <select
            className="form-input"
            style={{ flex: '1 1 130px', minWidth: 130, fontSize: '0.85rem' }}
            value={filters.employmentType}
            onChange={(e) => updateFilter('employmentType', e.target.value)}
          >
            <option value="">All Types</option>
            {['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Consultant'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : data?.employees?.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No employees found
                  </td>
                </tr>
              ) : (
                data?.employees?.map((emp) => (
                  <tr key={emp._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp._id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', color: '#fff', flexShrink: 0,
                        }}>
                          {emp.personal?.firstName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {emp.personal?.firstName} {emp.personal?.lastName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {emp.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.8rem' }}>
                      {emp.employeeId}
                    </td>
                    <td>{emp.professional?.department?.name || '—'}</td>
                    <td>{emp.professional?.designation}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6,
                        background: 'var(--bg-raised)', fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}>
                        {emp.professional?.employmentType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_MAP[emp.status] || ''}`}>
                        {emp.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {emp.professional?.joiningDate
                        ? new Date(emp.professional.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link to={`/employees/${emp._id}`} className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }}>
                        <UserCog size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1rem', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, data.pagination.total)} of {data.pagination.total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.3rem 0.6rem' }}
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {filters.page} / {data.pagination.pages}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.3rem 0.6rem' }}
                disabled={filters.page >= data.pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
