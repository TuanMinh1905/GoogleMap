'use client';

import { useState, useEffect, useRef } from 'react';

const CORRECT_PIN = '1905';
const PIN_STORAGE_KEY = 'ggmap_authenticated';

export default function PinAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const auth = localStorage.getItem(PIN_STORAGE_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullPin = newPin.join('');
    if (fullPin.length === 4) {
      if (fullPin === CORRECT_PIN) {
        localStorage.setItem(PIN_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
      } else {
        setError(true);
        setPin(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newPin = pasted.split('');
      setPin(newPin);
      if (pasted === CORRECT_PIN) {
        localStorage.setItem(PIN_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
      } else {
        setError(true);
        setTimeout(() => {
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }, 300);
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 mx-4 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">GG Map</h1>
          <p className="text-gray-500 mt-1 text-sm">Nhập mã PIN để truy cập</p>
        </div>

        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                ${error
                  ? 'border-red-400 bg-red-50 animate-shake'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-gray-50'
                }`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm animate-fade-in">
            Mã PIN không đúng. Vui lòng thử lại.
          </p>
        )}
      </div>
    </div>
  );
}

