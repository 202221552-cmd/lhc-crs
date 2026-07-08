import React from 'react';

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error.name, error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="glass-panel" style={{ padding: 32, margin: 20, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: 12 }}>⚠️ حدث خطأ</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
            {this.state.error.message}
          </p>
          <details style={{ textAlign: 'right', fontSize: '0.78rem', color: '#888', whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', background: '#f8f8f8', padding: 12, borderRadius: 8 }}>
            <summary style={{ cursor: 'pointer', marginBottom: 8 }}>تفاصيل تقنية</summary>
            {this.state.error.name}: {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </details>
          <button className="glass-btn" style={{ marginTop: 16 }} onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
