/**
 * 음성 인식 결과(한글 숫자 또는 숫자)를 4자리 숫자 문자열로 변환
 * 토큰/API 없이 브라우저 Web Speech API만 사용
 */

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
 * 음성 인식 텍스트에서 4자리 숫자만 추출
 * "삼칠삼사", "3 7 3 4", "3734", "삼 칠 삼 사" 등 지원
 */
export function voiceToFourDigits(text: string): string | null {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.replace(/\s/g, '').trim();
  const digits: string[] = [];

  // 1) 이미 숫자만 있는 경우 (예: "3734")
  const onlyDigits = trimmed.replace(/[^\d0-9]/g, '');
  if (onlyDigits.length >= 4) {
    return onlyDigits.slice(0, 4);
  }
  if (onlyDigits.length > 0 && /^\d+$/.test(trimmed)) {
    return onlyDigits.slice(0, 4).padEnd(4, '0').slice(0, 4);
  }

  // 2) 한글 숫자 변환 (한 글자씩 또는 단어별)
  const chars = Array.from(trimmed);
  for (const char of chars) {
    const digit = KOREAN_TO_DIGIT[char];
    if (digit) {
      digits.push(digit);
      if (digits.length >= 4) break;
    }
  }

  if (digits.length >= 4) {
    return digits.slice(0, 4).join('');
  }

  // 3) 혼합 (숫자+한글)
  let mixed = trimmed;
  for (const [kor, num] of Object.entries(KOREAN_TO_DIGIT)) {
    if (kor.length === 1) mixed = mixed.replace(new RegExp(kor, 'g'), num);
  }
  const extracted = mixed.replace(/\D/g, '');
  if (extracted.length >= 4) return extracted.slice(0, 4);

  return digits.length >= 4 ? digits.join('') : null;
}
