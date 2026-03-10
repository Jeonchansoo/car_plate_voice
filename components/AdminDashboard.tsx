import React, { useState, useEffect } from 'react';
import { CarRecord, User, UserStatus, UserRole, ColumnDef } from '../types';
import * as XLSX from 'xlsx';

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: '이름' },
  { id: 'carNumber', label: '차량 번호' },
  { id: '소속', label: '소속' }
];

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
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: '김철수', email: 'chulsu@test.com', role: UserRole.USER, status: UserStatus.PENDING, createdAt: '2024-03-20' },
    { id: 'u2', name: '이영희', email: 'younghee@test.com', role: UserRole.USER, status: UserStatus.PENDING, createdAt: '2024-03-21' },
  ]);

  const [newRecordVals, setNewRecordVals] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'records' | 'users'>('records');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newColumnName, setNewColumnName] = useState('');

  useEffect(() => {
    const savedRecords = localStorage.getItem('car_records');
    setRecords(savedRecords ? JSON.parse(savedRecords) : INITIAL_RECORDS);
    const savedCols = localStorage.getItem('car_columns');
    if (savedCols) {
      setColumns(JSON.parse(savedCols));
    }
  }, []);

  const saveRecords = (newRecords: CarRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('car_records', JSON.stringify(newRecords));
  };

  const saveColumns = (newCols: ColumnDef[]) => {
    setColumns(newCols);
    localStorage.setItem('car_columns', JSON.stringify(newCols));
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    const record: CarRecord = { id: nextId, ...newRecordVals };
    saveRecords([...records, record]);
    setNewRecordVals({});
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (confirm(`선택한 ${selectedIds.length}개의 데이터를 삭제하시겠습니까?`)) {
      saveRecords(records.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      if (json.length === 0) return;

      const headerRow = json[0].map(h => String(h || '').trim());
      const newCols = [...columns];

      headerRow.forEach((h: string) => {
        if (h && h.toLowerCase() !== 'id' && !newCols.find(c => c.label === h)) {
          newCols.push({ id: 'col_' + Date.now() + Math.random(), label: h });
        }
      });
      saveColumns(newCols);

      const newFromUpload: CarRecord[] = [];
      const currentMaxId = records.length > 0 ? Math.max(...records.map(r => r.id)) : 0;
      let nextId = currentMaxId + 1;

      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (row && row.length > 0) {
          const record: CarRecord = { id: nextId++ };
          headerRow.forEach((h: string, idx: number) => {
            if (h.toLowerCase() === 'id') {
              record.id = parseInt(row[idx]) || record.id;
            } else {
              const mappedCol = newCols.find(c => c.label === h);
              if (mappedCol) {
                record[mappedCol.id] = row[idx] ? String(row[idx]).trim() : '';
              }
            }
          });
          newFromUpload.push(record);
        }
      }
      saveRecords([...records, ...newFromUpload]);
      alert(`${newFromUpload.length}개의 데이터가 추가되었습니다.`);
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadFile = (format: 'csv' | 'xlsx') => {
    if (records.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    const dataToExport = records.map(record => {
      const row: any = { ID: record.id };
      columns.forEach(col => {
        row[col.label] = record[col.id] || '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    XLSX.writeFile(workbook, `car_records.${format}`);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      alert('추가할 속성명을 입력해주세요.');
      return;
    }
    const newId = 'col_' + Date.now();
    saveColumns([...columns, { id: newId, label: newColumnName.trim() }]);
    setNewColumnName('');
  };

  const handleUpdateColumnLabel = (id: string, newLabel: string) => {
    saveColumns(columns.map(c => c.id === id ? { ...c, label: newLabel } : c));
  };

  const handleDeleteColumn = (id: string) => {
    if (confirm('이 속성을 삭제하시겠습니까? 데이터 테이블에서 이 열이 제거됩니다.')) {
      saveColumns(columns.filter(c => c.id !== id));
    }
  };

  const handleApproveUser = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: UserStatus.APPROVED } : u));
    alert('사용자가 승인되었습니다.');
  };

  const allSelected = records.length > 0 && selectedIds.length === records.length;

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
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">수동 데이터 등록</h3>
              <form onSubmit={handleAddRecord} className="space-y-4">
                {columns.map(col => (
                  <input
                    key={'input_' + col.id}
                    type="text"
                    value={newRecordVals[col.id] || ''}
                    onChange={(e) => setNewRecordVals({ ...newRecordVals, [col.id]: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder={col.label}
                  />
                ))}
                <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition">
                  등록하기
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 text-sm">속성 관리</h3>
              <div className="space-y-3 mb-4">
                {columns.map(col => (
                  <div key={col.id} className="flex gap-2 items-center w-full">
                    <input
                      value={col.label}
                      onChange={e => handleUpdateColumnLabel(col.id, e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-sm w-full min-w-0 outline-none focus:border-blue-500"
                      placeholder="속성명"
                    />
                    <button onClick={() => handleDeleteColumn(col.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100 transition whitespace-nowrap flex-shrink-0">
                      삭제
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 w-full">
                <input
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full min-w-0 outline-none focus:border-blue-500"
                  placeholder="새 속성명 입력..."
                  onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); }}
                />
                <button onClick={handleAddColumn} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0">
                  추가
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 text-sm">대량 업로드 (.csv / .xlsx)</h3>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-100 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                <span className="text-xs text-slate-400 font-medium text-center">
                  파일 선택<br />
                  (CSV, 엑셀)
                </span>
                <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2 text-sm">데이터 다운로드</h3>
              <div className="flex gap-2">
                <button onClick={() => downloadFile('csv')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition">
                  CSV 다운로드
                </button>
                <button onClick={() => downloadFile('xlsx')} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                  엑셀 다운로드
                </button>
              </div>
            </div>

          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">전체 차량 데이터 ({records.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (allSelected) setSelectedIds([]);
                    else setSelectedIds(records.map(r => r.id));
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition"
                >
                  {allSelected ? '전체 해제' : '전체 선택'}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition disabled:opacity-50"
                  disabled={selectedIds.length === 0}
                >
                  선택항목 삭제 ({selectedIds.length})
                </button>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left min-w-max">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(records.map(r => r.id));
                          else setSelectedIds([]);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 font-bold">ID</th>
                    {columns.map(col => (
                      <th key={'th_' + col.id} className="px-6 py-4 font-bold">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className={`hover:bg-blue-50/20 transition group ${selectedIds.includes(r.id) ? 'bg-blue-50/10' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, r.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== r.id));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{r.id}</td>
                      {columns.map(col => (
                        <td key={'td_' + col.id} className="px-6 py-4 text-slate-700 text-sm">
                          {r[col.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-slate-400">데이터가 없습니다.</td>
                    </tr>
                  )}
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
