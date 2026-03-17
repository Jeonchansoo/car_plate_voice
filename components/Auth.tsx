
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isLogin) {
      // Mock Login Logic
      if (email === 'admin@test.com') {
        onLogin({
          id: '1',
          name: '관리자',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
          createdAt: new Date().toISOString(),
        });
      } else if (email === 'admin5826@test.com') {
        onLogin({
          id: '4',
          name: '관리자',
          email: 'admin5826@test.com',
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
          createdAt: new Date().toISOString(),
        });
      } else if (email === 'admin7231@test.com') {
        onLogin({
          id: '3',
          name: '관리자',
          email: 'admin7231@test.com',
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
          createdAt: new Date().toISOString(),
        });
      } else if (email === 'user@test.com') {
        onLogin({
          id: '2',
          name: '일반사용자',
          email: 'user@test.com',
          role: UserRole.USER,
          status: UserStatus.APPROVED,
          createdAt: new Date().toISOString(),
        });
      } else {
        setError('존재하지 않는 계정이거나 승인 대기 중입니다. (사용자: user@test.com)');
      }
    } else {
      // Mock Signup Logic
      setMessage('회원가입 요청이 전송되었습니다. 관리자 승인 후 로그인이 가능합니다.');
      setTimeout(() => setIsLogin(true), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-200">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">CarPlate Master</h1>
          <p className="text-slate-500 mt-1">{isLogin ? '계정에 로그인하세요' : '새 계정 신청 (관리자 승인 필요)'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 border border-green-100">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition shadow-md shadow-blue-100"
          >
            {isLogin ? '로그인' : '승인 요청하기'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? '신청하기' : '로그인하기'}
          </button>
        </div>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400">
          <p className="font-semibold text-slate-500 mb-1">MVP 데모 안내:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>사용자: user@test.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Auth;
