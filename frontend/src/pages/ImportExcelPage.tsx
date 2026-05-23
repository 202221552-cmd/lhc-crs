import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle } from 'lucide-react';

export const ImportExcelPage = () => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '50px' }}>
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <FileSpreadsheet size={28} color="var(--success)" /> استيراد الطلاب من ملف Excel
      </h3>
      
      <p style={{ opacity: 0.8, marginBottom: '30px' }}>
        يمكنك رفع ملف إكسل يحتوي على بيانات الطلاب لاستيرادهم دفعة واحدة إلى النظام.
        تأكد من مطابقة أعمدة الملف للنموذج المعتمد.
      </p>

      <div style={{ border: '2px dashed rgba(255,255,255,0.3)', padding: '40px', borderRadius: '10px', background: 'rgba(0,0,0,0.1)', cursor: 'pointer' }}>
        <UploadCloud size={60} style={{ opacity: 0.5, marginBottom: '15px' }} />
        <h4>اسحب الملف هنا أو اضغط للاختيار</h4>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {file && (
        <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '8px', border: '1px solid var(--success)' }}>
          <CheckCircle size={24} color="var(--success)" style={{ marginBottom: '10px' }} />
          <h5>الملف المختار: {file.name}</h5>
          <button className="glass-btn" style={{ marginTop: '15px' }}>بدء الاستيراد</button>
        </div>
      )}
    </div>
  );
};
