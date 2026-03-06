
import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  currentView: string;
  setView: (view: 'home' | 'admin' | 'guide') => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, currentView, setView, onLogout }) => {
  return (
    <>
      {/* Desktop Header */}
      <nav className="hidden md:block bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 
              className="text-xl font-bold text-blue-600 cursor-pointer flex items-center gap-2"
              onClick={() => setView('home')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
              CarPlate Master
            </h1>
            <div className="flex items-center gap-4">
              <button onClick={() => setView('home')} className={`px-3 py-2 rounded-md transition ${currentView === 'home' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>조회</button>
              {user.role === UserRole.ADMIN && (
                <button onClick={() => setView('admin')} className={`px-3 py-2 rounded-md transition ${currentView === 'admin' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>관리</button>
              )}
              <button onClick={() => setView('guide')} className={`px-3 py-2 rounded-md transition ${currentView === 'guide' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>명세서</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.name} ({user.role})</span>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition">로그아웃</button>
          </div>
        </div>
      </nav>

      {/* Mobile Header (Simple) */}
      <div className="md:hidden bg-white border-b px-4 py-3 sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-600">CarPlate Master</h1>
        <button onClick={onLogout} className="text-xs font-bold text-red-500">OUT</button>
      </div>

      {/* Mobile Bottom Toolbar (App-like) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-6 z-50 flex justify-between items-center">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span className="text-[10px] font-bold">조회</span>
        </button>
        {user.role === UserRole.ADMIN && (
          <button 
            onClick={() => setView('admin')}
            className={`flex flex-col items-center gap-1 ${currentView === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
            <span className="text-[10px] font-bold">관리</span>
          </button>
        )}
        <button 
          onClick={() => setView('guide')}
          className={`flex flex-col items-center gap-1 ${currentView === 'guide' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span className="text-[10px] font-bold">명세</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
