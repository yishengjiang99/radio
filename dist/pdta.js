import { SFZone } from "./Zone.js";
import { readAB } from "./arraybuffer-reader.js";
const sampleId_gen = 53;
const ShdrLength = 46;
const imodLength = 10;
const phdrLength = 38;
const pbagLength = 4;
const pgenLength = 4,
  igenLength = 4;
const pmodLength = 10;
const instLength = 22;
export class PDTA {
  constructor(data) {
    this.phdr = [];
    this.pbag = [];
    this.pgen = [];
    this.pmod = [];
    this.iheaders = [];
    this.igen = [];
    this.imod = [];
    this.ibag = [];
    this.shdr = [];
    this.cache = new Map();
    let n = 0;
    const r = readAB(data);
    r.getStr(4);
    do {
      const sectionName = r.getStr(4);
      const sectionSize = r.getUint32();
      switch (sectionName) {
        case "phdr":
          for (let i = 0; i < sectionSize; i += phdrLength) {
            this.phdr.push({
              name: r.getStr(20),
              presetId: r.getU16(),
              bankId: r.getU16(),
              pbagIndex: r.getU16(),
              misc: [r.getUint32(), r.getUint32(), r.getUint32()],
              pbags: [],
              defaultBag: -1,
              insts: [],
            });
          }
          break;
        case "pbag":
          for (let i = 0; i < sectionSize; i += pbagLength) {
            this.pbag.push({
              pgen_id: r.getU16(),
              pmod_id: r.getU16(),
              pzone: new SFZone(),
            });
          }
          break;
        case "pgen":
          let pgenId = 0,
            pbagId = 0,
            phdrId = 0;
          for (; pgenId < sectionSize / pgenLength; pgenId++) {
            const opid = r.getChar();
            r.getChar();
            const v = r.getS16();
            const pg = {
              opid,
              s16: v,
              range: { lo: v & 0xff, hi: (v >> 8) & 0x7f },
            };
            this.pgen.push(pg);
            if (pg.opid == 60) break;
            this.pbag[pbagId].pzone.applyGenVal(pg);
            if (
              this.pbag[pbagId + 1] &&
              pgenId >= this.pbag[pbagId + 1].pgen_id - 1
            ) {
              if (pbagId >= this.phdr[phdrId + 1].pbagIndex) {
                phdrId++;
              }
              if (this.pbag[pbagId].pzone.instrumentID == -1) {
                if (this.phdr[phdrId].defaultBag == -1)
                  this.phdr[phdrId].defaultBag = pbagId;
              } else {
                this.phdr[phdrId].pbags.push(pbagId);
                this.phdr[phdrId].insts.push(
                  this.pbag[pbagId].pzone.instrumentID
                );
              }
              pbagId++;
            }
          }
          break;
        case "pmod":
          for (let i = 0; i < sectionSize; i += pmodLength) {
            this.pmod.push({
              src: r.getU16(),
              dest: r.getU16(),
              amt: r.getU16(),
              amtSrc: r.getU16(),
              transpose: r.getU16(),
            });
          }
          break;
        case "inst":
          for (let i = 0; i < sectionSize; i += instLength) {
            this.iheaders.push({
              name: r.getStr(20),
              iBagIndex: r.getU16(),
              ibags: [],
              defaultIbag: -1,
            });
          }
          break;
        case "ibag":
          for (let i = 0; i < sectionSize; i += pbagLength) {
            this.ibag.push({
              igen_id: r.getU16(),
              imod_id: r.getU16(),
              izone: new SFZone(),
            });
          }
          break;
        case "igen":
          let ibagId = 0;
          let instId = 0;
          for (let igenId = 0; igenId < sectionSize / igenLength; igenId++) {
            const opid = r.getChar() | (r.getChar() << 8);
            const v = r.getS16();
            const gen = {
              opid,
              s16: v,
              range: { lo: v & 0xff, hi: (v >> 8) & 0x7f },
            };
            this.igen.push(gen);
            if (gen.opid === 60) break;
            this.ibag[ibagId].izone.applyGenVal(gen);
            if (igenId >= this.ibag[ibagId + 1]?.igen_id - 1) {
              if (ibagId >= this.iheaders[instId + 1]?.iBagIndex) {
                instId++;
              }
              this.iheaders[instId].ibags.push(ibagId);
              this.ibag[ibagId].izone.instrumentID = instId;
              if (this.ibag[ibagId].izone.sampleID == -1) {
                if (this.iheaders[instId].defaultIbag == -1)
                  this.iheaders[instId].defaultIbag = ibagId;
              }
              ibagId++;
            }
          }
          break;
        case "imod":
          for (let i = 0; i < sectionSize; i += imodLength) {
            this.imod.push({
              src: r.getU16(),
              dest: r.getU16(),
              amt: r.getU16(),
              amtSrc: r.getU16(),
              transpose: r.getU16(),
            });
          }
          break;
        case "shdr":
          for (
            let i = 0;
            i < sectionSize;
            i += ShdrLength ///20 + 4 * 5 + 1 + 1 + 4)
          ) {
            this.shdr.push({
              name: r.getStr(20),
              start: r.getUint32(),
              end: r.getUint32(),
              startLoop: r.getUint32(),
              endLoop: r.getUint32(),
              sampleRate: r.getUint32(),
              originalPitch: r.getChar(),
              pitchCorrection: r.getChar(),
              sampleLink: r.getU16(),
              sampleType: r.getU16(),
            });
          }
          break;
        default:
          break;
      }
    } while (n++ <= 9);
    this.phdr.forEach((phead) => {
      phead.ibagSet = new Set();
      phead.insts.forEach((instId) => {
        this.iheaders[instId].ibags.forEach((ibagId) =>
          phead.ibagSet.add(ibagId)
        );
      });
    });
  }
  findPreset(pid, bank_id = 0, key = -1, vel = -1) {
    const { phdr, igen, ibag, iheaders, pbag, pgen, shdr } = this;

    const phead = phdr.filter(
      (p) => p.bankId == bank_id && p.presetId == pid
    )[0];
    const ibags = Array.from(phead.ibagSet.values())
      .map((ibagId) => ibag[ibagId])
      .filter(
        (ibg) =>
          ibg.keyRange.lo <= key &&
          ibg.keyRange.hi >= key &&
          ibg.velRange.lo <= vel &&
          ibg.velRange.hi >= vel
      );
    const pbags = phead.pbags
      .map((pbagId) => {
        pbag[pbagId];
      })
      .filter(
        (pbg) =>
          pbg.keyRange.lo <= key &&
          pbg.keyRange.hi >= key &&
          pbg.velRange.lo <= vel &&
          pbg.velRange.hi >= vel
      );

    return [pbags, ibags];
  }
  getZone(pid, bank_id = 0) {
    const mashKey = Symbol(pid + "" + (bank_id << 7));
    if (this.cache.has(mashKey)) return this.cache.get(mashKey);
    let presets = [];
    const { phdr, igen, ibag, iheaders, pbag, pgen, shdr } = this;
    for (let i = 0; i < this.phdr.length - 1; i++) {
      if (phdr[i].presetId != pid || phdr[i].bankId != bank_id) continue;
      phdr[i].insts.map((instId) => {
        iheaders[instId].ibags.map((ibagIdx) => {
          presets.push(this.ibag[ibagIdx].izone);
        });
      });
    }
    this.cache.set(mashKey, presets);
    return presets;
  }
}
