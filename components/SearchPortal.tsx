import React, { useState, useEffect } from 'react';
import { User, CarRecord, ColumnDef } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { usePressAndHoldSpeech } from '../hooks/usePressAndHoldSpeech';
import { requestMicrophonePermission, checkMicrophonePermission } from '../utils/microphonePermission';

const INITIAL_RECORDS: CarRecord[] = [
  { id: 1, name: '홍길동', carNumber: '24머 3734', 출입증: '[1] 상주 000' },
  { id: 2, name: '오감자', carNumber: '31구 2625', 출입증: '[1] 상주 001' },
  { id: 3, name: '김갑동', carNumber: '102다3734', 출입증: '[1] 상주 002' },
  { id: 4, name: '이을숙', carNumber: '12사 1234', 출입증: '[1] 상주 003' },
  { id: 5, name: '지소연', carNumber: '50두9888', 출입증: '[1] 상주 004' },
  { id: 6, name: '카리나', carNumber: '98사 1235', 출입증: '[1] 상주 205' },
  { id: 7, name: '전봇대', carNumber: '72카4252', 출입증: '[1] 상주 120' },
  { id: 8, name: '이세리나', carNumber: '101자 7889', 출입증: '[1] 상주 301' },
];

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: '이름' },
  { id: 'carNumber', label: '차량 번호' },
  { id: '출입증', label: '출입증' }
];

/**
 * 차량번호 문자열에서 끝에서 4자리 숫자를 추출
 * '24머 3734' → '3734'
 * '24머3734' → '3734'
 * '102다 3734' → '3734'
 * '101자7889' → '7889'
 */
function extractLastFourDigits(carNum: string): string {
  if (!carNum) return '';
  // 모든 숫자를 추출
  const allDigits = carNum.replace(/[^0-9]/g, '');
  if (allDigits.length >= 4) {
    return allDigits.slice(-4);
  }
  return allDigits;
}

/**
 * 차량번호 컬럼의 값을 동적으로 찾기
 * - 먼저 carNumber 키를 확인
 * - 없으면 컬럼 정의에서 '차량' 또는 '번호'가 포함된 컬럼 탐색
 */
function getCarNumberValue(record: CarRecord, columns: ColumnDef[]): string {
  const carColId = getCarNumberColumnId(columns);

  // 1. 표준 키 확인
  if (record.carNumber) return String(record.carNumber);
  
  // 2. 컬럼 정의에서 차량번호 관련 컬럼 찾기
  if (carColId && record[carColId]) return String(record[carColId]);
  
  // 3. 모든 필드에서 차량번호 패턴 찾기 (숫자+한글+숫자 패턴)
  for (const key of Object.keys(record)) {
    if (key === 'id' || key === 'name') continue;
    const val = String(record[key] || '');
    if (/\d+[가-힣]\s?\d{4}/.test(val)) return val;
  }
  
  return '';
}

/**
 * 차량번호 컬럼 ID를 동적으로 찾기
 * - carNumber 기본 키 우선
 * - 없으면 컬럼 정의에서 '차량', '번호', 'plate' 포함 컬럼 탐색
 */
function getCarNumberColumnId(columns: ColumnDef[]): string | null {
  if (columns.find(c => c.id === 'carNumber')) return 'carNumber';

  const carCol = columns.find(c =>
    c.label.includes('차량') || c.label.includes('번호') || c.label.toLowerCase().includes('plate')
  );

  return carCol ? carCol.id : null;
}

