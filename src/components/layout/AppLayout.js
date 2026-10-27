import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, Building2, LogOut,
  Menu, ChevronRight, Bell, Settings,
  Clock, CalendarDays,
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/employees',   icon: Users,           label: 'Employees'   },
  { to: '/departments', icon: Building2,       label: 'Departments' },
  { to: '/attendance',  icon: Clock,           label: 'Attendance'  },
  { to: '/leave',       icon: CalendarDays,    label: 'Leave'       },
];

const ROLE_COLORS = {
  SuperAdmin: '#a78bfa',
  Admin: '#38bdf8',
  HRManager: '#34d399',
  HR: '#34d399',
  Manager: '#60a5fa',
  Employee: '#94a3b8',
  Auditor: '#f59e0b',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, employee } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isEmployeeOnly = user?.role === 'Employee';
  const navItems = NAV_ITEMS.map((item) => (
    item.to === '/employees' && isEmployeeOnly && employee?._id
      ? { ...item, to: `/employees/${employee._id}`, label: 'My Profile' }
      : item
  ));

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 68 : 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.22s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minHeight: 64,
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: '#fff',
            flexShrink: 0,
          }}>E</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1 }}>EMS Pro</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Enterprise Suite</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.875rem',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding: '1rem 0.5rem',
          borderTop: '1px solid var(--border)',
        }}>
          {!collapsed && (
            <div style={{
              background: 'var(--bg-raised)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem',
              marginBottom: '0.5rem',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: 6,
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: '0.7rem',
                fontWeight: 600,
                background: `${ROLE_COLORS[user?.role]}22`,
                color: ROLE_COLORS[user?.role],
              }}>
                {user?.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.6rem 0.875rem',
              background: 'none',
              border: '1px solid transparent',
              borderRadius: 'var(--radius)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'var(--transition)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 64,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 1.5rem',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <button style={{
            background: 'var(--bg-raised)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '0.4rem',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}>
            <Bell size={17} />
          </button>
          <button style={{
            background: 'var(--bg-raised)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '0.4rem',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}>
            <Settings size={17} />
          </button>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem', color: '#fff',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
