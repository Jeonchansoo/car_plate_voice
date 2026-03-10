/**
 * 음성 인식 결과(한글 숫자 또는 숫자)를 숫자 문자열로 변환
 * 토큰/API 없이 브라우저 Web Speech API만 사용
 *
 * ★ 한글 연음 법칙 대응:
 *  - "칠이칠이" → "치리치리" (ㄹ 연음)
 *  - "구이오구" → "구이옥우" (ㄱ 연음)
 *  - "팔이" → "파리" (ㄹ 연음)
 *  - "일이" → "이리" (ㄹ 연음)
 *  - "육이" → "유기" (ㄱ 연음)
 *  - "삼이" → "사미" (ㅁ 연음)
 *  등 다양한 연음 패턴을 매핑하여 정확한 숫자 변환 지원
 */

// 기본 한글 숫자 → 디지트 매핑
const KOREAN_TO_DIGIT: Record<string, string> = {
  영: '0', 공: '0', 제로: '0',
  일: '1', 하나: '1',
  이: '2', 둘: '2',
  삼: '3', 셋: '3',
  사: '4', 넷: '4',
  오: '5', 다섯: '5',
  육: '6', 륙: '6', 여섯: '6',
  칠: '7', 일곱: '7',
  팔: '8', 여덟: '8',
  구: '9', 아홉: '9',
  // 숫자 문자
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
};

/**
 * 연음 법칙으로 인한 2글자 → 2자리 숫자 매핑
 * 한국어에서 받침이 다음 음절 초성으로 연음되는 현상 대응
 */
const LIAISON_TWO_CHAR_TO_DIGITS: Record<string, string> = {
  // ㄹ 받침 연음 (칠, 팔, 일)
  치리: '72', // 칠(7) + 이(2) → 치리
  치로: '75', // 칠(7) + 오(5) → 치로
  치릴: '77', // 칠(7) + 칠(7) → 치릴? (드물지만)
  치류: '76', // 칠(7) + 육(6) → 치류
  치르: '75', // 칠(7) + 오(5) 변형
  파리: '82', // 팔(8) + 이(2) → 파리
  파로: '85', // 팔(8) + 오(5) → 파로
  파류: '86', // 팔(8) + 육(6) → 파류
  파릴: '87', // 팔(8) + 일(1) → 파릴
  이리: '12', // 일(1) + 이(2) → 이리
  이로: '15', // 일(1) + 오(5) → 이로
  이류: '16', // 일(1) + 육(6) → 이류
  이릴: '11', // 일(1) + 일(1) → 이릴

  // ㄱ 받침 연음 (육, 구의 영향)
  유기: '62', // 육(6) + 이(2) → 유기
  유고: '65', // 육(6) + 오(5) → 유고
  유길: '61', // 육(6) + 일(1) → 유길
  유구: '69', // 육(6) + 구(9) → 유구
  유규: '66', // 육(6) + 육(6) → 유규
  옥구: '59', // 오(5) + 구(9) → 옥구 (ㄱ 역행)
  옥우: '59', // 오(5) + 구(9) → 옥우 (speech API 변형)

  // ㅁ 받침 연음 (삼)
  사미: '32', // 삼(3) + 이(2) → 사미
  사모: '35', // 삼(3) + 오(5) → 사모
  사밀: '31', // 삼(3) + 일(1) → 사밀
  사무: '36', // 삼(3) + 육(6) → 사무? (드물)
  삼마: '34', // 삼(3) + 사(4) → 삼마? (ㅁ+ㅅ)

  // 기타 연음/발음 변형
  구이: '92', // 구(9) + 이(2) (정상이지만 확실히)
  구오: '95', // 구(9) + 오(5)
  오이: '52', // 오(5) + 이(2)
  오구: '59', // 오(5) + 구(9) (정상)
  사이: '42', // 사(4) + 이(2) (정상)
  이구: '29', // 이(2) + 구(9)
  이사: '24', // 이(2) + 사(4)
  이오: '25', // 이(2) + 오(5)
};

/**
 * 연음으로 변형된 단일 글자 → 디지트 매핑
 * 앞뒤 문맥 없이 단독 출현 시 사용
 */
