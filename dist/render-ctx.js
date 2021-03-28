import { Runtime } from "./runtime.js";
const log2of48000 = 18660; //Math.log2(48000) * 1200;
export class RenderCtx {
  constructor(sff) {
    this.sampleRate = 48000;
    this.voices = [];
    this._masterVol = 120;
    /* db attentuate.. */
    this._chanVols = new Array(16).fill(70);
    this.render = (blockSize) => {
      const output = Buffer.allocUnsafe(blockSize * 8);
      this.voices
        .filter((v) => v.length && v.length > 0)
        .map((voice) => {
          this._render(voice, output, blockSize);
        });
      return output;
    };
    this.sff = sff;
    this.programs = [
      { presetId: 0, bankId: 0 },
      { presetId: 0x08, bankId: 0 },
      { presetId: 0x10, bankId: 0 },
      { presetId: 0x18, bankId: 0 },
      { presetId: 0x20, bankId: 0 },
      { presetId: 0x28, bankId: 0 },
      { presetId: 0x30, bankId: 0 },
      { presetId: 0x38, bankId: 0 },
      { presetId: 0x40, bankId: 0 },
      { presetId: 0, bankId: 128 },
      { presetId: 0x50, bankId: 0 },
      { presetId: 0x60, bankId: 0 },
      { presetId: 0x70, bankId: 0 },
    ];
  }
  get masterVol() {
    return this._masterVol;
  }
  set masterVol(value) {
    this._masterVol = value;
  }
  get chanVols() {
    return this._chanVols;
  }
  set chanVols(value) {
    this._chanVols = value;
  }
  keyOn(key, vel, channelId = 0) {
    const { presetId, bankId } = this.programs[channelId];
    const zones = this.sff.pdta.findPreset(bankId, presetId, key, vel);
    if (!zones || !zones.length) return;
    zones.forEach((zone, i) => {
      this.voices[channelId + 16 * i] = new Runtime(
        zone,
        {
          key: key,
          velocity: vel,
          channel: channelId,
        },
        this
      );
    });
    return this.voices[channelId];
  }
  keyOff(channelId) {
    this.voices[channelId]?.mods.ampVol.triggerRelease();
  }
  _render(voice, outputArr, blockLength) {
    const input = this.sff.sdta.data;
    const looper = voice.sample.endLoop - voice.sample.startLoop;
    let shift = 0.0;
    let iterator = voice.iterator || voice.sample.start;
    const { volume, pitch, filter } = voice.run(blockLength);
    for (let offset = 0; offset < blockLength; offset++) {
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      let currentVal = outputArr.readFloatLE(outputByteOffset);
      if (isNaN(currentVal)) currentVal = 0.0;
      let newVal;
      if (offset > 4) {
        const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) => input[iterator + i]);
        newVal = hermite4(shift, vm1, v0, v1, v2);
      } else {
        newVal = input[iterator];
      }
      let sum = currentVal + newVal * volume;
      outputArr.writeFloatLE(
        sum * voice.staticLevels.pan.left,
        outputByteOffset
      );
      outputArr.writeFloatLE(
        sum * voice.staticLevels.pan.right,
        outputByteOffset + 4
      );
      if (offset % 200 == 42) {
        //console.log(currentVal, newVal, input.readFloatLE(outputByteOffset));
      }
      shift += pitch;
      while (shift >= 1) {
        iterator++;
        shift--;
      }
      if (iterator >= voice.sample.endLoop) {
        iterator -= looper;
      }
      if (iterator >= voice.sample.end) {
        //  console.log('hit sample emd ,,,', channel.length);
        // if (voice.length > 0) throw 'error with loop';
      }
    }
    voice.length -= blockLength;
    voice.iterator = iterator;
  }
}
function hermite4(frac_pos, xm1, x0, x1, x2) {
  const c = (x1 - xm1) * 0.5;
  const v = x0 - x1;
  const w = c + v;
  const a = w + v + (x2 - x0) * 0.5;
  const b_neg = w + a;
  return ((a * frac_pos - b_neg) * frac_pos + c) * frac_pos + x0;
}
