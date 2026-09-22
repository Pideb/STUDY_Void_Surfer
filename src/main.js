import './styles.css';
import { createApp } from './app/create-app.js';
import { createSupabaseClientFromEnv } from './lib/supabase-client.js';
import { completeOAuthPopup } from './auth/oauth-popup.js';

if (window.location.pathname === '/auth/callback') {
  const status = document.querySelector('#auth-callback-status');
  try {
    const client = createSupabaseClientFromEnv();
    await completeOAuthPopup(client);
  } catch {
    if (status) {
      status.hidden = false;
      status.textContent = '로그인을 완료하지 못했습니다. 이 창을 닫고 다시 시도해 주세요.';
    }
  }
} else {
  const root = document.querySelector('#app');

  if (!root) {
    throw new Error('VOID SURFER 앱 마운트 지점을 찾을 수 없습니다.');
  }

  createApp(root);
}
