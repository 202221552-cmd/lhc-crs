import React, { useState } from 'react';
import { Settings, Save, Moon, Sun, Bell, Shield, Database, Globe } from 'lucide-react';
import { PermissionGuard } from '../components/PermissionGuard';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    centerName: 'المركز التعليمي الحديث',
    centerPhone: '0791234567',
    centerEmail: 'info@center.edu.jo',
    currency: 'JOD',
    language: 'ar',
    timezone: 'Asia/Amman',
    defaultCommissionRate: 5,
    maxInstallments: 12,
    overdueGraceDays: 3,
    notifyOnOverdue: true,
    notifyOnRegistration: true,
    backupEnabled: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <PermissionGuard perm="admin.settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={22} color="var(--primary-color)" /> إعدادات النظام
        </h2>

        {/* Center Info */}
        <div className="glass-panel">
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} /> معلومات المركز
          </h4>
          <div className="grid-3" style={{ gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">اسم المركز</label>
              <input className="glass-input" value={settings.centerName} onChange={e => setSettings({ ...settings, centerName: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">هاتف التواصل</label>
              <input className="glass-input" value={settings.centerPhone} onChange={e => setSettings({ ...settings, centerPhone: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">البريد الإلكتروني</label>
              <input type="email" className="glass-input" value={settings.centerEmail} onChange={e => setSettings({ ...settings, centerEmail: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">العملة</label>
              <select className="glass-input" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}>
                <option value="JOD">دينار أردني (JOD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">المنطقة الزمنية</label>
              <select className="glass-input" value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })}>
                <option value="Asia/Amman">عمّان (GMT+3)</option>
                <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                <option value="Asia/Dubai">دبي (GMT+4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="glass-panel">
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} /> الإعدادات المالية
          </h4>
          <div className="grid-3" style={{ gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">نسبة العمولة الافتراضية (%)</label>
              <input type="number" min="0" max="50" className="glass-input" value={settings.defaultCommissionRate} onChange={e => setSettings({ ...settings, defaultCommissionRate: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">الحد الأقصى للأقساط</label>
              <input type="number" min="1" max="36" className="glass-input" value={settings.maxInstallments} onChange={e => setSettings({ ...settings, maxInstallments: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">أيام السماح للتأخر</label>
              <input type="number" min="0" max="30" className="glass-input" value={settings.overdueGraceDays} onChange={e => setSettings({ ...settings, overdueGraceDays: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-panel">
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} /> الإشعارات
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'notifyOnOverdue', label: 'إشعار عند تأخر الأقساط' },
              { key: 'notifyOnRegistration', label: 'إشعار عند تسجيل طالب جديد' },
              { key: 'backupEnabled', label: 'النسخ الاحتياطي التلقائي' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', background: 'var(--card-bg)', borderRadius: 10 }}>
                <input type="checkbox" checked={(settings as any)[item.key]} onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })} />
                <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                <span className={`badge ${(settings as any)[item.key] ? 'success' : 'danger'}`} style={{ fontSize: '0.72rem', marginRight: 'auto' }}>
                  {(settings as any)[item.key] ? 'مفعّل' : 'معطّل'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button className="glass-btn" style={{ alignSelf: 'flex-start', minWidth: 180 }} onClick={handleSave}>
          <Save size={16} /> {saved ? '✓ تم الحفظ!' : 'حفظ الإعدادات'}
        </button>
      </div>
    </PermissionGuard>
  );
};
