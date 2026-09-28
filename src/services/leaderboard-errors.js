const AUTH_CODES = new Set(['401', '403', '42501', 'PGRST301', 'PGRST302']);

export function mapLeaderboardError(error) {
  const code = String(error?.code ?? error?.status ?? '').toUpperCase();
  const rawMessage = typeof error?.message === 'string' ? error.message : '';
  if (code === 'PGRST202' || code === '42883'
    || /could not find (?:the )?function|function .* does not exist/i.test(rawMessage)) {
    return {
      code: 'SCHEMA_MISSING',
      message: 'Supabase 리더보드 함수가 없습니다. 프로젝트의 DB migration이 모두 적용되었는지 확인하세요.',
      retryable: false,
      requiresAuth: false,
    };
  }
  const message = typeof error?.message === 'string' ? error.message : '리더보드 요청을 처리하지 못했습니다.';

  if (AUTH_CODES.has(code) || /auth(entication)? required|jwt|not authenticated|permission denied/i.test(message)) {
    return {
      code: 'AUTH_REQUIRED',
      message: '로그인 상태를 확인해 주세요.',
      retryable: false,
      requiresAuth: true,
    };
  }

  const status = Number(error?.status);
  const isNetwork = error instanceof TypeError
    || /network|fetch failed|failed to fetch|load failed|timeout|timed out/i.test(message);
  const isServerFailure = Number.isFinite(status) && status >= 500;

  if (isNetwork || isServerFailure) {
    return {
      code: 'NETWORK_ERROR',
      message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      retryable: true,
      requiresAuth: false,
    };
  }

  return {
    code: 'DATABASE_ERROR',
    message: '기록을 불러오거나 저장하지 못했습니다.',
    retryable: false,
    requiresAuth: false,
  };
}

export function createValidationError(message) {
  return {
    code: 'VALIDATION_ERROR',
    message,
    retryable: false,
    requiresAuth: false,
  };
}
