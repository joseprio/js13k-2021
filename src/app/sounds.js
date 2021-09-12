// THIS FILE HAS BEEN GENERATED WITH zzfx-minifier
// Keep that in mind when modifying it!

// ZzFX - Zuper Zmall Zound Zynth - Micro Edition
// MIT License - Copyright 2019 Frank Force
// https://github.com/KilledByAPixel/ZzFX

// This is a tiny build of zzfx with only a zzfx function to play sounds.
// You can use zzfxV to set volume.
// There is a small bit of optional code to improve compatibility.
// Feel free to minify it further for your own needs!

"use strict";

///////////////////////////////////////////////////////////////////////////////

// ZzFXMicro - Zuper Zmall Zound Zynth - v1.1.2

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name ZzFXMicro.min.js
// @js_externs zzfx, zzfxV, zzfxX
// @language_out ECMASCRIPT_2019
// ==/ClosureCompiler==

const zzfxX = new (self.AudioContext || webkitAudioContext)(); // audio context
const zzfxR = 44100; // sample rate
const zzfxV = 0.3; // volume
const zzfx = (
  // play sound
  // parameters
  [
    frequency,
    release,
    sustainVolume,
    modulation = 0,
    bitCrush = 0,
    decay = 0.04,
    tremolo = 0,
    noise = 0,
    slide = 0,
    shape = 4,
    sustain = 0.06,
    attack = 0,
    delay = 0,
    shapeCurve = 0.1,
    volume = 0.04,
    deltaSlide = 0,
    repeatTime = 0,
    pitchJumpTime = 0,
    pitchJump = 0,
  ]
) => {
  const randomness = 0;
  // init parameters
  let PI2 = Math.PI * 2,
    sign = (v) => (v > 0 ? 1 : -1),
    startSlide = (slide *= (500 * PI2) / zzfxR / zzfxR),
    startFrequency = (frequency *=
      ((1 + randomness * 2 * Math.random() - randomness) * PI2) / zzfxR),
    b = [],
    t = 0,
    tm = 0,
    i = 0,
    j = 1,
    r = 0,
    c = 0,
    s = 0,
    f,
    length,
    buffer,
    source;

  // scale by sample rate
  attack = attack * zzfxR + 9; // minimum attack to prevent pop
  decay *= zzfxR;
  sustain *= zzfxR;
  release *= zzfxR;
  delay *= zzfxR;
  deltaSlide *= (500 * PI2) / zzfxR ** 3;
  modulation *= PI2 / zzfxR;
  pitchJump *= PI2 / zzfxR;
  pitchJumpTime *= zzfxR;
  repeatTime = (repeatTime * zzfxR) | 0;

  // generate waveform
  for (
    length = (attack + decay + sustain + release + delay) | 0;
    i < length;
    b[i++] = s
  ) {
    if (!(++c % ((bitCrush * 100) | 0))) {
      // bit crush
      s = shape
        ? shape > 1
          ? shape > 2
            ? shape > 3 // wave shape
              ? Math.sin((t % PI2) ** 3) // 4 noise
              : Math.max(Math.min(Math.tan(t), 1), -1) // 3 tan
            : 1 - (((((2 * t) / PI2) % 2) + 2) % 2) // 2 saw
          : 1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) // 1 triangle
        : Math.sin(t); // 0 sin

      s =
        (repeatTime
          ? 1 - tremolo + tremolo * Math.sin((PI2 * i) / repeatTime) // tremolo
          : 1) *
        sign(s) *
        Math.abs(s) ** shapeCurve * // curve 0=square, 2=pointy
        volume *
        zzfxV * // envelope
        (i < attack
          ? i / attack // attack
          : i < attack + decay // decay
          ? 1 - ((i - attack) / decay) * (1 - sustainVolume) // decay falloff
          : i < attack + decay + sustain // sustain
          ? sustainVolume // sustain volume
          : i < length - delay // release
          ? ((length - i - delay) / release) * // release falloff
            sustainVolume // release volume
          : 0); // post release

      s = delay
        ? s / 2 +
          (delay > i
            ? 0 // delay
            : ((i < length - delay ? 1 : (length - i) / delay) * // release delay
                b[(i - delay) | 0]) /
              2)
        : s; // sample delay
    }

    f =
      (frequency += slide += deltaSlide) * // frequency
      Math.cos(modulation * tm++); // modulation
    t += f - f * noise * (1 - (((Math.sin(i) + 1) * 1e9) % 2)); // noise

    if (j && ++j > pitchJumpTime) {
      // pitch jump
      frequency += pitchJump; // apply pitch jump
      startFrequency += pitchJump; // also apply to start
      j = 0; // reset pitch jump time
    }

    if (repeatTime && !(++r % repeatTime)) {
      // repeat
      frequency = startFrequency; // reset frequency
      slide = startSlide; // reset slide
      j = j || 1; // reset pitch jump time
    }
  }

  // play an array of audio samples
  buffer = zzfxX.createBuffer(1, length, zzfxR);
  buffer.getChannelData(0).set(b);
  source = zzfxX.createBufferSource();
  source.buffer = buffer;
  source.connect(zzfxX.destination);
  source.start();
  return source;
};

export function bullet() {
  // // Removed 7 arguments at the end
  zzfx([292, 0.08, 0.74, , , , 0.43, , -3.9, 3, 0.01, 0.02]);
}

export function enemyHit() {
  // // Removed 11 arguments at the end
  zzfx([467, 0.14, 0.58, 303, 0.4, 0.02, 0.02, 0.5]);
}

export function explosion(volume) {
  // // Removed 2 arguments at the end
  zzfx([
    274,
    0.67,
    0.63,
    ,
    0.5,
    0.02,
    ,
    0.8,
    ,
    ,
    0.03,
    ,
    0.25,
    1.11,
    volume,
    ,
    0.04,
  ]);
}

export function shieldHit() {
  // // Removed 3 arguments at the end
  zzfx([
    119,
    0.44,
    0.85,
    -340,
    0.1,
    0.08,
    ,
    0.7,
    5.3,
    0,
    0,
    ,
    0.01,
    0.09,
    0.9,
    -4.2,
  ]);
}

export function bossExplosion() {
  // // Removed 4 arguments at the end
  zzfx([369, 1, 0.77, -1.3, 0.8, , , 0.7, 0.4, 2, 0.1, , 0.37, 0.05, 1.1]);
}

export function enemyFire() {
  // // Removed 3 arguments at the end
  zzfx([
    279,
    0.09,
    0.89,
    ,
    ,
    ,
    0.02,
    ,
    -4.9,
    3,
    0.09,
    0.02,
    0.05,
    1.2,
    0.15,
    -0.6,
  ]);
}

export function coin() {
  // // Removed 0 arguments at the end
  zzfx([1675, 0.24, 1, , , 0, , , , 1, , , , 1.82, , , , 0.06, 837]);
}
