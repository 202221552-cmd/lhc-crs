import React, { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';

export const FinPartnershipsPage = () => {
  return (
    <div className="grid-2" style={{ gap: '30px' }}>
      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plus size={20} color="var(--primary-color)" /> إضافة جهة تعليمية جديدة
        </h3>
        
        <div className="form-group">
          <label className="form-label">اسم الجهة (الجامعة/الكلية)</label>
          <input type="text" className="glass-input" />
        </div>
        
        <div className="form-group">
          <label className="form-label">رقم التواصل</label>
          <input type="text" className="glass-input" />
        </div>

        <button className="glass-btn" style={{ width: '100%' }}>حفظ الجهة</button>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Briefcase size={20} color="var(--secondary-color)" /> الجهات والشراكات الحالية
        </h3>
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>اسم الجهة</th>
                <th>التواصل</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>الجامعة الأردنية</td>
                <td>065355000</td>
                <td><span style={{ color: 'var(--success)' }}>نشط</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
