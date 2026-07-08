import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Users, Award, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';
import { useApi, useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const EmployeeSalariesPage = () => {
  const { apiFetch } = useApi();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<Record<string, any>>({});
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    try {
      const [empRes, salRes] = await Promise.all([
        apiFetch('/employees'),
        apiFetch(`/salaries?month=${month}&year=${year}`),
      ]);
      const emps = Array.isArray(empRes) ? empRes : [];
      const sals = Array.isArray(salRes) ? salRes : [];
      setEmployees(emps);
      const salMap: Record<string, any> = {};
      sals.forEach((s: any) => { salMap[s.employeeId] = s; });
      setEmployees(emps.filter(e => e.type === 'FULL_TIME'));
      setSalaries(salMap);
    } catch {}
  };

  const saveSalary = async (emp: any, sal: any) => {
    setIsLoading(true);
    try {
      await apiFetch('/salaries', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: emp.id, month, year,
          baseSalary: emp.baseSalary,
          bonuses: sal.bonuses || 0,
          deductions: sal.deductions || 0,
          totalSalary: emp.baseSalary + (sal.bonuses || 0) - (sal.deductions || 0),
          status: 'PAID', paidDate: new Date().toISOString(),
        }),
      });
      toast.success('تم صرف الراتب ✓', emp.fullName);
      await loadData();
    } catch (e: any) { toast.error('فشل', e.message); }
    finally { setIsLoading(false); }
  };

  const updateLocal = (empId: string, key: string, val: number) => {
    setSalaries(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [key]: val },
    }));
  };

  const months = [
    { v: 1, l: 'يناير' }, { v: 2, l: 'فبراير' }, { v: 3, l: 'مارس' },
    { v: 4, l: 'أبريل' }, { v: 5, l: 'مايو' }, { v: 6, l: 'يونيو' },
    { v: 7, l: 'يوليو' }, { v: 8, l: 'أغسطس' }, { v: 9, l: 'سبتمبر' },
    { v: 10, l: 'أكتوبر' }, { v: 11, l: 'نوفمبر' }, { v: 12, l: 'ديسمبر' },
  ];

  const totalMonthly = employees.reduce((s, e) => s + e.baseSalary, 0);
  const paidCount = Object.values(salaries).filter((s: any) => s.status === 'PAID').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <DollarSign size={22} color="var(--success)" />
          <h3 style={{ margin: 0 }}>الرواتب والعمولات</h3>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">الشهر</label>
            <select className="glass-input" style={{ width: 140 }} value={month} onChange={e => setMonth(+e.target.value)}>
              {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">السنة</label>
            <input type="number" className="glass-input" style={{ width: 100 }} value={year} onChange={e => setYear(+e.target.value)} />
          </div>
          <button className="glass-btn secondary" onClick={loadData}><RefreshCw size={15} /> تحديث</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'إجمالي الرواتب', value: `${totalMonthly.toFixed(0)} د`, color: 'var(--primary)' },
          { label: 'تم صرفها', value: `${paidCount}/${employees.length}`, color: 'var(--success)' },
          { label: 'المتبقي', value: `${Math.max(0, totalMonthly - Object.values(salaries).filter((s: any) => s?.status === 'PAID').reduce((acc: number, s: any) => acc + (s.totalSalary || 0), 0)).toFixed(0)} د`, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '18px 20px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: 14 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Salaries Table */}
      <div className="glass-panel">
        <h4 style={{ marginBottom: 16 }}>
          كشف رواتب — {months.find(m => m.v === month)?.l} {year}
        </h4>
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الراتب الأساسي</th>
                <th>مكافآت</th>
                <th>خصومات</th>
                <th>الصافي</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const sal = salaries[emp.id] || {};
                const bonuses = sal.bonuses || 0;
                const deductions = sal.deductions || 0;
                const net = emp.baseSalary + bonuses - deductions;
                const isPaid = sal.status === 'PAID';
                return (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.fullName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{emp.baseSalary.toFixed(0)} د</td>
                    <td>
                      <input type="number" className="glass-input" style={{ width: 90, padding: '6px 10px', fontSize: '0.85rem' }}
                        value={bonuses} min={0} disabled={isPaid}
                        onChange={e => updateLocal(emp.id, 'bonuses', +e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="glass-input" style={{ width: 90, padding: '6px 10px', fontSize: '0.85rem' }}
                        value={deductions} min={0} disabled={isPaid}
                        onChange={e => updateLocal(emp.id, 'deductions', +e.target.value)} />
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '1.05rem', color: net >= emp.baseSalary ? 'var(--success)' : 'var(--danger)' }}>
                      {net.toFixed(0)} د
                    </td>
                    <td>
                      {isPaid ? (
                        <span className="badge success" style={{ fontSize: '0.78rem' }}>
                          <CheckCircle size={11} style={{ marginLeft: 3 }} /> صُرف
                        </span>
                      ) : (
                        <span className="badge warning" style={{ fontSize: '0.78rem' }}>منتظر</span>
                      )}
                    </td>
                    <td>
                      {!isPaid && hasPermission('employees.salaries') && (
                        <button className="glass-btn sm" onClick={() => saveSalary(emp, sal)} disabled={isLoading}>
                          <DollarSign size={13} /> صرف
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, opacity: 0.5 }}>لا يوجد موظفون بدوام كامل</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
