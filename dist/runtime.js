import {
  cent2hz,
  centidb2gain,
  dbfs,
  stagesEnum,
  timecent2sec,
} from "./runtime.types.js";
export class Runtime {
  constructor(zone, note, ctx) {
    this.zone = zone;
    this.staticLevels = {
      gainCB:
        zone.attenuate +
        (-200.0 / 960) *
          Math.log10((note.velocity * note.velocity) / (127 * 127)),
      pitch:
        note.key * 100 -
        zone.tuning -
        (zone.rootkey > -1 ? zone.rootkey : zone.sample.originalPitch) * 100 +
        Math.log2(zone.sample.sampleRate) * 1200 -
        Math.log2(ctx.sampleRate) * 1200,
      filter: zone.lpf.cutoff,
      pan: {
        left: 0.5 - zone.pan / 1000,
        right: 0.5 + zone.pan / 1000,
      },
    };
    this.iterator = zone.sampleOffsets.start;
    const ampVol = new Envelope(zone.volEnv.phases, zone.volEnv.sustain);
    const modVol = new Envelope(zone.modEnv.phases, zone.modEnv.sustain);
    this.length =
      ampVol.stages[0] + ampVol.stages[1] + ampVol.stages[2] + ampVol.stages[3];
    this.sample = zone.sample;
    modVol.effects = zone.modEnv.effects;
    const modLFO = new LFO(
      zone.modLFO.delay,
      zone.modLFO.freq,
      zone.modLFO.effects
    );
    const vibrLFO = new LFO(
      zone.modLFO.delay,
      zone.modLFO.freq,
      zone.modLFO.effects
    );
    this.run = (steps) => {
      const arates = {
        volume: centidb2gain(this.staticLevels.gainCB - ampVol.ampCB / 960),
        pitch: timecent2sec(
          this.staticLevels.pitch - (modVol.val / 960) * modVol.effects.pitch
        ),
        filter: cent2hz(
          this.staticLevels.filter +
            modVol.val * modVol.effects.filter +
            modLFO.val * modLFO.effects.filter
        ),
      };
      modLFO.shift(steps);
      modVol.shift(steps);
      vibrLFO.shift(steps);
      ampVol.shift(steps);
      return arates;
    };
    this.mods = { ampVol, modVol, modLFO, vibrLFO };
  }
  get smpl() {
    return this.sample;
  }
}
export class LFO {
  constructor(delay, freq, effects, sampleRate = 48000) {
    this.sampleRate = 48000;
    this.amount = 0;
    this.cycles = 0;
    this.sampleRate = sampleRate;
    this.delta = (4.0 * cent2hz(freq)) / sampleRate; //covering distance of 1/4 4 times per cycle..
    this.delay = delay < -12000 ? 0 : Math.pow(2, delay / 1200) * sampleRate;
    this.effects = effects;
  }
  static fromJSON(str) {
    const obj = JSON.parse(str);
    return new LFO(obj.delay, obj.freq, obj.effects);
  }
  shift(steps = 1) {
    while (steps-- > 0) {
      if (this.delay-- > 0) continue;
      this.amount += this.delta;
      if (this.amount >= 1 || this.amount <= -1) {
        this.delta = -1 * this.delta;
        this.cycles++;
      }
    }
    return this.amount;
  }
  get val() {
    return this.amount;
  }
}
export class Envelope {
  constructor(phases, sustainCB, sampleRate = 48000) {
    this.state = {
      stage: 0,
      stageStep: 0,
    };
    this.stages = [];
    this.keyOff = false;
    const { delay, attack, hold, decay, release } = phases;
    this.stages = [delay, attack, hold, decay, release]
      .map((centime) => Math.pow(2, centime / 1200) * sampleRate)
      .map((t) => Math.max(1, t));
    const amts = [0, 0, dbfs, dbfs, dbfs - sustainCB, 0];
    // const { delay, attack, hold, decay, release, done } = stagesEnum;
    this.deltas = [
      0,
      dbfs / this.stages[1],
      0,
      -sustainCB / this.stages[3],
      -dbfs / this.stages[4],
      0,
    ];
    this.ampCB = 0;
  }
  get done() {
    return this.ampCB < -10 || this.state.stage == stagesEnum.done;
  }
  get val() {
    return this.ampCB;
  }
  shift(steps) {
    if (this.state.stage === stagesEnum.done) return 0;
    while (steps > 0) {
      this.state.stageStep++;
      steps--;
      this.ampCB += this.deltas[this.state.stage];
      if (this.state.stageStep >= this.stages[this.state.stage]) {
        this.state.stage++;
        this.state.stageStep = 0;
      }
    }
  }
  get gain() {
    return Math.pow(10, (1 - this.val) / 200);
  }
  get stage() {
    return this.state.stage;
  }
  *iterator() {
    if (this.done) return 0;
    else yield this.val;
  }
  triggerRelease() {
    if (this.state.stage < stagesEnum.release) {
      this.state.stage = stagesEnum.release;
      this.state.stageStep = 0;
      this.stages[stagesEnum.release] =
        this.ampCB / this.deltas[stagesEnum.release];
    }
  }
}
