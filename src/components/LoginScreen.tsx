import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = usePlayerStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(email && password) {
      login();
    }
  };

  return (
    <div className="flex h-screen bg-[#050506] text-white overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-[#050506]" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-md mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 mb-12"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#00A3FF] to-[#0066FF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#00A3FF] uppercase tracking-[0.3em] font-black">Prime</span>
            <span className="text-white font-black text-3xl tracking-tighter">MULTITRACK</span>
          </div>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleLogin} 
          className="w-full bg-[#0A0A0B]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email" // added autocomplete securely
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00A3FF] focus:bg-white/10 transition-all font-medium"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
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
            className="w-full bg-[#00A3FF] hover:bg-[#0090FF] text-white font-black tracking-widest uppercase py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(0,163,255,0.3)] transition-all"
          >
            Enter Studio
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};
