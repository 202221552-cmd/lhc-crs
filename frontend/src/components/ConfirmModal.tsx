import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({ isOpen, message, subMessage, confirmText = 'تأكيد', cancelText = 'إلغاء', danger, onConfirm, onCancel }: Props) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', borderRadius: 20,
          padding: '28px 32px', maxWidth: 420, width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: danger ? 'var(--rose-light)' : 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <AlertTriangle size={26} color={danger ? 'var(--rose)' : 'var(--primary)'} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800 }}>{message}</h3>
          {subMessage && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subMessage}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            className="glass-btn"
            style={{ minWidth: 100, padding: '10px 20px', background: 'var(--bg-muted)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="glass-btn"
            style={{
              minWidth: 100, padding: '10px 20px',
              background: danger ? 'var(--rose)' : 'var(--primary)',
              color: '#fff', border: 'none'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
