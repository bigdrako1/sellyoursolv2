
/**
 * Sound utility functions for the application
 */

// Create audio context and cache sound files
let audioContext: AudioContext | null = null;
let isMuted: boolean = false;

// Initialize audio on user interaction
export const initAudio = () => {
  if (audioContext === null) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Toggle mute status
export const toggleMute = (mute: boolean) => {
  isMuted = mute;
  return isMuted;
};

// Play sound effects based on type
export const playSound = (type: 'success' | 'alert' | 'notification' | 'transaction') => {
  try {
    // Don't attempt to play sounds if audio context not initialized or if muted
    if (!audioContext || isMuted) {
      console.log("Audio will not play: " + (isMuted ? "Sound is muted" : "Audio context not initialized"));
      return;
    }
    
    // Create oscillator for simple tone generation instead of loading audio files
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound based on type
    switch (type) {
      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'alert':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'notification':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'transaction':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
    }
  } catch (error) {
    console.error("Failed to play sound:", error);
  }
};
