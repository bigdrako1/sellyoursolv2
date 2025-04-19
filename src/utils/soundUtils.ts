
const successSound = new Audio('/sounds/success.mp3');
const errorSound = new Audio('/sounds/error.mp3');
const alertSound = new Audio('/sounds/alert.mp3');

export const playSound = (type: 'success' | 'error' | 'alert') => {
  const sound = {
    success: successSound,
    error: errorSound,
    alert: alertSound
  }[type];

  sound.volume = 0.5;
  sound.play().catch(err => console.error('Failed to play sound:', err));
};

export const toggleMute = (muted: boolean) => {
  successSound.muted = muted;
  errorSound.muted = muted;
  alertSound.muted = muted;
};
