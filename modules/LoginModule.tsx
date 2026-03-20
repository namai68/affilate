
import React, { useState } from 'react';
import { saveStoredKeys } from '../services/keyService';

interface LoginModuleProps {
  onLogin: (apiKey: string) => void;
}

const LoginModule: React.FC<LoginModuleProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username !== 'namleai' || password !== 'Nam6789@') {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác!');
      return;
    }

    if (!apiKey) {
      setError('Vui lòng nhập API KEY để sử dụng ứng dụng!');
      return;
    }

    // Lưu API Key vào localStorage thông qua keyService
    saveStoredKeys(apiKey);
    
    // Gọi callback onLogin
    onLogin(apiKey);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Inter']">
      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-[#D97706] to-[#B45309] p-10 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {/* Shield Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 mb-6 shadow-inner">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <h1 className="text-white text-4xl font-black tracking-tighter uppercase mb-2">NAM AI</h1>
          <p className="text-orange-100 text-sm font-bold uppercase tracking-widest opacity-90">Hệ thống AI Nhân Hóa Chuyên Nghiệp</p>
        </div>

        {/* Form Section */}
        <div className="p-10 space-y-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">TÊN ĐĂNG NHẬP</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..." 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">MẬT KHẨU</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..." 
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* API KEY Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">API KEY (GEMINI)</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập API Key của bạn..." 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic ml-1">
                * API Key sẽ được dùng cho toàn bộ ứng dụng. 
                <br />
                Lấy API miễn phí tại đây: <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold hover:underline">https://aistudio.google.com/api-keys</a>
              </p>
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center animate-shake">{error}</p>}

            <button 
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-[0_10px_30px_rgba(234,88,12,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              ĐĂNG NHẬP NGAY
            </button>
          </form>

          {/* Footer Contact Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="bg-blue-50/50 rounded-3xl p-6 text-center border border-blue-100/50">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98 1 4.28L2 22l5.72-1c1.3.64 2.74 1 4.28 1 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </div>
              <h4 className="text-blue-900 font-black text-sm uppercase mb-1">Chưa có mật khẩu truy cập?</h4>
              <p className="text-blue-700/70 text-[11px] leading-relaxed mb-4">
                Vui lòng liên hệ Zalo <span className="font-black text-blue-900">098.102.8794</span> để lấy mật khẩu truy cập ứng dụng.
              </p>
              <a 
                href="https://zalo.me/0981028794" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 bg-white text-blue-600 font-black rounded-full text-[11px] uppercase tracking-widest border border-blue-200 shadow-sm hover:shadow-md transition-all"
              >
                NHẤN ZALO NGAY
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModule;
