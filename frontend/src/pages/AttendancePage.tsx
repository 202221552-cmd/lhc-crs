import React, { useState } from 'react';
import { UserCheck, Calendar, Search, CheckCircle, XCircle } from 'lucide-react';

export const AttendancePage = () => {
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const students = [
    { id: '1', name: 'محمد سالم', status: 'present' },
    { id: '2', name: 'أحمد عبدالله', status: 'absent' },
    { id: '3', name: 'سارة خالد', status: 'present' },
  ];

  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserCheck size={24} color="var(--primary-color)" /> تسجيل الحضور والغياب
      </h3>

      <div className="grid-2" style={{ marginBottom: '20px', gap: '20px' }}>
        <div className="form-group">
          <label className="form-label">الشعبة المُراد تسجيل حضورها</label>
          <select className="glass-input" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
            <option value="">-- اختر الشعبة --</option>
            <option value="1">شعبة ICDL - مسائي</option>
            <option value="2">برمجة الويب - صباحي</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">التاريخ</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} style={{ position: 'absolute', right: '15px', top: '15px', color: 'rgba(255,255,255,0.5)' }} />
            <input type="date" className="glass-input" style={{ paddingRight: '40px' }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {selectedSection ? (
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>اسم الطالب</th>
                <th style={{ textAlign: 'center' }}>حاضر</th>
                <th style={{ textAlign: 'center' }}>غائب</th>
                <th style={{ textAlign: 'center' }}>ملاحظات العذر</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="radio" name={`att-${s.id}`} defaultChecked={s.status === 'present'} style={{ width: '20px', height: '20px', accentColor: 'var(--success)' }} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="radio" name={`att-${s.id}`} defaultChecked={s.status === 'absent'} style={{ width: '20px', height: '20px', accentColor: 'var(--danger)' }} />
                  </td>
                  <td>
                    <input type="text" className="glass-input" placeholder="إن وجد..." style={{ padding: '8px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <button className="glass-btn"><CheckCircle size={18} /> حفظ سجل الحضور</button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <Search size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
          <p style={{ opacity: 0.7 }}>يرجى اختيار الشعبة لعرض قائمة الطلاب...</p>
        </div>
      )}
    </div>
  );
};
