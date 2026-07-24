import React, { useState } from 'react';
import { Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { authService, apiService } from '../services/api';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiService.login(username, password);
      authService.setToken(data.token);
      authService.setUser(data.username);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF9EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-8 shadow-[8px_8px_0_0_#4A3E26] relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-[#F3C556] border-4 border-[#4A3E26] rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#4A3E26]">
            <Lock className="w-6 h-6 text-[#4A3E26]" />
          </div>

          <div className="text-center pt-4 mb-8">
            <h2 className="text-3xl font-black text-[#4A3E26] font-display">管理员登录</h2>
            <p className="text-sm text-[#8E6D3B] mt-2 font-bold">Admin Console</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Sparkles className="w-4 h-4 text-[#3BB4FE]" />
              <span className="text-xs text-[#8E6D3B] font-bold">四金的私人领地</span>
              <Sparkles className="w-4 h-4 text-[#3BB4FE]" />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full bg-white border-2 border-[#4A3E26] px-4 py-3 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE] focus:border-[#3BB4FE] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" />
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full bg-white border-2 border-[#4A3E26] px-4 py-3 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE] focus:border-[#3BB4FE] transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3BB4FE] hover:bg-[#1fa1ef] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black py-3.5 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all text-base flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">登录中...</span>
              ) : (
                <>
                  <span>进入管理后台</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#8E6D3B]/60 mt-6 font-bold">
          © 2026 四金 · 私人生活记录管理系统
        </p>
      </div>
    </div>
  );
}
