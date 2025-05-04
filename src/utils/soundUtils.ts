
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
    
    // Only play sounds for alert type notifications
    if (type !== 'alert') {
      return;
    }
    
    // Create oscillator for simple tone generation instead of loading audio files
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound for alert type
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.error("Failed to play sound:", error);
  }
};
