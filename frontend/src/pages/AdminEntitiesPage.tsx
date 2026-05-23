import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, RefreshCw, MapPin, Phone, User } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface Entity {
  id: string; name: string; type: string; address?: string;
  phone?: string; email?: string; contactName?: string; notes?: string;
}

const ENTITY_TYPES: Record<string, string> = {
  UNIVERSITY: 'جامعة', COLLEGE: 'كلية', INSTITUTE: 'معهد',
  SCHOOL: 'مدرسة', CENTER: 'مركز', OTHER: 'أخرى'
};

export const AdminEntitiesPage = () => {
  const { apiFetch } = useApi();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState({ name: '', type: 'UNIVERSITY', address: '', phone: '', email: '', contactName: '', notes: '' });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try { setEntities(await apiFetch('/educational-entities')); }
    catch (e: any) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'UNIVERSITY', address: '', phone: '', email: '', contactName: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (e: Entity) => {
    setEditing(e);
    setForm({ name: e.name, type: e.type, address: e.address || '', phone: e.phone || '', email: e.email || '', contactName: e.contactName || '', notes: e.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return alert('اسم الجهة مطلوب');
    try {
      if (editing) { await apiFetch(`/educational-entities/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }); }
      else { await apiFetch('/educational-entities', { method: 'POST', body: JSON.stringify(form) }); }
      setShowModal(false); await fetch();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (e: Entity) => {
    if (!confirm(`حذف "${e.name}"؟`)) return;
    try { await apiFetch(`/educational-entities/${e.id}`, { method: 'DELETE' }); await fetch(); }
    catch (ex: any) { alert(ex.message); }
  };

  return (
    <PermissionGuard perm="admin.entities">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} color="var(--primary-color)" /> الجهات التعليمية
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn secondary" onClick={fetch} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            </button>
            <button className="glass-btn" onClick={openCreate}><Plus size={16} /> إضافة جهة</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {entities.map(en => (
            <div key={en.id} className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{en.name}</div>
                  <span className="badge primary" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    {ENTITY_TYPES[en.type] || en.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="glass-btn secondary sm" onClick={() => openEdit(en)}><Edit2 size={13}/></button>
                  <button className="glass-btn secondary sm" onClick={() => handleDelete(en)} style={{ color: 'var(--danger)' }}><Trash2 size={13}/></button>
                </div>
              </div>
              {en.address && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><MapPin size={12}/>{en.address}</div>}
              {en.phone && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Phone size={12}/>{en.phone}</div>}
              {en.contactName && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={12}/>{en.contactName}</div>}
            </div>
          ))}
          {entities.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, opacity: 0.5 }}>لا توجد جهات مضافة</div>
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-panel slide-in" style={{ width: 480, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>{editing ? 'تعديل الجهة' : 'إضافة جهة تعليمية'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)' }}>×</button>
              </div>
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                  <label className="form-label">اسم الجهة <span className="required-star">*</span></label>
                  <input className="glass-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">نوع الجهة</label>
                  <select className="glass-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(ENTITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">هاتف التواصل</label>
                  <input className="glass-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                  <label className="form-label">العنوان</label>
                  <input className="glass-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">اسم المسؤول</label>
                  <input className="glass-input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                  <label className="form-label">ملاحظات</label>
                  <textarea className="glass-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="glass-btn" style={{ flex: 1 }} onClick={handleSubmit}>{editing ? 'حفظ التعديلات' : 'إضافة الجهة'}</button>
                <button className="glass-btn secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
