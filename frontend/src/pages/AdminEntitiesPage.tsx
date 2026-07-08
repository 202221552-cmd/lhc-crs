import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Plus, Edit2, Trash2, RefreshCw, MapPin, Phone, User, DollarSign, Percent, CheckSquare, Square } from 'lucide-react';
import { useApi, useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { PermissionGuard } from '../components/PermissionGuard';

interface Entity {
  id: string; name: string; type: string; address?: string;
  phone?: string; email?: string; contactName?: string; notes?: string;
  commissionType?: string; uniPercentage?: number; fixedAmount?: number;
  roomAmount?: number; status?: string;
}

const ENTITY_TYPES: Record<string, string> = {
  UNIVERSITY: 'جامعة', COLLEGE: 'كلية', INSTITUTE: 'معهد',
  SCHOOL: 'مدرسة', CENTER: 'مركز', OTHER: 'أخرى'
};

const commissionOptions = [
  { key: 'PERCENTAGE', label: 'نسبة مئوية', icon: '%', desc: 'نسبة من إجمالي المبلغ' },
  { key: 'FIXED_PER_STUDENT', label: 'مبلغ مقطوع لكل طالب', icon: '👤', desc: 'مبلغ ثابت يُحتسب لكل طالب مسجل' },
  { key: 'PER_ROOM', label: 'مبلغ مقطوع لكل قاعة', icon: '🏛️', desc: 'مبلغ ثابت لكل قاعة / فصل / شهر / سنة' },
] as const;

export const AdminEntitiesPage = () => {
  const { apiFetch } = useApi();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'UNIVERSITY', commissionType: 'PERCENTAGE',
    uniPercentage: 0, fixedAmount: 0, roomAmount: 0,
    address: '', phone: '', email: '', contactName: '', notes: '', status: 'ACTIVE'
  });

  // Commission checkboxes
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set(['PERCENTAGE']));

  const toggleCommission = (key: string) => {
    setSelectedCommissions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return next;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const commissionTypeFromSelection = useCallback(() => {
    const parts = Array.from(selectedCommissions);
    if (parts.length === 0) return 'PERCENTAGE';
    if (parts.length === 1) return parts[0];
    if (parts.includes('PERCENTAGE') && parts.includes('FIXED_PER_STUDENT')) return 'PERCENTAGE_AND_FIXED';
    if (parts.includes('PERCENTAGE') && parts.includes('PER_ROOM')) return 'PERCENTAGE_AND_ROOM';
    if (parts.includes('FIXED_PER_STUDENT') && parts.includes('PER_ROOM')) return 'FIXED_AND_ROOM';
    return parts[0];
  }, [selectedCommissions]);

  useEffect(() => {
    setForm(prev => ({ ...prev, commissionType: commissionTypeFromSelection() }));
  }, [selectedCommissions, commissionTypeFromSelection]);

  const syncSelectionFromType = (ct: string) => {
    const s = new Set<string>();
    if (ct === 'PERCENTAGE' || ct === 'PERCENTAGE_AND_FIXED' || ct === 'PERCENTAGE_AND_ROOM') s.add('PERCENTAGE');
    if (ct === 'FIXED_PER_STUDENT' || ct === 'PERCENTAGE_AND_FIXED' || ct === 'FIXED_AND_ROOM') s.add('FIXED_PER_STUDENT');
    if (ct === 'PER_ROOM' || ct === 'PERCENTAGE_AND_ROOM' || ct === 'FIXED_AND_ROOM') s.add('PER_ROOM');
    if (s.size === 0) s.add('PERCENTAGE');
    setSelectedCommissions(s);
  };

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try { setEntities(await apiFetch('/educational-entities')); }
    catch (e: any) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'UNIVERSITY', commissionType: 'PERCENTAGE', uniPercentage: 0, fixedAmount: 0, roomAmount: 0, address: '', phone: '', email: '', contactName: '', notes: '', status: 'ACTIVE' });
    setSelectedCommissions(new Set(['PERCENTAGE']));
    setShowModal(true);
  };

  const openEdit = (e: Entity) => {
    setEditing(e);
    setForm({
      name: e.name, type: e.type, commissionType: e.commissionType || 'PERCENTAGE',
      uniPercentage: e.uniPercentage || 0, fixedAmount: e.fixedAmount || 0, roomAmount: e.roomAmount || 0,
      address: e.address || '', phone: e.phone || '', email: e.email || '',
      contactName: e.contactName || '', notes: e.notes || '', status: e.status || 'ACTIVE'
    });
    syncSelectionFromType(e.commissionType || 'PERCENTAGE');
    setShowModal(true);
  };

  const showPercentageField = selectedCommissions.has('PERCENTAGE');
  const showFixedField = selectedCommissions.has('FIXED_PER_STUDENT');
  const showRoomField = selectedCommissions.has('PER_ROOM');

  const commissionLabel = () => {
    const parts: string[] = [];
    if (showPercentageField) parts.push(`نسبة ${form.uniPercentage}%`);
    if (showFixedField) parts.push(`${form.fixedAmount} د/طالب`);
    if (showRoomField) parts.push(`${form.roomAmount} د/قاعة`);
    return parts.join(' + ') || '—';
  };

  const handleSubmit = async () => {
    if (!form.name) return toast.error('تنبيه', 'اسم الجهة مطلوب');
    if (selectedCommissions.size === 0) return toast.error('تنبيه', 'اختر نظام عمولة واحد على الأقل');
    if (showPercentageField && !form.uniPercentage) return toast.error('تنبيه', 'أدخل النسبة المئوية');
    if (showFixedField && !form.fixedAmount) return toast.error('تنبيه', 'أدخل المبلغ الثابت لكل طالب');
    if (showRoomField && !form.roomAmount) return toast.error('تنبيه', 'أدخل المبلغ لكل قاعة');
    try {
      if (editing) { await apiFetch(`/educational-entities/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }); toast.success('تم التعديل'); }
      else { await apiFetch('/educational-entities', { method: 'POST', body: JSON.stringify(form) }); toast.success('تمت الإضافة'); }
      setShowModal(false); await fetch();
    } catch (e: any) { toast.error('خطأ', e.message); }
  };

  const handleDelete = async (e: Entity) => {
    if (!confirm(`حذف "${e.name}"؟`)) return;
    try { await apiFetch(`/educational-entities/${e.id}`, { method: 'DELETE' }); toast.success('تم الحذف'); await fetch(); }
    catch (ex: any) { toast.error('خطأ', ex.message); }
  };

  return (
    <PermissionGuard perm="admin.entities.view">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} color="var(--primary-color)" /> الجهات التعليمية
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn secondary" onClick={fetch} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            </button>
            {hasPermission('admin.entities.add') && <button className="glass-btn" onClick={openCreate}><Plus size={16} /> إضافة جهة</button>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {entities.map(en => {
            const ct = commissionOptions.find(o => en.commissionType?.startsWith(o.key))?.label || en.commissionType;
            return (
              <div key={en.id} className="glass-panel" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{en.name}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <span className="badge primary" style={{ fontSize: '0.72rem' }}>
                        {ENTITY_TYPES[en.type] || en.type}
                      </span>
                      <span className={`badge ${en.status === 'ACTIVE' ? 'success' : 'secondary'}`} style={{ fontSize: '0.72rem' }}>
                        {en.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {hasPermission('admin.entities.edit') && <button className="glass-btn secondary sm" onClick={() => openEdit(en)}><Edit2 size={13}/></button>}
                    {hasPermission('admin.entities.delete') && <button className="glass-btn secondary sm" onClick={() => handleDelete(en)} style={{ color: 'var(--danger)' }}><Trash2 size={13}/></button>}
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 4 }}>
                    {(en.uniPercentage || 0) > 0 && <span className="badge primary" style={{ fontSize: '0.7rem' }}>% {en.uniPercentage}%</span>}
                    {(en.fixedAmount || 0) > 0 && <span className="badge secondary" style={{ fontSize: '0.7rem' }}>👤 {en.fixedAmount?.toFixed(3)} د</span>}
                    {(en.roomAmount || 0) > 0 && <span className="badge secondary" style={{ fontSize: '0.7rem' }}>🏛️ {en.roomAmount?.toFixed(3)} د</span>}
                  </div>
                </div>
                {en.address && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><MapPin size={12}/>{en.address}</div>}
                {en.phone && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12}/>{en.phone}</div>}
                {en.contactName && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={12}/>{en.contactName}</div>}
              </div>
            );
          })}
          {entities.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, opacity: 0.5 }}>لا توجد جهات مضافة</div>
          )}
        </div>

        {showModal && createPortal(
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-panel slide-in" style={{ width: 540, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>{editing ? 'تعديل الجهة' : 'إضافة جهة تعليمية'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)' }}>×</button>
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">اسم الجهة <span className="required-star">*</span></label>
                <input className="glass-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">نوع الجهة</label>
                  <select className="glass-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(ENTITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">الحالة</label>
                  <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">نشط</option>
                    <option value="INACTIVE">غير نشط</option>
                  </select>
                </div>
              </div>

              {/* ── Commission System (Professional Checkboxes) ── */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: 10 }}>
                  <DollarSign size={14} /> نظام العمولة <span className="required-star">*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {commissionOptions.map(opt => {
                    const checked = selectedCommissions.has(opt.key);
                    return (
                      <div
                        key={opt.key}
                        onClick={() => toggleCommission(opt.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--card-border)'}`,
                          background: checked ? 'var(--primary-light)' : 'var(--card-bg)',
                          cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                        }}
                        onMouseEnter={e => { if (!checked) { e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; e.currentTarget.style.background = 'var(--glass-bg-hover)'; }}}
                        onMouseLeave={e => { if (!checked) { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.background = 'var(--card-bg)'; }}}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: checked ? 'var(--primary)' : 'transparent',
                          border: `2px solid ${checked ? 'var(--primary)' : 'var(--text-muted)'}`,
                          transition: 'all 0.15s',
                        }}>
                          {checked && <CheckSquare size={14} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {opt.icon} {opt.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{opt.desc}</div>
                        </div>
                        {checked && opt.key === 'PERCENTAGE' && (
                          <div style={{ width: 80 }} onClick={e => e.stopPropagation()}>
                            <input type="number" step="0.01" placeholder="%" value={form.uniPercentage || ''}
                              onChange={e => setForm({ ...form, uniPercentage: parseFloat(e.target.value) || 0 })}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--card-border)', borderRadius: 6, fontSize: '0.8rem', textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                          </div>
                        )}
                        {checked && opt.key === 'FIXED_PER_STUDENT' && (
                          <div style={{ width: 100 }} onClick={e => e.stopPropagation()}>
                            <input type="number" step="0.001" value={form.fixedAmount || ''}
                              onChange={e => setForm({ ...form, fixedAmount: parseFloat(e.target.value) || 0 })}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--card-border)', borderRadius: 6, fontSize: '0.8rem', textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                              placeholder="دينار" />
                          </div>
                        )}
                        {checked && opt.key === 'PER_ROOM' && (
                          <div style={{ width: 100 }} onClick={e => e.stopPropagation()}>
                            <input type="number" step="0.001" value={form.roomAmount || ''}
                              onChange={e => setForm({ ...form, roomAmount: parseFloat(e.target.value) || 0 })}
                              style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--card-border)', borderRadius: 6, fontSize: '0.8rem', textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                              placeholder="دينار" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedCommissions.size > 0 && (
                  <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--primary-color)', fontWeight: 600, textAlign: 'center' }}>
                    {commissionLabel()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">هاتف التواصل</label>
                  <input className="glass-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">اسم المسؤول</label>
                  <input className="glass-input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">العنوان</label>
                <input className="glass-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="glass-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="glass-btn" style={{ flex: 1 }} onClick={handleSubmit}>{editing ? 'حفظ التعديلات' : 'إضافة الجهة'}</button>
                <button className="glass-btn secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </PermissionGuard>
  );
};