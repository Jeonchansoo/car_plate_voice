
import React from 'react';

const TechnicalGuide: React.FC = () => {
  const currentUrl = window.location.href;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
      <div className="p-8 border-b bg-slate-50">
        <h2 className="text-3xl font-bold text-slate-900">Deployment & Sharing Guide</h2>
        <p className="text-slate-500 mt-2">이 앱을 친구에게 공유하고 실제 앱처럼 사용하는 방법</p>
      </div>
      
      <div className="p-8 space-y-12">
        <section>
          <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            1. 웹으로 친구에게 공유하기 (초간단)
          </h3>
          <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
            <p className="text-sm text-slate-600">
              현재 작성된 코드는 정적 웹 사이트로 즉시 배포 가능합니다. 친구분이 이 URL을 통해 접속하면 실제 데이터를 조회해볼 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">방법 A: Vercel / Netlify</h4>
                <p className="text-xs text-slate-500">GitHub 저장소와 연동하면 1분 안에 `https://car-plate.vercel.app` 같은 고유 주소가 생성됩니다.</p>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">방법 B: GitHub Pages</h4>
                <p className="text-xs text-slate-500">무료로 평생 호스팅이 가능하며, 깃허브 설정에서 클릭 몇 번으로 배포됩니다.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(currentUrl);
                alert('현재 주소가 복사되었습니다! 이 주소를 친구에게 보내보세요.');
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              현재 주소 복사하기
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            2. "진짜 앱"처럼 설치하기 (PWA)
          </h3>
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>홈 화면에 추가:</strong> 아이폰(Safari - 공유 - 홈 화면에 추가) 혹은 안드로이드(Chrome - 메뉴 - 앱 설치)를 사용하면 친구분이 스토어 설치 없이 바탕화면 아이콘을 통해 앱처럼 사용할 수 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            3. 관리자 전체화면 툴바 구성
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            관리자는 하단 툴바를 통해 언제든지 '데이터 관리'와 '사용자 승인'을 오갈 수 있습니다. 반응형 테이블은 모바일에서 가로 스크롤을 지원하여 모든 속성(ID, NAME, CarNumber)을 한눈에 볼 수 있게 설계되었습니다.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-400">
            <div className="p-2 border rounded bg-white">ID (고유번호)</div>
            <div className="p-2 border rounded bg-white">NAME (이름)</div>
            <div className="p-2 border rounded bg-white">CAR # (번호판)</div>
          </div>
        </section>

        <section className="pt-8 border-t text-center">
          <p className="text-xs text-slate-400">
            문의사항: dev@carplatemaster.com | Version 1.0.0-MVP
          </p>
        </section>
      </div>
    </div>
  );
};

export default TechnicalGuide;
