import React, { useState } from 'react';
import { DollarSign, UserCheck } from 'lucide-react';

export const FinEmployeesPage = () => {
  return (
    <div className="grid-2" style={{ gap: '30px' }}>
      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={20} color="var(--primary-color)" /> صرف رواتب ومستحقات
        </h3>
        
        <div className="form-group">
          <label className="form-label">الموظف</label>
          <select className="glass-input">
            <option>أحمد محمد (مدير التسجيل)</option>
            <option>سارة الخالد (محاسبة)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">نوع الدفعة</label>
          <select className="glass-input">
            <option>راتب أساسي</option>
            <option>سلفة</option>
            <option>مكافأة</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">المبلغ (دينار)</label>
          <input type="number" className="glass-input" />
        </div>

        <button className="glass-btn" style={{ width: '100%', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.5)' }}>اعتماد الصرف</button>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DollarSign size={20} color="var(--secondary-color)" /> كشف رواتب الموظفين (الشهر الحالي)
        </h3>
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الراتب الأساسي</th>
                <th>المسحوبات</th>
                <th>الصافي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>أحمد محمد</td>
                <td>600</td>
                <td>50</td>
                <td><strong style={{ color: 'var(--success)' }}>550</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
