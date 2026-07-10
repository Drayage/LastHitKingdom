import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('icons',{recursive:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lVq9WQAAAABJRU5ErkJggg==','base64');
writeFileSync('icons/icon-192.png',png); writeFileSync('icons/icon-512.png',png); console.log('Generated placeholder PWA icons.');
