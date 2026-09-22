const ERROR_MESSAGES = Object.freeze({
  CONFIG_MISSING: 'Supabase 연결 설정이 없습니다. 환경 변수를 확인해 주세요.',
  CONFIG_INVALID: 'Supabase 연결 설정을 확인할 수 없습니다.',
  POPUP_BLOCKED: '로그인 창이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.',
  AUTH_CANCELLED: '로그인이 취소되었습니다.',
  AUTH_TIMEOUT: '로그인 응답 시간이 초과되었습니다. 다시 시도해 주세요.',
  AUTH_FAILED: 'Microsoft 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  PROFILE_SYNC_FAILED: '계정 이름을 저장하지 못했습니다. 연결을 확인한 뒤 다시 로그인해 주세요.',
});

export class AuthFlowError extends Error {
  constructor(code, message = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.AUTH_FAILED, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AuthFlowError';
    this.code = code;
  }
}

export function normalizeAuthError(error) {
  if (error instanceof AuthFlowError) {
    return error;
  }

  if (error?.code === 'CONFIG_MISSING' || error?.code === 'CONFIG_INVALID') {
    return new AuthFlowError(error.code, ERROR_MESSAGES[error.code], error);
  }

  return new AuthFlowError('AUTH_FAILED', ERROR_MESSAGES.AUTH_FAILED, error);
}

export function getAuthErrorMessage(error) {
  const normalized = normalizeAuthError(error);
  return ERROR_MESSAGES[normalized.code] ?? ERROR_MESSAGES.AUTH_FAILED;
}
