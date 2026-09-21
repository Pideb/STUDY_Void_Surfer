import './styles.css';
import { createApp } from './app/create-app.js';

const root = document.querySelector('#app');

if (!root) {
  throw new Error('VOID SURFER 앱 마운트 지점을 찾을 수 없습니다.');
}

createApp(root);