const SearchPortal: React.FC<{ user: User }> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<CarRecord[]>(INITIAL_RECORDS);
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [results, setResults] = useState<CarRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isTextSearchMode, setIsTextSearchMode] = useState(false);

  const {
    status: speechStatus,
    isListening,
    rawTranscript,
    digits: speechDigits,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition({ lang: 'ko-KR' });

  const {
    status: pressAndHoldStatus,
    isListening: isPressAndHoldListening,
    rawTranscript: pressAndHoldTranscript,
    digits: pressAndHoldDigits,
    error: pressAndHoldError,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
  } = usePressAndHoldSpeech({ lang: 'ko-KR' });

  useEffect(() => {
    const saved = localStorage.getItem('car_records');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
    const savedCols = localStorage.getItem('car_columns');
    if (savedCols) {
      setColumns(JSON.parse(savedCols));
    }

    // 자동 마이크 권한 요청 (사용자 경험 향상)
    const initializeMicrophone = async () => {
      try {
        const permissionState = await checkMicrophonePermission();
        
        if (permissionState === 'prompt') {
          // 권한이 요청 needed 상태이면, 첫 음성 입력 시 자동으로 요청됨
          console.log('마이크 권한이 필요합니다. 음성 입력 버튼을 클릭하면 권한을 요청합니다.');
        } else if (permissionState === 'denied') {
          console.log('마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        }
      } catch (error) {
        console.log('마이크 권한 확인 중 오류:', error);
      }
    };

    initializeMicrophone();
  }, []);

  const handleVoiceInputClick = async () => {
    if (speechStatus === 'unsupported') return;
    
    // 마이크 권한이 필요한 경우 자동 요청
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      console.log('마이크 권한이 필요합니다.');
    }
    
    if (isListening) {
      stopListening();
    } else {
      // 새 음성 입력 시작 시 기존 조회 결과 초기화
      setQuery('');
      setHasSearched(false);
      startListening();
    }
  };

  const handlePressAndHoldStart = async () => {
    // 마이크 권한이 필요한 경우 자동 요청
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      console.log('마이크 권한이 필요합니다.');
    }
    handleMouseDown();
  };
  const runSearch = (value: string) => {
    setHasSearched(true);

    // 검색어에서 숫자만 추출
    const searchDigits = value.replace(/[^0-9]/g, '');
    if (!searchDigits) {
      setResults([]);
      return;
    }

    const filtered = records.filter(record => {
      const carNumber = getCarNumberValue(record, columns);
      if (!carNumber) return false;
      
      // 차량번호에서 끝 4자리 추출 (띄어쓰기 무관)
      const lastFour = extractLastFourDigits(carNumber);
      
      // 정확히 4자리인 경우에만 완전 일치 검색
      if (searchDigits.length === 4) {
        return lastFour === searchDigits;
      }
      
      // 4자리 미만인 경우 끝 4자리에서 시작하는지 확인
      return lastFour.startsWith(searchDigits);
    });

    setResults(filtered);
  };

  const runTextSearch = (value: string) => {
    setHasSearched(true);
    
    if (!value.trim()) {
      setResults([]);
      return;
    }

    const searchValue = value.toLowerCase().trim();
    
    const filtered = records.filter(record => {
      // 모든 필드에서 검색 (문자와 숫자 모두)
      return Object.values(record).some(fieldValue => {
        if (fieldValue === null || fieldValue === undefined) return false;
        const fieldString = String(fieldValue).toLowerCase();
        return fieldString.includes(searchValue);
      });
    });

    setResults(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    runTextSearch(query);
  };

  useEffect(() => {
    if (speechDigits && speechDigits !== query) {
      setQuery(speechDigits);
      runSearch(speechDigits);
    }
  }, [speechDigits]);

  useEffect(() => {
    if (pressAndHoldDigits && pressAndHoldDigits !== query) {
      setQuery(pressAndHoldDigits);
      runSearch(pressAndHoldDigits);
    }
  }, [pressAndHoldDigits]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-xl shadow-blue-200">
        <div className="mb-3">
          <h2 className="text-lg font-bold">안녕하세요, {user.name}님!</h2>
          <p className="text-blue-100 text-xs mt-1">차량번호, 이름, 출입증 등 문자나 숫자를 입력하여 차주 정보 조회</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full">
          <input
            type="text"
            placeholder={isTextSearchMode ? "문자로 조회 중입니다... 검색어를 입력하세요" : "차량번호 뒷자리 4자리 입력 (예: 3734)"}
            className="w-full pl-10 pr-24 py-3 rounded-xl text-slate-900 text-3xl font-bold text-center tracking-[0.15em] outline-none focus:ring-4 focus:ring-blue-400/50 shadow-lg placeholder:text-slate-400 placeholder:font-normal placeholder:text-[9px] placeholder:text-center placeholder:tracking-normal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              if (speechStatus === 'unsupported') return;
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            className={`absolute left-2 top-2 bottom-2 w-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition active:scale-95 ${speechStatus === 'unsupported'
                ? 'bg-slate-500/40 border-slate-400/60 text-slate-200 cursor-not-allowed'
                : isListening
                  ? 'bg-red-500 border-red-400 text-white shadow-md shadow-red-300/60'
                  : 'bg-white/15 border-white/60 text-white hover:bg-white/25'
              }`}
            aria-label={isListening ? '음성 인식 중지' : '음성으로 입력'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500 transition active:scale-95"
          >
            조회하기
          </button>
        </form>

        {/* 직접 입력 / 음성 입력 토글 버튼 영역 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (hasSearched) {
                // 검색 후 결과가 있든 없든 초기화
                setQuery('');
                setHasSearched(false);
                setResults([]);
                setIsTextSearchMode(false);
              } else if (query.trim()) {
                // 결과가 없을 때는 검색 실행
                setIsTextSearchMode(true);
                runTextSearch(query);
              }
            }}
            className={`py-3 rounded-lg font-semibold text-sm shadow-sm transition flex items-center justify-center gap-1 ${
              hasSearched
                ? 'bg-red-500 text-white hover:bg-red-600'
                : query.trim()
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#C0FFFF] text-slate-800 hover:bg-[#B0FFFF]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
            {query.trim() ? '검색중' : '검색'}
          </button>
          <button
            type="button"
            onClick={handleVoiceInputClick}
            className={`py-3 rounded-lg font-semibold text-sm shadow-sm transition flex items-center justify-center gap-1 ${speechStatus === 'unsupported'
                ? 'bg-slate-500/60 text-slate-200 cursor-not-allowed'
                : isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            숫자음성
          </button>
        </div>

        <div className="mt-2 text-xs space-y-1 min-h-[1.2rem]">
          {speechStatus === 'unsupported' && (
            <p className="text-yellow-100/90">
              이 브라우저에서는 음성 인식(Web Speech API)이 지원되지 않습니다. 최신 Chrome 또는 Edge를
              사용해 주세요.
            </p>
          )}
          {pressAndHoldStatus === 'unsupported' && speechStatus !== 'unsupported' && (
            <p className="text-yellow-100/90">
              이 브라우저에서는 음성 인식(Web Speech API)이 지원되지 않습니다. 최신 Chrome 또는 Edge를
              사용해 주세요.
            </p>
          )}
          {(speechError || pressAndHoldError) && (
            <p className="text-red-100">
              음성 인식 오류: <span className="underline underline-offset-2">{speechError || pressAndHoldError}</span>
            </p>
          )}
          {(rawTranscript || pressAndHoldTranscript) && !speechError && !pressAndHoldError && (
            <p className="text-blue-100/90">
              들은 내용: <span className="font-semibold">"{rawTranscript || pressAndHoldTranscript}"</span>
              {(speechDigits || pressAndHoldDigits) && (
                <span className="ml-2">
                  → 해석된 번호판 뒷자리: <span className="font-bold">{speechDigits || pressAndHoldDigits}</span>
                </span>
              )}
            </p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">조회 결과</h3>
          <span className="text-sm text-slate-500">총 {results.length}건</span>
        </div>

        <div className="divide-y">
          {results.length > 0 ? (
            results.map((record) => {
              const carNumber = getCarNumberValue(record, columns);
              const nameCol = columns.find(c => c.label.includes('이름') || c.id === 'name');
              const passCol = columns.find(c => c.label.includes('출입증') || c.id === '출입증');
              const displayName = nameCol ? record[nameCol.id] : record.name;
              const displayPass = passCol ? record[passCol.id] : record['출입증'];
              const carNumberColId = getCarNumberColumnId(columns);

              const extraColumns = columns.filter(c =>
                c.id !== nameCol?.id &&
                c.id !== passCol?.id &&
                c.id !== carNumberColId
              );
              
              return (
                <div key={record.id} className="p-2 space-y-1 hover:bg-blue-50/30 transition border-b-2 border-slate-300 shadow-sm">
                  {/* 여러 행: 차주 성함, 출입증 - 모바일에서도 가로로 표시 */}
                  <div className="grid grid-cols-12 gap-1 min-w-0 items-stretch">
                    {/* 차주 성함 */}
                    <div className="col-span-6 flex flex-col items-center justify-center py-1 px-1 bg-white rounded border border-slate-200 min-w-0">
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5 text-center">차주 성함</div>
                      <div className="text-3xl font-black text-slate-900 text-center truncate w-full">{displayName}</div>
                      {extraColumns.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {extraColumns.slice(0, 1).map(col => {
                            const value = record[col.id];
                            if (value === undefined || value === null || value === '') return null;
                            return (
                              <div key={col.id} className="text-[10px] text-slate-600 text-center">
                                <span className="font-semibold text-slate-400">{col.label}:</span>
                                <span className="text-slate-800 ml-0.5 truncate block">{String(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 출입증 */}
                    {displayPass && (
                      <div className="col-span-6 flex flex-col items-center justify-center py-1 px-1 bg-blue-50 rounded border border-blue-200 min-w-0">
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5 text-center">출입증</div>
                        <div className="text-3xl font-black text-blue-700 text-center truncate w-full">{displayPass}</div>
                      </div>
                    )}
                  </div>

                  {/* 추가 정보가 있을 경우 표시 */}
                  {extraColumns.length > 1 && (
                    <div className="p-1 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-semibold text-slate-700 mb-0.5">추가 정보</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                        {extraColumns.slice(1).map(col => {
                          const value = record[col.id];
                          if (value === undefined || value === null || value === '') return null;
                          return (
                            <div key={col.id} className="text-[10px] text-slate-600 flex gap-1">
                              <span className="font-semibold text-slate-400 min-w-[3rem]">{col.label}</span>
                              <span className="text-slate-800">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 수직 열: 차량 번호 */}
                  <div className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    <div className="text-[8px] text-slate-400 font-bold uppercase mb-0.5 text-center tracking-[0.2em]">Vehicle Number</div>
                    <div className="text-4xl font-black text-slate-800 tracking-wider whitespace-nowrap text-center">{carNumber}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center">
              {hasSearched ? (
                <div className="space-y-3">
                  <div className="text-slate-300 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                  </div>
                  <p className="text-slate-500 font-medium">검색 결과가 없습니다.</p>
                  <p className="text-slate-400 text-sm">번호를 다시 확인해 주세요.</p>
                </div>
              ) : (
                <div className="text-slate-400">조회하실 차량의 번호를 입력해 주세요.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Suggested Search Section for Demo */}
      {!hasSearched && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['3734', '2625', '1234', '7889'].map(num => (
            <button
              key={num}
              onClick={() => { setQuery(num); setHasSearched(false); setIsTextSearchMode(false); }}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition text-sm font-medium text-slate-600 text-center shadow-sm"
            >
              "{num}" 검색해보기
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPortal;
