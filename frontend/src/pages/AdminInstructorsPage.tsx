import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, RefreshCw, Mail, Phone, Star } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface Instructor {
  id: string; name: string; specialization?: string; phone?: string;
  email?: string; hourlyRate?: number; notes?: string; status?: string;
}

export const AdminInstructorsPage = () => {
  const { apiFetch } = useApi();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [form, setForm] = useState({ name: '', specialization: '', phone: '', email: '', hourlyRate: 0, notes: '', status: 'ACTIVE' });

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setInstructors(await apiFetch('/instructors')); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', specialization: '', phone: '', email: '', hourlyRate: 0, notes: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const openEdit = (inst: Instructor) => {
    setEditing(inst);
    setForm({ name: inst.name, specialization: inst.specialization || '', phone: inst.phone || '', email: inst.email || '', hourlyRate: inst.hourlyRate || 0, notes: inst.notes || '', status: inst.status || 'ACTIVE' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return alert('اسم المحاضر مطلوب');
    try {
      if (editing) { await apiFetch(`/instructors/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }); }
      else { await apiFetch('/instructors', { method: 'POST', body: JSON.stringify(form) }); }
      setShowModal(false); await load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (inst: Instructor) => {
    if (!confirm('حذف هذا المحاضر؟')) return;
    try { await apiFetch(`/instructors/${inst.id}`, { method: 'DELETE' }); await load(); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <PermissionGuard perm="admin.instructors">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <GraduationCap size={22} color="var(--primary-color)" /> المحاضرون والمدرّسون
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn secondary" onClick={load} disabled={isLoading}><RefreshCw size={16} className={isLoading ? 'spin' : ''} /></button>
            <button className="glass-btn" onClick={openCreate}><Plus size={16} /> إضافة محاضر</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {instructors.map(inst => (
            <div key={inst.id} className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{inst.name}</div>
                  {inst.specialization && <div style={{ fontSize: '0.82rem', color: 'var(--primary-color)', marginTop: 4 }}>📚 {inst.specialization}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="glass-btn secondary sm" onClick={() => openEdit(inst)}><Edit2 size={13}/></button>
                  <button className="glass-btn secondary sm" onClick={() => handleDelete(inst)} style={{ color: 'var(--danger)' }}><Trash2 size={13}/></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {inst.phone && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12}/> {inst.phone}</div>}
                {inst.email && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12}/> {inst.email}</div>}
                {(inst.hourlyRate || 0) > 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={12}/> {inst.hourlyRate?.toFixed(3)} د/ساعة
                  </div>
                )}
                <span className={`badge ${inst.status === 'ACTIVE' ? 'success' : 'danger'}`} style={{ fontSize: '0.72rem', alignSelf: 'flex-start', marginTop: 4 }}>
                  {inst.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          ))}
          {instructors.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, opacity: 0.5 }}>لا يوجد محاضرون</div>
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-panel slide-in" style={{ width: 460, direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>{editing ? 'تعديل المحاضر' : 'إضافة محاضر جديد'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)' }}>×</button>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                  <label className="form-label">الاسم الكامل <span className="required-star">*</span></label>
                  <input className="glass-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">التخصص</label>
                  <input className="glass-input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">رقم الهاتف</label>
                  <input className="glass-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الأجر بالساعة (دينار)</label>
                  <input type="number" step="0.001" className="glass-input" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الحالة</label>
                  <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">نشط</option>
                    <option value="INACTIVE">غير نشط</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                  <label className="form-label">ملاحظات</label>
                  <textarea className="glass-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="glass-btn" style={{ flex: 1 }} onClick={handleSubmit}>{editing ? 'حفظ التعديلات' : 'إضافة المحاضر'}</button>
                <button className="glass-btn secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
