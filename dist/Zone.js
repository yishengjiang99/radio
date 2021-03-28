export class SFZone {
  constructor() {
    this.keyRange = { lo: -1, hi: 129 };
    this.velRange = { lo: -1, hi: 129 };
    this.sampleOffsets = {
      start: 0,
      end: 0,
      startLoop: 0,
      endLoop: 0,
    };
    this._modLFO = SFZone.defaultLFO;
    this._vibrLFO = SFZone.defaultLFO;
    this._modEnv = SFZone.defaultEnv;
    this._volEnv = SFZone.defaultEnv;
    this.lpf = { cutoff: 0, q: -1 };
    this.pan = -1; /* shift to right percent */
    this.attenuate = 0; /*db in attentuation*/
    this.instrumentID = -1;
    this.rootkey = -1;
    this.tuning = 0;
    this.sampleMode = 1; // LOOPMODES.CONTINUOUS_LOOP;
    this.sampleID = -1;
    this.shdr = null;
    this.generators = [];
  }
  get modLFO() {
    if (this._modLFO) {
      this._modLFO = SFZone.defaultLFO;
    }
    return this._modLFO;
  }
  set modLFO(value) {
    this._modLFO = value;
  }
  get vibrLFO() {
    return this._vibrLFO;
  }
  set vibrLFO(value) {
    this._vibrLFO = value;
  }
  get modEnv() {
    return this._modEnv;
  }
  set modEnv(value) {
    this._modEnv = value;
  }
  get volEnv() {
    if (!this._modEnv) {
      this._modEnv = SFZone.defaultEnv;
    }
    return this._volEnv;
  }
  set volEnv(value) {
    this._volEnv = value;
  }
  get pitch() {
    const rk = this.rootkey > -1 ? this.rootkey : this.sample.originalPitch;
    return rk * 100 + this.tuning + Math.log2(this.sample.sampleRate) * 1200;
  }
  set sample(shdr) {
    this.shdr = shdr;
    this.sampleOffsets.start += shdr.start;
    this.sampleOffsets.end += shdr.end;
    this.sampleOffsets.startLoop += shdr.startLoop;
    this.sampleOffsets.endLoop += shdr.endLoop;
  }
  get sample() {
    return {
      ...this.shdr,
      ...this.sampleOffsets,
    };
  }
  applyGenVal(gen, from) {
    this.generators.push(gen);
    switch (gen.opid) {
      case startAddrsOffset:
        this.sampleOffsets.start += gen.s16;
        break;
      case endAddrsOffset:
        this.sampleOffsets.end += gen.s16;
        break;
      case startloopAddrsOffset:
        this.sampleOffsets.startLoop += gen.s16;
        break;
      case endloopAddrsOffset:
        this.sampleOffsets.endLoop += gen.s16;
        break;
      case startAddrsCoarseOffset:
        this.sampleOffsets.start += 15 << gen.s16;
        break;
      case modLfoToPitch:
        this.modLFO.effects.pitch = gen.s16;
        break;
      case vibLfoToPitch:
        this.vibrLFO.effects.pitch = gen.s16;
        break;
      case modEnvToPitch:
        this.modEnv.effects.pitch = gen.s16;
        break;
      case initialFilterFc:
        this.lpf.cutoff = gen.s16;
        break;
      case initialFilterQ:
        this.lpf.q = gen.s16;
        break;
      case modLfoToFilterFc:
        this.modLFO.effects.filter = gen.s16;
        break;
      case modEnvToFilterFc:
        this.modEnv.effects.filter = gen.s16;
        break;
      case endAddrsCoarseOffset:
        this.sampleOffsets.end += 15 << gen.s16;
        break;
      case modLfoToVolume:
        this.modLFO.effects.volume = gen.s16;
        break;
      case unused1:
      case chorusEffectsSend:
        this.chorus = gen.s16;
        break;
      case reverbEffectsSend:
        this.reverbSend = gen.s16;
        break;
      case pan:
        this.pan = gen.s16;
        break;
      case unused2:
      case unused3:
      case unused4:
        break;
      case delayModLFO:
        this.modLFO.delay = gen.s16;
        break;
      case freqModLFO:
        this.modLFO.freq = gen.s16;
        break;
      case delayVibLFO:
        this.vibrLFO.delay = gen.s16;
        break;
      case freqVibLFO:
        this.vibrLFO.freq = gen.s16;
        break;
      case delayModEnv:
        this.modEnv.phases.delay = gen.s16;
        break;
      case attackModEnv:
        this.modEnv.phases.attack = gen.s16;
        break;
      case holdModEnv:
        this.modEnv.default = false;
        this.modEnv.phases.hold = gen.s16; // timecent2sec(gen.s16);
        break;
      case decayModEnv:
        this.volEnv.default = false;
        this.modEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);
        break;
      case sustainModEnv /* percent of fullscale*/:
        this.modEnv.default = false;
        this.modEnv.sustain = gen.s16;
        break;
      case releaseModEnv:
        this.modEnv.phases.release = gen.s16;
        break;
      case keynumToModEnvHold:
      case keynumToModEnvDecay:
        break;
      case delayVolEnv:
        this.volEnv.phases.delay = gen.s16;
        break;
      case attackVolEnv /*This is the time, in absolute timecents, from the end of the Volume
            Envelope Delay Time until the point at which the Volume Envelope
            value reaches its peak. Note that the attack is “convex”; the curve is
            nominally such that when applied to the decibel volume parameter, the
            result is linear in amplitude. A value of 0 indicates a 1 second attack
            time. A negative value indicates a time less than one second; a positive
            value a time longer than one second. The most negative number (-
            32768) conventionally indicates instantaneous attack. For example, an
            attack time of 10 msec would be 1200log2(.01) = -7973.*/:
        this.volEnv.phases.attack = gen.s16;
        break;
      case holdVolEnv:
        this.volEnv.phases.hold = gen.s16;
        break;
      case decayVolEnv:
        this.volEnv.default = false;
        this.volEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);
        break;
      /** \']
            
            http://www.synthfont.com/SFSPEC21.PDF  is the decrease in level, expressed in centibels, to which the
            Volume Envelope value ramps during the decay phase. For the Volume
            Envelope, the sustain level is best expressed in centibels of attenuation
            from full scale. A value of 0 indicates the sustain level is full level; this
            implies a zero duration of decay phase regardless of decay time. A
            positive value indicates a decay to the corresponding level. Values less
            than zero are to be interpreted as zero; conventionally 1000 indicates
            full attenuation. For example, a sustain level which corresponds to an
      absolute value 12dB below of peak would be 120. */
      case sustainVolEnv:
        this.volEnv.sustain = gen.s16;
        this.volEnv.default = false;
        break;
      /*This is the time, in absolute timecents, for a 100% change in the
      Volume Envelope value during release phase. For the Volume
      Envelope, the release phase linearly ramps toward zero from the current
      level, causing a constant dB change for each time unit. If the current
      level were full scale, the Volume Envelope Release Time would be the
      time spent in release phase until 100dB attenuation were reached. A
      value of 0 indicates a 1-second decay time for a release from full level.
      SoundFont 2.01 Technical Specification - Page 45 - 08/05/98 12:43 PM
      A negative value indicates a time less than one second; a positive value
      a time longer than one second.  http://www.synthfont.com/SFSPEC21.PDF For example, . For example, a release time of 10 msec
      would be 1200log2(.01) = -7973. */
      case releaseVolEnv:
        this.volEnv.phases.release = gen.s16; //timecent2sec(gen.s16);
        break;
      case keynumToVolEnvHold:
      case keynumToVolEnvDecay:
        break;
      case instrument:
        this.instrumentID = gen.s16;
        break;
      case reserved1:
        break;
      case keyRange:
        this.keyRange.lo = Math.max(gen.range.lo, this.keyRange.lo);
        this.keyRange.hi = Math.min(gen.range.hi, this.keyRange.hi);
        break;
      case velRange:
        this.velRange = gen.range;
        break;
      case startloopAddrsCoarse:
        this.sampleOffsets.startLoop += 15 << gen.s16;
        break;
      case keynum:
        break;
      case velocity:
        break;
      case initialAttenuation:
        this.attenuate = gen.s16;
        break;
      case reserved2:
        break;
      case endloopAddrsCoarse:
        this.sampleOffsets.endLoop += 15 << gen.s16;
        break;
      case coarseTune:
        this.tuning += gen.s16 * 100; //semitone
        break;
      case fineTune:
        this.tuning += gen.s16; //tone
        break;
      case sampleID:
        //onsole.log('apply sample ' + gen.s16 + 'cur ');
        if (this.sampleID != -1) {
          //throw 'applying to existing sample id';
        }
        this.sampleID = gen.s16;
        break;
      case sampleModes:
        break;
      case reserved3:
        break;
      case scaleTuning:
        break;
      case exclusiveClass:
        break;
      case overridingRootKey:
        if (gen.s16 > -1) this.rootkey = gen.s16;
        break;
      case unused5:
        break;
      case endOper:
        break;
      default:
        throw "unexpected operator";
    }
  }
}
SFZone.defaultEnv = {
  default: true,
  phases: {
    decay: -1000,
    attack: -12000,
    delay: -12000,
    release: -3000,
    hold: -12000,
  },
  sustain: 300,
  effects: { pitch: 0, filter: 0, volume: 0 },
};
SFZone.defaultLFO = {
  delay: 0,
  freq: 1,
  effects: { pitch: 0, filter: 0, volume: 0 },
};
var sf_gen_id;
(function (sf_gen_id) {
  sf_gen_id[(sf_gen_id["startAddrsOffset"] = 0)] = "startAddrsOffset";
  sf_gen_id[(sf_gen_id["endAddrsOffset"] = 1)] = "endAddrsOffset";
  sf_gen_id[(sf_gen_id["startloopAddrsOffset"] = 2)] = "startloopAddrsOffset";
  sf_gen_id[(sf_gen_id["endloopAddrsOffset"] = 3)] = "endloopAddrsOffset";
  sf_gen_id[(sf_gen_id["startAddrsCoarseOffset"] = 4)] =
    "startAddrsCoarseOffset";
  sf_gen_id[(sf_gen_id["modLfoToPitch"] = 5)] = "modLfoToPitch";
  sf_gen_id[(sf_gen_id["vibLfoToPitch"] = 6)] = "vibLfoToPitch";
  sf_gen_id[(sf_gen_id["modEnvToPitch"] = 7)] = "modEnvToPitch";
  sf_gen_id[(sf_gen_id["initialFilterFc"] = 8)] = "initialFilterFc";
  sf_gen_id[(sf_gen_id["initialFilterQ"] = 9)] = "initialFilterQ";
  sf_gen_id[(sf_gen_id["modLfoToFilterFc"] = 10)] = "modLfoToFilterFc";
  sf_gen_id[(sf_gen_id["modEnvToFilterFc"] = 11)] = "modEnvToFilterFc";
  sf_gen_id[(sf_gen_id["endAddrsCoarseOffset"] = 12)] = "endAddrsCoarseOffset";
  sf_gen_id[(sf_gen_id["modLfoToVolume"] = 13)] = "modLfoToVolume";
  sf_gen_id[(sf_gen_id["unused1"] = 14)] = "unused1";
  sf_gen_id[(sf_gen_id["chorusEffectsSend"] = 15)] = "chorusEffectsSend";
  sf_gen_id[(sf_gen_id["reverbEffectsSend"] = 16)] = "reverbEffectsSend";
  sf_gen_id[(sf_gen_id["pan"] = 17)] = "pan";
  sf_gen_id[(sf_gen_id["unused2"] = 18)] = "unused2";
  sf_gen_id[(sf_gen_id["unused3"] = 19)] = "unused3";
  sf_gen_id[(sf_gen_id["unused4"] = 20)] = "unused4";
  sf_gen_id[(sf_gen_id["delayModLFO"] = 21)] = "delayModLFO";
  sf_gen_id[(sf_gen_id["freqModLFO"] = 22)] = "freqModLFO";
  sf_gen_id[(sf_gen_id["delayVibLFO"] = 23)] = "delayVibLFO";
  sf_gen_id[(sf_gen_id["freqVibLFO"] = 24)] = "freqVibLFO";
  sf_gen_id[(sf_gen_id["delayModEnv"] = 25)] = "delayModEnv";
  sf_gen_id[(sf_gen_id["attackModEnv"] = 26)] = "attackModEnv";
  sf_gen_id[(sf_gen_id["holdModEnv"] = 27)] = "holdModEnv";
  sf_gen_id[(sf_gen_id["decayModEnv"] = 28)] = "decayModEnv";
  sf_gen_id[(sf_gen_id["sustainModEnv"] = 29)] = "sustainModEnv";
  sf_gen_id[(sf_gen_id["releaseModEnv"] = 30)] = "releaseModEnv";
  sf_gen_id[(sf_gen_id["keynumToModEnvHold"] = 31)] = "keynumToModEnvHold";
  sf_gen_id[(sf_gen_id["keynumToModEnvDecay"] = 32)] = "keynumToModEnvDecay";
  sf_gen_id[(sf_gen_id["delayVolEnv"] = 33)] = "delayVolEnv";
  sf_gen_id[(sf_gen_id["attackVolEnv"] = 34)] = "attackVolEnv";
  sf_gen_id[(sf_gen_id["holdVolEnv"] = 35)] = "holdVolEnv";
  sf_gen_id[(sf_gen_id["decayVolEnv"] = 36)] = "decayVolEnv";
  sf_gen_id[(sf_gen_id["sustainVolEnv"] = 37)] = "sustainVolEnv";
  sf_gen_id[(sf_gen_id["releaseVolEnv"] = 38)] = "releaseVolEnv";
  sf_gen_id[(sf_gen_id["keynumToVolEnvHold"] = 39)] = "keynumToVolEnvHold";
  sf_gen_id[(sf_gen_id["keynumToVolEnvDecay"] = 40)] = "keynumToVolEnvDecay";
  sf_gen_id[(sf_gen_id["instrument"] = 41)] = "instrument";
  sf_gen_id[(sf_gen_id["reserved1"] = 42)] = "reserved1";
  sf_gen_id[(sf_gen_id["keyRange"] = 43)] = "keyRange";
  sf_gen_id[(sf_gen_id["velRange"] = 44)] = "velRange";
  sf_gen_id[(sf_gen_id["startloopAddrsCoarse"] = 45)] = "startloopAddrsCoarse";
  sf_gen_id[(sf_gen_id["keynum"] = 46)] = "keynum";
  sf_gen_id[(sf_gen_id["velocity"] = 47)] = "velocity";
  sf_gen_id[(sf_gen_id["initialAttenuation"] = 48)] = "initialAttenuation";
  sf_gen_id[(sf_gen_id["reserved2"] = 49)] = "reserved2";
  sf_gen_id[(sf_gen_id["endloopAddrsCoarse"] = 50)] = "endloopAddrsCoarse";
  sf_gen_id[(sf_gen_id["coarseTune"] = 51)] = "coarseTune";
  sf_gen_id[(sf_gen_id["fineTune"] = 52)] = "fineTune";
  sf_gen_id[(sf_gen_id["sampleID"] = 53)] = "sampleID";
  sf_gen_id[(sf_gen_id["sampleModes"] = 54)] = "sampleModes";
  sf_gen_id[(sf_gen_id["reserved3"] = 55)] = "reserved3";
  sf_gen_id[(sf_gen_id["scaleTuning"] = 56)] = "scaleTuning";
  sf_gen_id[(sf_gen_id["exclusiveClass"] = 57)] = "exclusiveClass";
  sf_gen_id[(sf_gen_id["overridingRootKey"] = 58)] = "overridingRootKey";
  sf_gen_id[(sf_gen_id["unused5"] = 59)] = "unused5";
  sf_gen_id[(sf_gen_id["endOper"] = 60)] = "endOper";
})(sf_gen_id || (sf_gen_id = {}));
const {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset,
  modLfoToPitch,
  vibLfoToPitch,
  modEnvToPitch,
  initialFilterFc,
  initialFilterQ,
  modLfoToFilterFc,
  modEnvToFilterFc,
  endAddrsCoarseOffset,
  modLfoToVolume,
  unused1,
  chorusEffectsSend,
  reverbEffectsSend,
  pan,
  unused2,
  unused3,
  unused4,
  delayModLFO,
  freqModLFO,
  delayVibLFO,
  freqVibLFO,
  delayModEnv,
  attackModEnv,
  holdModEnv,
  decayModEnv,
  sustainModEnv,
  releaseModEnv,
  keynumToModEnvHold,
  keynumToModEnvDecay,
  delayVolEnv,
  attackVolEnv,
  holdVolEnv,
  decayVolEnv,
  sustainVolEnv,
  releaseVolEnv,
  keynumToVolEnvHold,
  keynumToVolEnvDecay,
  instrument,
  reserved1,
  keyRange,
  velRange,
  startloopAddrsCoarse,
  keynum,
  velocity,
  initialAttenuation,
  reserved2,
  endloopAddrsCoarse,
  coarseTune,
  fineTune,
  sampleID,
  sampleModes,
  reserved3,
  scaleTuning,
  exclusiveClass,
  overridingRootKey,
  unused5,
  endOper,
} = sf_gen_id;
