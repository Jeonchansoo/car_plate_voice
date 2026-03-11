import React, { useState, useEffect } from 'react';
import { CarRecord, User, UserStatus, UserRole, ColumnDef } from '../types';
import * as XLSX from 'xlsx';

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: '이름' },
  { id: 'carNumber', label: '차량 번호' },
  { id: '출입증', label: '출입증' }
];

const INITIAL_RECORDS: CarRecord[] = [
  { id: 1, name: '홍길동', carNumber: '24머 3734', 출입증: '[1] 상주 000' },
  { id: 2, name: '오감자', carNumber: '31구 2625', 출입증: '[1] 상주 001' },
  { id: 3, name: '김갑동', carNumber: '102다 3734', 출입증: '[1] 상주 002' },
  { id: 4, name: '이을숙', carNumber: '12사 1234', 출입증: '[1] 상주 003' },
  { id: 5, name: '지소연', carNumber: '50두 7889', 출입증: '[1] 상주 004' },
  { id: 6, name: '카리나', carNumber: '98사 1235', 출입증: '[1] 상주 205' },
  { id: 7, name: '전봇대', carNumber: '72카 4252', 출입증: '[1] 상주 120' },
  { id: 8, name: '이세리나', carNumber: '101자 7889', 출입증: '[1] 상주 301' },
];

/**
 * 한글이 깨졌는지 감지하는 함수
 * - 치환문자(U+FFFD), 제어문자, 의미없는 특수조합 등이 있으면 깨진 것으로 판단
 */
function hasGarbledKorean(text: string): boolean {
  // U+FFFD 치환 문자가 있으면 깨진 것
  if (text.includes('\uFFFD')) return true;
  // 일반적이지 않은 제어 문자 범위가 다수 포함되면
  const controlChars = text.match(/[\x80-\x9F]/g);
  if (controlChars && controlChars.length > 2) return true;
  return false;
}

/**
 * 업로드된 헤더를 기존 컬럼 ID에 매핑하는 함수
 * - 기존 DEFAULT_COLUMNS의 label과 일치하면 기존 id 사용
 * - 일치하지 않으면 새 id 생성
 */
function mapHeaderToColumnId(header: string, existingColumns: ColumnDef[]): string {
  // 기존 컬럼에서 label이 일치하는 것 찾기
  const found = existingColumns.find(c => c.label === header);
  if (found) return found.id;
  // DEFAULT_COLUMNS에서도 찾기
  const defaultFound = DEFAULT_COLUMNS.find(c => c.label === header);
  if (defaultFound) return defaultFound.id;
  // 새 ID 생성
  return 'col_' + Date.now() + Math.random();
}

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

  // 요청 1: 전체 삭제 시 수동등록/속성관리도 초기화
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    const isFullDelete = selectedIds.length === records.length;

    if (confirm(`선택한 ${selectedIds.length}개의 데이터를 삭제하시겠습니까?${isFullDelete ? '\n\n⚠️ 전체 데이터를 삭제하면 속성 관리도 기본값으로 초기화됩니다.' : ''}`)) {
      if (isFullDelete) {
        // 전체 삭제: 레코드, 컬럼, 폼 모두 초기화
        saveRecords([]);
        saveColumns(DEFAULT_COLUMNS);
        setNewRecordVals({});
        localStorage.removeItem('car_records');
        localStorage.removeItem('car_columns');
      } else {
        saveRecords(records.filter(r => !selectedIds.includes(r.id)));
      }
      setSelectedIds([]);
    }
  };

  // 요청 2: CSV/엑셀 업로드 시 한글 깨짐 수정
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');

    if (isCSV) {
      // CSV 파일: 여러 인코딩으로 시도하여 한글 깨짐 방지
      const tryEncodings = ['utf-8', 'euc-kr', 'cp949', 'utf-16le'];
      let attemptIndex = 0;

      const tryReadWithEncoding = () => {
        if (attemptIndex >= tryEncodings.length) {
          alert('파일을 읽을 수 없습니다. 인코딩을 확인해주세요.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          let text = event.target?.result as string;
          
          // BOM 제거
          text = text.replace(/^\uFEFF/, '');

          // 한글 깨짐 감지
          if (hasGarbledKorean(text)) {
            attemptIndex++;
            tryReadWithEncoding();
          } else {
            processCSVText(text);
          }
        };
        
        reader.onerror = () => {
          attemptIndex++;
          tryReadWithEncoding();
        };

        reader.readAsText(file, tryEncodings[attemptIndex]);
      };

      tryReadWithEncoding();
    } else {
      // XLSX/XLS 파일: ArrayBuffer로 읽기 (XLSX 포맷이 인코딩 자체 처리)
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { 
            type: 'array',
            codepage: 949 // CP949 (EUC-KR) 코드페이지 지정
          });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          processUploadedData(json);
        } catch (error) {
          console.error('엑셀 파일 읽기 오류:', error);
          alert('엑셀 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
      };
      reader.onerror = () => {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsArrayBuffer(file);
    }

    e.target.value = '';
  };

  // CSV 텍스트를 파싱하여 데이터로 변환
  const processCSVText = (text: string) => {
    try {
      // BOM 제거 및 불필요한 공백 제거
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      
      // XLSX로 CSV 파싱 (더 안정적인 한글 처리)
      const workbook = XLSX.read(cleanText, { 
        type: 'string',
        codepage: 949 // CP949 (EUC-KR) 코드페이지 지정
      });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      processUploadedData(json);
    } catch (error) {
      console.error('CSV 파싱 오류:', error);
      alert('CSV 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    }
  };

  // 요청 3: 업로드 데이터의 컬럼 매핑 수정
  const processUploadedData = (json: any[][]) => {
    if (json.length === 0) return;

    const headerRow = json[0].map((h: any) => String(h || '').trim());
    const newCols = [...columns];

    // 헤더를 기존 컬럼에 매핑하거나 새로 추가
    const headerToColId: Record<string, string> = {};
    headerRow.forEach((h: string) => {
      if (h && h.toLowerCase() !== 'id') {
        const existingCol = newCols.find(c => c.label === h);
        if (existingCol) {
          headerToColId[h] = existingCol.id;
        } else {
          const mappedId = mapHeaderToColumnId(h, newCols);
          headerToColId[h] = mappedId;
          if (!newCols.find(c => c.id === mappedId)) {
            newCols.push({ id: mappedId, label: h });
          }
        }
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
            const colId = headerToColId[h];
            if (colId) {
              record[colId] = row[idx] != null ? String(row[idx]).trim() : '';
            }
          }
        });
        newFromUpload.push(record);
      }
    }
    saveRecords([...records, ...newFromUpload]);
    alert(`${newFromUpload.length}개의 데이터가 추가되었습니다.`);
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
              <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-slate-100 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden">
                <span className="text-xs text-slate-400 font-medium text-center z-10 pointer-events-none">
                  파일 선택<br />
                  (CSV, 엑셀)
                </span>
                <input
                  type="file"
                  accept=".csv, text/csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xls, application/vnd.ms-excel"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
              </label>
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
