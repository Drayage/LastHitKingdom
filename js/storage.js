import { APP_CONFIG } from './app-config.js';
const KEY=`${APP_CONFIG.APP_ID}:state:${APP_CONFIG.APP_VERSION}`;
export const saveLocalState = state => localStorage.setItem(KEY, JSON.stringify(state));
export const loadLocalState = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
