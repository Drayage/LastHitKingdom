import { APP_CONFIG } from './app-config.js';
export function sanitizeForFirebase(value){ if(Array.isArray(value)) return value.map(sanitizeForFirebase); if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,sanitizeForFirebase(v)])); return value; }
export function shouldAcceptRemoteState(localSeq, remoteSeq){ return Number(remoteSeq) > Number(localSeq); }
export const namespacePath = roomId => `${APP_CONFIG.FIREBASE_NAMESPACE}/rooms/${roomId}`;
