import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Plus, Edit2, Trash2, RefreshCw, Check } from 'lucide-react';
import { useApi, ALL_PERMISSIONS } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { PermissionGuard } from '../components/PermissionGuard';
import { ConfirmModal } from '../components/ConfirmModal';

interface Template {
  id: number; name: string; permissions: string[];
}

const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

export const PermissionTemplatesPage = () => {
  const { apiFetch } = useApi();
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(PERMISSION_GROUPS[0] || null);
  const [templateName, setTemplateName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [confirmDel, setConfirmDel] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/auth/permission-templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch {}
    finally { setIsLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setSelectedPerms([]);
    setExpandedGroup(PERMISSION_GROUPS[0] || null);
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setSelectedPerms(t.permissions);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) return toast.error('تنبيه', 'اسم القالب مطلوب');
    try {
      if (editingTemplate) {
        await apiFetch(`/auth/permission-templates/${editingTemplate.id}`, {
          method: 'PUT', body: JSON.stringify({ name: templateName, permissions: selectedPerms })
        });
        toast.success('تم تحديث القالب');
      } else {
        await apiFetch('/auth/permission-templates', {
          method: 'POST', body: JSON.stringify({ name: templateName, permissions: selectedPerms })
        });
        toast.success('تم إنشاء القالب');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (e: any) { toast.error('خطأ', e.message); }
  };

  const handleDelete = async (t: Template) => {
    try { await apiFetch(`/auth/permission-templates/${t.id}`, { method: 'DELETE' }); toast.success('تم الحذف'); fetchTemplates(); }
    catch (e: any) { toast.error('خطأ', e.message); }
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleGroup = (group: string) => {
    const groupKeys = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
    const allSelected = groupKeys.every(k => selectedPerms.includes(k));
    if (allSelected) setSelectedPerms(prev => prev.filter(k => !groupKeys.includes(k)));
    else setSelectedPerms(prev => [...new Set([...prev, ...groupKeys])]);
  };

  return (
    <PermissionGuard perm="admin.users.view">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Copy size={22} color="var(--secondary)" /> قوالب الصلاحيات
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn secondary" onClick={fetchTemplates} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> تحديث
            </button>
            <button className="glass-btn" onClick={openCreate}>
              <Plus size={16} /> قالب جديد
            </button>
          </div>
        </div>

        {templates.length === 0 && !isLoading && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: 48, opacity: 0.5 }}>
            لا توجد قوالب. أنشئ قالباً لتطبيق صلاحيات محددة على عدة مستخدمين بسرعة.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {templates.map(t => (
            <div key={t.id} className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{t.name}</h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="glass-btn secondary sm" onClick={() => openEdit(t)} title="تعديل">
                    <Edit2 size={13} />
                  </button>
                  <button className="glass-btn secondary sm" onClick={() => setConfirmDel(t)} title="حذف" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {t.permissions.slice(0, 5).map(p => (
                  <span key={p} className="badge" style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                    {ALL_PERMISSIONS.find(pp => pp.key === p)?.label || p}
                  </span>
                ))}
                {t.permissions.length > 5 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{t.permissions.length - 5}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="glass-panel slide-in" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {editingTemplate ? `تعديل: ${editingTemplate.name}` : 'قالب صلاحيات جديد'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22 }}>×</button>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">اسم القالب <span className="required-star">*</span></label>
                <input className="glass-input" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="مثال: صلاحيات موظف تسجيل" />
              </div>

              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>الصلاحيات</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {PERMISSION_GROUPS.map(group => {
                  const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                  const allSelected = groupPerms.every(p => selectedPerms.includes(p.key));
                  return (
                    <div key={group} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', background: expandedGroup === group ? 'var(--primary-light)' : 'var(--card-bg)' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{group}</span>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {groupPerms.filter(p => selectedPerms.includes(p.key)).length}/{groupPerms.length}
                          </span>
                          <button onClick={e => { e.stopPropagation(); toggleGroup(group); }}
                            className={`glass-btn sm ${allSelected ? '' : 'secondary'}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                            {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                          </button>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{expandedGroup === group ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {expandedGroup === group && (
                        <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {groupPerms.map(perm => (
                            <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }}>
                              <input type="checkbox" checked={selectedPerms.includes(perm.key)} onChange={() => togglePerm(perm.key)} />
                              {perm.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedPerms.length === 0 && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-light, #fff0f0)', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: 'var(--danger)' }}>
                  لم يتم اختيار أي صلاحيات. القالب سيكون فارغاً.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="glass-btn" style={{ flex: 1 }} onClick={handleSave}>
                  {editingTemplate ? <><Edit2 size={16}/> حفظ القالب</> : <><Plus size={16}/> إنشاء القالب</>}
                </button>
                <button className="glass-btn secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={!!confirmDel}
          message={`حذف القالب "${confirmDel?.name}"؟`}
          subMessage="لا يمكن التراجع عن هذا الإجراء"
          confirmText="حذف"
          cancelText="إلغاء"
          danger
          onConfirm={() => { if (confirmDel) handleDelete(confirmDel); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      </div>
    </PermissionGuard>
  );
};
