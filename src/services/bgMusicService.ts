/**
 * Background Music Service
 * Generates synthetic thematic royalty-free BGM tracks via Web Audio API
 * and handles user uploaded custom audio files (MP3/WAV/AAC).
 */

export interface BgMusicPreset {
  id: string;
  name: string;
  category: string;
  desc: string;
  durationSec: number;
}

export const BG_MUSIC_PRESETS: BgMusicPreset[] = [
  {
    id: 'none',
    name: 'Không dùng nhạc nền',
    category: 'Mặc định',
    desc: 'Chỉ phát âm thanh gốc và lời thoại AI',
    durationSec: 0,
  },
  {
    id: 'cinematic_ambient',
    name: '🌌 Điện Ảnh & Huyền Ảo',
    category: 'Cinematic',
    desc: 'Âm hưởng không gian sâu lắng, du dương huyền bí',
    durationSec: 16,
  },
  {
    id: 'epic_heroic',
    name: '⚔️ Trầm Hùng & Sử Thi',
    category: 'Epic',
    desc: 'Tiết tấu hào hùng, khí thế chiến binh dâng trào',
    durationSec: 16,
  },
  {
    id: 'calm_piano',
    name: '🎹 Nhẹ Nhàng & Sâu Lắng',
    category: 'Emotional',
    desc: 'Giai điệu piano truyền cảm, trầm ấm cảm xúc',
    durationSec: 16,
  },
  {
    id: 'asian_flute',
    name: '🎋 Cổ Phong & Sáo Trúc',
    category: 'Traditional',
    desc: 'Âm hưởng ngũ cung sáo trúc phương Đông thư thái',
    durationSec: 16,
  },
  {
    id: 'cyberpunk_synth',
    name: '⚡ Cyberpunk & Tương Lai',
    category: 'Sci-Fi',
    desc: 'Nhịp điệu synthwave điện tử hiện đại, sắc sảo',
    durationSec: 16,
  },
];

// In-memory cache of generated preset audio URLs
const generatedPresetCache: Record<string, string> = {};

/**
 * Encodes an AudioBuffer into a WAV Blob
 */
function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample: number = 0;
  let offset: number = 0;
  let pos: number = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  // data sub-chunk
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < len) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Procedurally generates harmonic musical loops via OfflineAudioContext
 */
export async function generateSyntheticPreset(presetId: string): Promise<string> {
  if (presetId === 'none') return '';
  if (generatedPresetCache[presetId]) {
    return generatedPresetCache[presetId];
  }

  const sampleRate = 44100;
  const duration = 16; // 16 seconds loop
  const totalFrames = sampleRate * duration;
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // Master Gain & Reverb Filter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);

  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, 0);
  masterGain.connect(filter);
  filter.connect(offlineCtx.destination);

  const now = 0;

  // Chord progression generator based on preset
  let chords: number[][] = [];
  let bassNotes: number[] = [];

  switch (presetId) {
    case 'cinematic_ambient':
      // D minor cinematic chord progression (Dmin, Bb, F, C)
      chords = [
        [293.66, 349.23, 440.0], // D4, F4, A4
        [233.08, 293.66, 349.23], // Bb3, D4, F4
        [349.23, 440.0, 523.25], // F4, A4, C5
        [261.63, 329.63, 392.0], // C4, E4, G4
      ];
      bassNotes = [73.42, 58.27, 87.31, 65.41]; // D2, Bb1, F2, C2
      break;

    case 'epic_heroic':
      // Epic harmonic minor (A minor, F major, D minor, E major)
      chords = [
        [220.0, 261.63, 329.63], // A3, C4, E4
        [174.61, 220.0, 261.63], // F3, A3, C4
        [146.83, 174.61, 220.0], // D3, F3, A3
        [164.81, 207.65, 246.94], // E3, G#3, B3
      ];
      bassNotes = [55.0, 43.65, 36.71, 41.2]; // A1, F1, D1, E1
      break;

    case 'calm_piano':
      // Warm lyrical major progression (C, G/B, Am, F)
      chords = [
        [261.63, 329.63, 392.0], // C4, E4, G4
        [246.94, 293.66, 392.0], // B3, D4, G4
        [220.0, 261.63, 329.63], // A3, C4, E4
        [174.61, 220.0, 261.63], // F3, A3, C4
      ];
      bassNotes = [65.41, 61.74, 55.0, 43.65]; // C2, B1, A1, F1
      break;

    case 'asian_flute':
      // Asian Pentatonic (D, F, G, A, C)
      chords = [
        [293.66, 440.0, 587.33], // D4, A4, D5
        [349.23, 440.0, 698.46], // F4, A4, F5
        [392.0, 523.25, 783.99], // G4, C5, G5
        [440.0, 587.33, 880.0], // A4, D5, A5
      ];
      bassNotes = [73.42, 87.31, 98.0, 110.0];
      break;

    case 'cyberpunk_synth':
    default:
      // Cyberpunk Synth bassline
      chords = [
        [130.81, 196.0, 246.94], // C3, G3, B3
        [116.54, 174.61, 233.08], // Bb2, F3, Bb3
        [123.47, 185.0, 246.94], // B2, F#3, B3
        [130.81, 196.0, 261.63], // C3, G3, C4
      ];
      bassNotes = [65.41, 58.27, 61.74, 65.41];
      break;
  }

  const barDuration = duration / chords.length; // 4 seconds per chord

  // Render chords and arpeggios
  chords.forEach((chord, chordIdx) => {
    const startTime = now + chordIdx * barDuration;

    // Pad / Chords
    chord.forEach((freq) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = presetId === 'cyberpunk_synth' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.8);
      gain.gain.setValueAtTime(0.1, startTime + barDuration - 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + barDuration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + barDuration);
    });

    // Sub Bass
    const bassOsc = offlineCtx.createOscillator();
    const bassGain = offlineCtx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(bassNotes[chordIdx] || 65, startTime);

    bassGain.gain.setValueAtTime(0.01, startTime);
    bassGain.gain.linearRampToValueAtTime(0.25, startTime + 0.3);
    bassGain.gain.setValueAtTime(0.2, startTime + barDuration - 0.4);
    bassGain.gain.linearRampToValueAtTime(0.01, startTime + barDuration);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(startTime);
    bassOsc.stop(startTime + barDuration);

    // Arpeggio notes
    for (let step = 0; step < 8; step++) {
      const noteTime = startTime + (step * barDuration) / 8;
      const noteFreq = chord[step % chord.length] * (step % 2 === 0 ? 1 : 1.5);

      const arpOsc = offlineCtx.createOscillator();
      const arpGain = offlineCtx.createGain();

      arpOsc.type = presetId === 'asian_flute' ? 'sine' : 'sine';
      arpOsc.frequency.setValueAtTime(noteFreq, noteTime);

      arpGain.gain.setValueAtTime(0.01, noteTime);
      arpGain.gain.exponentialRampToValueAtTime(0.08, noteTime + 0.05);
      arpGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      arpOsc.connect(arpGain);
      arpGain.connect(masterGain);

      arpOsc.start(noteTime);
      arpOsc.stop(noteTime + 0.5);
    }
  });

  const renderedBuffer = await offlineCtx.startRendering();
  const waveBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
  const audioUrl = URL.createObjectURL(waveBlob);

  generatedPresetCache[presetId] = audioUrl;
  return audioUrl;
}

/**
 * Handle custom uploaded audio file
 */
export function handleCustomAudioUpload(file: File): Promise<{ url: string; name: string }> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          url: dataUrl,
          name: file.name,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
}
