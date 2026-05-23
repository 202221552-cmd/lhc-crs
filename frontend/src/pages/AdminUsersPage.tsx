import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit2, Trash2, RefreshCw, ShieldCheck, ShieldOff, Lock, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import { useApi, ALL_PERMISSIONS } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface User {
  id: string; username: string; fullName: string; role: string;
  status: string; maxDevicesAllowed: number; activeSessionsCount: number;
  permissions: string[]; createdAt: string;
}

const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

export const AdminUsersPage = () => {
  const { apiFetch } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [expandedPermGroup, setExpandedPermGroup] = useState<string | null>('التسجيل');

  const [form, setForm] = useState({
    username: '', password: '', fullName: '', role: 'EMPLOYEE',
    status: 'ACTIVE', maxDevicesAllowed: 3, permissions: [] as string[]
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try { setUsers(await apiFetch('/auth/users')); }
    catch (e: any) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', fullName: '', role: 'EMPLOYEE', status: 'ACTIVE', maxDevicesAllowed: 3, permissions: [] });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role, status: u.status, maxDevicesAllowed: u.maxDevicesAllowed, permissions: u.permissions });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.fullName || (!editingUser && !form.username)) return alert('الاسم واسم المستخدم مطلوبان');
    try {
      if (editingUser) {
        await apiFetch(`/auth/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        if (!form.password) return alert('كلمة المرور مطلوبة');
        await apiFetch('/auth/users', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false);
      await fetchUsers();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${u.fullName}"؟`)) return;
    try { await apiFetch(`/auth/users/${u.id}`, { method: 'DELETE' }); await fetchUsers(); }
    catch (e: any) { alert(e.message); }
  };

  const revokeSession = async (u: User) => {
    if (!confirm(`إلغاء جميع جلسات "${u.fullName}"؟`)) return;
    try { await apiFetch(`/auth/users/${u.id}/sessions`, { method: 'DELETE' }); await fetchUsers(); }
    catch (e: any) { alert(e.message); }
  };

  const togglePerm = (key: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  const toggleGroup = (group: string) => {
    const groupKeys = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
    const allSelected = groupKeys.every(k => form.permissions.includes(k));
    if (allSelected) {
      setForm(prev => ({ ...prev, permissions: prev.permissions.filter(k => !groupKeys.includes(k)) }));
    } else {
      setForm(prev => ({ ...prev, permissions: [...new Set([...prev.permissions, ...groupKeys])] }));
    }
  };

  return (
    <PermissionGuard perm="admin.users">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} color="var(--primary-color)" /> إدارة المستخدمين
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn secondary" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> تحديث
            </button>
            <button className="glass-btn" onClick={openCreate}>
              <Plus size={16} /> إضافة مستخدم
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>اسم الدخول</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>الصلاحيات</th>
                  <th>الجلسات</th>
                  <th>الأجهزة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('ar-JO')}
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.85rem', background: 'var(--card-bg)', padding: '2px 8px', borderRadius: 6 }}>@{u.username}</code></td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'primary' : 'secondary'}`} style={{ fontSize: '0.78rem' }}>
                        {u.role === 'ADMIN' ? '👑 مسؤول' : '👤 موظف'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'success' : 'danger'}`} style={{ fontSize: '0.78rem' }}>
                        {u.status === 'ACTIVE' ? <><UserCheck size={11}/> نشط</> : <><UserX size={11}/> معطّل</>}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 240 }}>
                        {u.permissions.includes('ADMIN_ALL')
                          ? <span className="badge primary" style={{ fontSize: '0.72rem' }}>🔓 كامل</span>
                          : u.permissions.slice(0, 3).map(p => (
                            <span key={p} className="badge" style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                              {ALL_PERMISSIONS.find(pp => pp.key === p)?.label || p}
                            </span>
                          ))
                        }
                        {!u.permissions.includes('ADMIN_ALL') && u.permissions.length > 3 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{u.permissions.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: u.activeSessionsCount > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {u.activeSessionsCount} نشطة
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.maxDevicesAllowed}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="glass-btn secondary sm" onClick={() => openEdit(u)} title="تعديل">
                          <Edit2 size={13} />
                        </button>
                        {u.activeSessionsCount > 0 && (
                          <button className="glass-btn secondary sm" onClick={() => revokeSession(u)} title="قطع الجلسة" style={{ color: 'var(--warning)' }}>
                            <Lock size={13} />
                          </button>
                        )}
                        <button className="glass-btn secondary sm" onClick={() => handleDelete(u)} title="حذف" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, opacity: 0.5 }}>لا يوجد مستخدمون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="glass-panel slide-in" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {editingUser ? `تعديل: ${editingUser.fullName}` : 'إضافة مستخدم جديد'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22 }}>×</button>
              </div>

              <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الاسم الكامل <span className="required-star">*</span></label>
                  <input className="glass-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">اسم المستخدم {!editingUser && <span className="required-star">*</span>}</label>
                  <input className="glass-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    disabled={!!editingUser} placeholder={editingUser ? '(لا يمكن التعديل)' : 'lowercase فقط'} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">كلمة المرور {!editingUser && <span className="required-star">*</span>}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="glass-input" type={showPass ? 'text' : 'password'}
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={editingUser ? 'اتركها فارغة للإبقاء' : 'كلمة المرور'} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', left: 12, top: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الدور</label>
                  <select className="glass-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="EMPLOYEE">موظف</option>
                    <option value="ADMIN">مسؤول</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الحالة</label>
                  <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">نشط</option>
                    <option value="INACTIVE">معطّل</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">عدد الأجهزة المسموحة</label>
                  <input type="number" min="1" max="10" className="glass-input" value={form.maxDevicesAllowed}
                    onChange={e => setForm({ ...form, maxDevicesAllowed: parseInt(e.target.value) })} />
                </div>
              </div>

              {/* Permissions (only if not ADMIN role) */}
              {form.role !== 'ADMIN' && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>الصلاحيات</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PERMISSION_GROUPS.map(group => {
                      const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                      const allSelected = groupPerms.every(p => form.permissions.includes(p.key));
                      return (
                        <div key={group} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
                          <div onClick={() => setExpandedPermGroup(expandedPermGroup === group ? null : group)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', background: expandedPermGroup === group ? 'var(--primary-light)' : 'var(--card-bg)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{group}</span>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <button onClick={e => { e.stopPropagation(); toggleGroup(group); }}
                                className={`glass-btn sm ${allSelected ? '' : 'secondary'}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                                {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                              </button>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{expandedPermGroup === group ? '▲' : '▼'}</span>
                            </div>
                          </div>
                          {expandedPermGroup === group && (
                            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {groupPerms.map(perm => (
                                <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }}>
                                  <input type="checkbox" checked={form.permissions.includes(perm.key)} onChange={() => togglePerm(perm.key)} />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.role === 'ADMIN' && (
                <div style={{ padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                  <ShieldCheck size={16} style={{ display: 'inline', marginLeft: 6 }} />
                  المسؤول يحصل تلقائياً على صلاحية <strong>ADMIN_ALL</strong> (وصول كامل)
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="glass-btn" style={{ flex: 1 }} onClick={handleSubmit}>
                  {editingUser ? <><Edit2 size={16}/> حفظ التعديلات</> : <><Plus size={16}/> إنشاء المستخدم</>}
                </button>
                <button className="glass-btn secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PermissionGuard>
  );
};
