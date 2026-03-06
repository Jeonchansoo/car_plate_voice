
import React, { useState, useEffect } from 'react';
import { CarRecord, User, UserStatus, UserRole } from '../types';

const INITIAL_RECORDS: CarRecord[] = [
  { id: 1, name: '홍길동', carNumber: '24머 3734', 소속: '서울지부' },
  { id: 2, name: '오감자', carNumber: '31구 2625', 소속: '부산지부' },
  { id: 3, name: '김갑동', carNumber: '102다 3734', 소속: '인천지부' },
  { id: 4, name: '이을숙', carNumber: '12사 1234', 소속: '대구지부' },
  { id: 5, name: '지서방', carNumber: '50두 7889', 소속: '광주지부' },
  { id: 6, name: '남한놈', carNumber: '98사 1235', 소속: '대전지부' },
  { id: 7, name: '전봇대', carNumber: '72카 4252', 소속: '울산지부' },
  { id: 8, name: '이세리나', carNumber: '101자 7889', 소속: '수원지부' },
];

const AdminDashboard: React.FC = () => {
  const [records, setRecords] = useState<CarRecord[]>([]);
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: '김철수', email: 'chulsu@test.com', role: UserRole.USER, status: UserStatus.PENDING, createdAt: '2024-03-20' },
    { id: 'u2', name: '이영희', email: 'younghee@test.com', role: UserRole.USER, status: UserStatus.PENDING, createdAt: '2024-03-21' },
  ]);

  const [newRecord, setNewRecord] = useState({ name: '', carNumber: '', 소속: '' });
  const [activeTab, setActiveTab] = useState<'records' | 'users'>('records');

  useEffect(() => {
    const savedRecords = localStorage.getItem('car_records');
    setRecords(savedRecords ? JSON.parse(savedRecords) : INITIAL_RECORDS);
  }, []);

  const saveRecords = (newRecords: CarRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('car_records', JSON.stringify(newRecords));
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.name || !newRecord.carNumber) return;

    const nextId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    const record: CarRecord = { id: nextId, ...newRecord };
    saveRecords([...records, record]);
    setNewRecord({ name: '', carNumber: '', 소속: '' });
  };

  const handleDeleteRecord = (id: number) => {
    if (confirm('정말로 삭제하시겠습니까?')) {
      saveRecords(records.filter(r => r.id !== id));
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newFromCsv: CarRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const [idStr, name, carNum, affiliation] = lines[i].split(',');
        if (name && carNum) {
          newFromCsv.push({
            id: parseInt(idStr) || (records.length + newFromCsv.length + 1),
            name: name.trim(),
            carNumber: carNum.trim(),
            소속: affiliation ? affiliation.trim() : ''
          });
        }
      }
      saveRecords([...records, ...newFromCsv]);
      alert(`${newFromCsv.length}개의 데이터가 추가되었습니다.`);
    };
    reader.readAsText(file);
  };

  const handleApproveUser = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: UserStatus.APPROVED } : u));
    alert('사용자가 승인되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full md:w-fit mb-8 shadow-sm">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold transition text-sm ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          DB 관리
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold transition text-sm ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          사용자 승인 ({users.filter(u => u.status === UserStatus.PENDING).length})
        </button>
      </div>

      {activeTab === 'records' ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">수동 데이터 등록</h3>
              <form onSubmit={handleAddRecord} className="space-y-4">
                <input
                  type="text"
                  value={newRecord.name}
                  onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="차주 이름"
                />
                <input
                  type="text"
                  value={newRecord.carNumber}
                  onChange={(e) => setNewRecord({ ...newRecord, carNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="번호판 (예: 24머 3734)"
                />
                <input
                  type="text"
                  value={newRecord.소속}
                  onChange={(e) => setNewRecord({ ...newRecord, 소속: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="소속 (예: 서울지부)"
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition">
                  등록하기
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 text-sm">대량 업로드 (.csv)</h3>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-100 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                <span className="text-xs text-slate-400 font-medium">CSV 파일 선택</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              </label>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">전체 차량 데이터 ({records.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">ID</th>
                    <th className="px-6 py-4 font-bold">이름</th>
                    <th className="px-6 py-4 font-bold">차량 번호</th>
                    <th className="px-6 py-4 font-bold">소속</th>
                    <th className="px-6 py-4 font-bold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition group">
                      <td className="px-6 py-4 text-slate-400 text-xs">{r.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">{r.name}</td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-sm">{r.carNumber}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{r.소속}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="text-slate-300 hover:text-red-500 transition p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b">
            <h3 className="font-bold text-slate-900 text-sm">회원가입 요청</h3>
          </div>
          <div className="divide-y">
            {users.filter(u => u.status === UserStatus.PENDING).map(user => (
              <div key={user.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email} · {user.createdAt}</div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => handleApproveUser(user.id)} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">승인</button>
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">거절</button>
                </div>
              </div>
            ))}
            {users.filter(u => u.status === UserStatus.PENDING).length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm">모든 요청이 처리되었습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
