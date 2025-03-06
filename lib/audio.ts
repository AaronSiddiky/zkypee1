/**
 * Audio utilities for the dialer component
 */

// Singleton instance to manage audio context
let audioContext: AudioContext | null = null;

interface OscillatorFrequencies {
  high: number;
  low: number;
}

// DTMF frequencies for each key
// Follows the standard DTMF frequency matrix used in telephone systems
// https://en.wikipedia.org/wiki/Dual-tone_multi-frequency_signaling
const DTMF_FREQUENCIES: Record<string, OscillatorFrequencies> = {
  "1": { high: 1209, low: 697 },
  "2": { high: 1336, low: 697 },
  "3": { high: 1477, low: 697 },
  "4": { high: 1209, low: 770 },
  "5": { high: 1336, low: 770 },
  "6": { high: 1477, low: 770 },
  "7": { high: 1209, low: 852 },
  "8": { high: 1336, low: 852 },
  "9": { high: 1477, low: 852 },
  "0": { high: 1336, low: 941 },
  "*": { high: 1209, low: 941 },
  "#": { high: 1477, low: 941 },
};

/**
 * Play DTMF tone for a specific key
 * @param key The key to play (0-9, *, #)
 * @param duration Duration in milliseconds
 */
export const playDTMF = (key: string, duration = 150) => {
  try {
    // Lazily create AudioContext when needed (to comply with autoplay policies)
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Resume context if it's suspended (browsers may suspend it until user interaction)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const frequencies = DTMF_FREQUENCIES[key];
    if (!frequencies) return;

    // Create oscillators for the two DTMF frequencies
    const highOsc = audioContext.createOscillator();
    const lowOsc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Set frequency and type
    highOsc.frequency.value = frequencies.high;
    lowOsc.frequency.value = frequencies.low;
    highOsc.type = "sine";
    lowOsc.type = "sine";

    // Set volume (prevent clipping)
    gainNode.gain.value = 0.2;

    // Connect oscillators to gain node and gain node to output
    highOsc.connect(gainNode);
    lowOsc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and stop the oscillators
    const now = audioContext.currentTime;
    highOsc.start(now);
    lowOsc.start(now);

    // Gradual release to prevent clicks
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

    // Stop oscillators after duration
    highOsc.stop(now + duration / 1000);
    lowOsc.stop(now + duration / 1000);

    // Clean up
    setTimeout(() => {
      highOsc.disconnect();
      lowOsc.disconnect();
      gainNode.disconnect();
    }, duration + 50);
  } catch (error) {
    console.error("Error playing DTMF tone:", error);
  }
};

/**
 * Clean up audio resources
 */
export const cleanupAudio = () => {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};
