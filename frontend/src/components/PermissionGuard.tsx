import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldOff } from 'lucide-react';

interface Props {
  perm: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard = ({ perm, children, fallback }: Props) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(perm)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '300px', gap: '16px'
      }}>
        <div className="glass-panel" style={{
          textAlign: 'center', padding: '48px 40px', maxWidth: 420
        }}>
          <ShieldOff size={52} style={{ color: 'var(--danger)', marginBottom: 16 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
            ليس لديك صلاحية
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            هذه الصفحة محظورة. تواصل مع مسؤول النظام للحصول على الصلاحيات اللازمة.
          </p>
          <code style={{
            display: 'inline-block', marginTop: 12,
            padding: '4px 12px', background: 'var(--card-bg)',
            borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-muted)'
          }}>{perm}</code>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
