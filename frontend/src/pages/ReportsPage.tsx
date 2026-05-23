import React from 'react';
import { BarChart, FileText, Download, Filter } from 'lucide-react';

export const ReportsPage = ({ type }: { type: 'academic' | 'ministry' }) => {
  
  const title = type === 'academic' ? 'التقارير الأكاديمية والتحليلية' : 'كشوفات وتقارير الوزارة';
  const iconColor = type === 'academic' ? 'var(--primary-color)' : 'var(--danger)';

  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {type === 'academic' ? <BarChart size={24} color={iconColor} /> : <FileText size={24} color={iconColor} />}
        {title}
      </h3>

      <div className="grid-3" style={{ gap: '20px', marginBottom: '30px' }}>
        <div className="form-group">
          <label className="form-label">نوع التقرير</label>
          <select className="glass-input">
            {type === 'academic' ? (
              <>
                <option>تقرير أعداد المسجلين</option>
                <option>تقرير الحضور والغياب الكلي</option>
                <option>تقرير الشعب والدورات النشطة</option>
              </>
            ) : (
              <>
                <option>كشف طلاب الدبلومات (حسب النموذج المعتمد)</option>
                <option>كشف الخريجين والشهادات</option>
              </>
            )}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">الفترة (من)</label>
          <input type="date" className="glass-input" />
        </div>
        <div className="form-group">
          <label className="form-label">الفترة (إلى)</label>
          <input type="date" className="glass-input" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button className="glass-btn"><Filter size={18} /> توليد التقرير</button>
        <button className="glass-btn" style={{ background: 'rgba(46, 204, 113, 0.2)', border: '1px solid rgba(46, 204, 113, 0.5)' }}>
          <Download size={18} /> تصدير Excel
        </button>
        <button className="glass-btn" style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid rgba(231, 76, 60, 0.5)' }}>
          <Download size={18} /> تصدير PDF
        </button>
      </div>

      <div style={{ minHeight: '300px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          {type === 'academic' ? <BarChart size={60} style={{ marginBottom: '15px' }} /> : <FileText size={60} style={{ marginBottom: '15px' }} />}
          <p>اختر المعايير واضغط "توليد التقرير" لعرض النتائج هنا</p>
        </div>
      </div>
    </div>
  );
};