const LIAISON_SINGLE_CHAR: Record<string, string> = {
  치: '7', // 칠(7)의 연음 시작
  파: '8', // 팔(8)의 연음 시작
  유: '6', // 육(6)의 연음 시작
  옥: '5', // 오(5) + ㄱ 연음
  리: '2', // ㄹ 연음 뒤의 이(2)
  로: '5', // ㄹ 연음 뒤의 오(5)
  기: '2', // ㄱ 연음 뒤의 이(2) (육이 → 유기)
  미: '2', // ㅁ 연음 뒤의 이(2) (삼이 → 사미)
};

/**
 * 음성 인식 텍스트에서 숫자를 추출
 * "삼칠삼사", "3 7 3 4", "3734", "삼 칠 삼 사", "치리치리" 등 지원
 * 4자리 이상이면 끝 4자리를 반환, 4자리 미만이어도 있는 만큼 반환
 */
export function voiceToFourDigits(text: string): string | null {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.replace(/\s/g, '').trim();

  // 1) 순수 숫자만 있는 경우 → 즉시 처리 (숫자 최우선)
  const onlyDigits = trimmed.replace(/[^\d]/g, '');
  if (onlyDigits.length >= 4) {
    return onlyDigits.slice(-4);
  }
  if (onlyDigits.length > 0 && /^\d+$/.test(trimmed)) {
    return onlyDigits;
  }

  // 2) 연음 법칙 대응: 2글자 연음 패턴을 먼저 변환
  let processed = trimmed;
  // 긴 패턴부터 매칭 (greedy)
  const sortedLiaisons = Object.entries(LIAISON_TWO_CHAR_TO_DIGITS)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [pattern, digits] of sortedLiaisons) {
    while (processed.includes(pattern)) {
      processed = processed.replace(pattern, digits);
    }
  }

  // 3) 기본 한글 숫자 변환 (두 글자 우선)
  const digits: string[] = [];
  let remaining = processed;

  while (remaining.length > 0) {
    let matched = false;

    // 두 글자 한글 숫자 먼저 시도
    if (remaining.length >= 2) {
      const twoChar = remaining.slice(0, 2);
      // 기본 두 글자 매핑 (하나, 제로, 다섯, 여섯, 일곱, 여덟, 아홉)
      if (KOREAN_TO_DIGIT[twoChar]) {
        digits.push(KOREAN_TO_DIGIT[twoChar]);
        remaining = remaining.slice(2);
        matched = true;
      }
    }

    if (!matched) {
      const oneChar = remaining[0];
      // 기본 매핑
      if (KOREAN_TO_DIGIT[oneChar]) {
        digits.push(KOREAN_TO_DIGIT[oneChar]);
      } else if (LIAISON_SINGLE_CHAR[oneChar]) {
        // 연음 단일 글자 매핑 (앞에서 2글자 패턴으로 처리 안 된 경우)
        digits.push(LIAISON_SINGLE_CHAR[oneChar]);
      }
      // 매핑 안 되는 글자는 건너뛰기
      remaining = remaining.slice(1);
    }
  }

  if (digits.length >= 4) {
    return digits.slice(-4).join('');
  }
  if (digits.length > 0) {
    return digits.join('');
  }

  // 4) 원본에서 순수 숫자만이라도 추출
  if (onlyDigits.length > 0) {
    return onlyDigits;
  }

  return null;
}

/**
 * 여러 transcript alternative 중 숫자가 가장 많이 포함된 것을 선택
 */
export function pickBestTranscript(alternatives: string[]): string {
  if (alternatives.length === 0) return '';
  if (alternatives.length === 1) return alternatives[0];

  let bestText = alternatives[0];
  let bestScore = -1;

  for (const alt of alternatives) {
    const trimmed = alt.replace(/\s/g, '');
    // 순수 숫자 개수
    const digitCount = (trimmed.match(/\d/g) || []).length;
    // 한글 숫자 개수
    let koreanDigitCount = 0;
    for (const char of trimmed) {
      if (KOREAN_TO_DIGIT[char] && !/\d/.test(char)) {
        koreanDigitCount++;
      }
    }
    const score = digitCount * 3 + koreanDigitCount; // 순수 숫자에 더 높은 가중치
    if (score > bestScore) {
      bestScore = score;
      bestText = alt;
    }
  }

  return bestText;
}
