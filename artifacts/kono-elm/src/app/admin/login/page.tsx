'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Force a full refresh to ensure middleware picks up the new cookie immediately
        window.location.href = '/admin';
      } else {
        const data = await response.json();
        setError(data.error === 'ADMIN_PASSWORD not configured'
          ? 'خطأ في إعدادات الخادم: لم يتم ضبط كلمة المرور'
          : 'كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcf8] flex items-center justify-center px-4 font-tajawal" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-3xl mb-4 shadow-inner">
            <Lock className="w-10 h-10 text-primary-900" />
          </div>
          <h1 className="text-3xl font-bold text-primary-900">دخول المشرف</h1>
          <p className="text-gray-500 mt-3 text-sm">أدخل كلمة المرور لإدارة محتوى الموسوعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-gold-500 outline-none transition-all text-center text-xl tracking-widest bg-gray-50 group-focus-within:bg-white"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-100 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-800 hover:shadow-xl hover:shadow-primary-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-sm text-primary-600 hover:text-gold-600 font-bold transition-colors">
            العودة للموقع الرئيسي
          </a>
        </div>
      </div>
    </div>
  );
}
