import React from 'react';
import { Briefcase, Percent } from 'lucide-react';

export const FinAgreementsPage = () => {
  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Briefcase size={24} color="var(--primary-color)" /> الاتفاقيات المالية للجامعات
      </h3>
      
      <p style={{ opacity: 0.8, marginBottom: '20px' }}>تحديد النسبة المئوية أو المبلغ الثابت المقتطع لكل جامعة مقابل كل طالب مسجل من خلالها.</p>

      <div className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>الجهة التعليمية</th>
              <th>نوع الاتفاقية</th>
              <th>القيمة / النسبة</th>
              <th>حفظ التعديلات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>الجامعة الأردنية</td>
              <td>
                <select className="glass-input" style={{ padding: '5px' }}>
                  <option>نسبة مئوية (%)</option>
                  <option>مبلغ ثابت (دينار)</option>
                </select>
              </td>
              <td>
                <div style={{ position: 'relative', width: '100px' }}>
                  <input type="number" className="glass-input" defaultValue={10} style={{ padding: '5px', width: '100%' }} />
                </div>
              </td>
              <td><button className="glass-btn" style={{ padding: '5px 15px' }}>حفظ</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
