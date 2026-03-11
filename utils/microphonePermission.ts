/**
 * 마이크 권한 자동 요청 유틸리티
 */

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // 브라우저가 마이크 권한 API를 지원하는지 확인
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn('Permissions API not supported');
      return false;
    }

    // 마이크 권한 상태 확인
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    if (permission.state === 'granted') {
      return true;
    }

    if (permission.state === 'prompt') {
      // 권한 요청 다이얼로그 표시
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 스트림 즉시 정리
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        console.error('Microphone permission denied:', error);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
}

/**
 * 마이크 권한 상태 확인
 */
export async function checkMicrophonePermission(): Promise<PermissionState | 'unsupported'> {
  try {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unsupported';
    }

    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return permission.state;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return 'unsupported';
  }
}

/**
 * 자동으로 마이크 권한 요청 (사용자 상호작용 없이 시도)
 */
export async function autoRequestMicrophonePermission(): Promise<boolean> {
  // 사용자 상호작용이 없으면 대부분의 브라우저에서 차단됨
  // 하지만 시도는 해볼 가치가 있음
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log('Auto microphone permission request failed (expected in most browsers):', error);
    return false;
  }
}
