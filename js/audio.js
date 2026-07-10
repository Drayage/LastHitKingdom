export function playSound(id){ window.dispatchEvent(new CustomEvent('audio-preview',{detail:{id}})); }
