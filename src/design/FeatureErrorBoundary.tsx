import React from 'react';

/* ============================================================
 * كود ماجيك — حاجز أخطاء الصفحات الكاملة
 * أي انهيار داخل ميزة ملء الشاشة يُعرض نصه هنا على الشاشة
 * بدل صفحة فارغة — حتى لا نخمّن أبدًا.
 * ============================================================ */

interface Props {
  label?: string;
  onBack?: () => void;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[MagicCode page error]', err, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 bg-[#f5f0e1]" dir="rtl">
          <p className="doodle-title text-lg font-bold text-[#b91c1c]">⚠️ حدث خطأ في هذه الصفحة</p>
          <pre className="text-[11px] text-[#2b2a33]/80 bg-white border-2 border-[#2b2a33]/30 rounded-xl p-3 max-w-md overflow-auto" style={{ direction: 'ltr' }}>
            {this.state.error.message}
          </pre>
          {this.props.onBack && (
            <button
              onClick={this.props.onBack}
              className="doodle-title text-sm font-bold px-5 py-2.5 bg-[#ffecc2] border-2 border-[#2b2a33]/40 rounded-xl text-[#2b2a33] active:scale-95"
            >
              ← رجوع آمن
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
