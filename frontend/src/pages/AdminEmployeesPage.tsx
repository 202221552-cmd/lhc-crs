import React from 'react';
import { Users, Plus } from 'lucide-react';

export const AdminEmployeesPage = () => {
  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Users size={24} color="var(--primary-color)" /> إدارة موظفي المركز
      </h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button className="glass-btn"><Plus size={18} /> إضافة موظف جديد</button>
      </div>

      <div className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>اسم الموظف</th>
              <th>المسمى الوظيفي</th>
              <th>الفرع</th>
              <th>رقم الهاتف</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>أحمد محمد</td>
              <td>مدير تسجيل</td>
              <td>الرئيسي</td>
              <td>0791234567</td>
              <td><span style={{ color: 'var(--success)' }}>على رأس عمله</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
