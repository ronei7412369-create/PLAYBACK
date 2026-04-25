import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion } from 'motion/react';
import { Mail, Lock } from 'lucide-react';
import { BackgroundAnimation } from './BackgroundAnimation';

export const LoginScreen: React.FC = () => {
  const { login, loginWithEmail } = usePlayerStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (loginWithEmail) await loginWithEmail(email, password);
  };

  return (
    <div className="flex h-screen bg-transparent text-white overflow-hidden relative">
      <BackgroundAnimation />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-md mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 mb-12"
        >
          <div className="w-16 h-16 bg-[#002D4A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/20">
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' className="w-10 h-10">
              <path d='M25 40h10v20H25zM45 25h10v50H45zM65 35h10v30H65z' fill='#00A3FF'/>
            </svg>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#00A3FF] uppercase tracking-[0.3em] font-black">Prime</span>
            <span className="text-white font-black text-3xl tracking-tighter">MULTITRACK</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-[#0A0A0B]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl"
        >
          {/* Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] focus:bg-white/10 transition-all font-medium"
                  placeholder="Seu email"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] focus:bg-white/10 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-[#00A3FF] hover:bg-[#0090FF] text-white font-black tracking-widest uppercase py-4 rounded-xl mt-2 shadow-[0_0_20px_rgba(0,163,255,0.3)] transition-all"
            >
              Entrar com Email
            </motion.button>
          </form>

          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-black">OU</span>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          {/* Google Auth */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black tracking-widest uppercase py-4 rounded-xl shadow-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Entrar com Google
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
