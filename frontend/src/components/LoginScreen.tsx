import React from 'react';

interface LoginScreenProps {
  googleLoginUrl: string;
}

export function LoginScreen({ googleLoginUrl }: LoginScreenProps) {
  return (
    <main className="w-full max-w-md bg-slate-900 text-slate-100 shadow-2xl border border-slate-800 flex flex-col p-6 rounded-3xl overflow-hidden relative">
      <div className="flex items-center justify-center gap-2 mb-8">
        <img src="/world_cup_trophy.png" alt="World Cup Trophy" className="w-8 h-8 object-contain" />
        <span className="font-extrabold text-base tracking-widest bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
          WC PREDICTOR
        </span>
      </div>

      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20 animate-pulse">
            🔮
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full shadow-md">
            LIVE
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Đoán Tỉ Số World Cup
          </h2>
          <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">
            Tham gia tranh tài dự đoán tỉ số các trận cầu đỉnh cao cùng nhóm đồng nghiệp và bạn bè của bạn.
          </p>
        </div>

        {/* Login Buttons */}
        <div className="w-full space-y-4 pt-4">
          <a
            href={googleLoginUrl}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.87c2.17-2 3.72-4.94 3.72-8.55z"
              />
              <path
                fill="#FBBC05"
                d="M5.24 10.55c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.39 3.16C.5 4.93 0 6.91 0 9c0 2.09.5 4.07 1.39 5.84l3.85-3.29z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.87c-1.04.7-2.37 1.12-4.25 1.12-3.34 0-5.86-1.81-6.76-4.51L1.39 14.8c1.98 3.89 5.96 6.56 10.61 6.56z"
              />
            </svg>
            Đăng nhập bằng Google
          </a>
        </div>
      </div>
    </main>
  );
}
