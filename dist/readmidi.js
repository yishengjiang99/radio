export const ccs = {
    1: "Modulation wheel",
    2: "Breath Control",
    7: "Volume",
    8: "balance",
    10: "Pan",
    11: "Expression",
    64: "Sustain Pedal (on/off)",
    65: " Portamento (on/off)",
    71: " Resonance (filter)",
    74: "Frequency Cutoff (filter)",
    92: "reverb",
    93: "chrous level",
    94: "detune",
    95: "phaser",
};
const sysex={
    SMPTE_OFFSET: 0x54,
		TIME_SIGNATURE: 0x58,
		KEY_SIGNATURE: 0x59,
		SEQUENCER_EVENT: 0x7f,
		SYSEX: 0xf0,
		TIME_CODE: 0xf1,
		SONG_POSITION: 0xf2,
		SONG_SELECT: 0xf3,
		TUNE_REQUEST: 0xf6,
		EOT: 0x2f,

		SYNC: 0xf8,
		TICK: 0xf9,
		START: 0xfa,
}
const program={
    done:-2,
    init:-1,
    piano:0}
export async function fetchAwaitBuffer(url) {
    return new Uint8Array(await (await fetch(url)).arrayBuffer());
}
export function readMidi(buffer, cb = function (cmd, obj, time) {
    console.log(cmd, obj, time);
}) {
    const reader = bufferReader(buffer);
    const { fgetc, offset, btoa, read32, read16, fgetnc, read24, readVarLength, fgets } = reader;
    const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
    const headerLength = read32();
    const format = read16();
    const ntracks = read16();
    const division = read16();
    let g_time = 0;
    const tracks = [];
    let microsecPerBeat = 500000;
    function readMessage(t) {
        t+=readVarLength();
        const evt=fgetc();
        switch (event) {
            case 0xff:
                meta = fgetc();
                const len = readVarLength();
                const data= fgets(len);
                return [ t, "meta", meta, len, data ];
            case 0xf7:
                return [ t, "excl", len, data ];
            case 0xf0:
                return [ t, "excl", len, data ];
            default: {
                if (event & 0x80) {
                    return [t, event>>8, fgetc(),fgetc()];            
                }else{
                    return [t, event];
                } 
            }
        }
    }
    function findMTrk(limit){
        while(true){
            if (reader.offset >limit){
                return false;
            }
            while(btoa()!= "M");
            if(btoa()!="T") 
                continue; 
            if(btoa()!="r") 
            continue;       
            
            if(btoa()!="k") continue;
            return true;
        }
        return false;
    }  
    for (let i = 0; i < ntracks; i++) {
        if(!findMTrk(buffer.byteLength)) return [];
        if (reader.offset > buffer.byteLength)
            break;
        let mtrkLength = read32();
        const events=[];
        let t=0;
        tracks[i]= {
            cc:[],
            program: 0,
            events: [],
            endTime:0,
        }
        while(reader.offset<mtrkLength){
             const [nt, event, ...info] = readMessage(t);
             tracks[i].events.push({
                 time:nt,
                 event,
                 info
             });
        }
        reader.offset = tracks[i].endofTrack
    }
    
    return {
        header:{  
            format,
            ntracks,
            division
        },
        tracks,
    }
}
function parseChannelMsg(data,onMsg) {
    const channel = data[0] & 0x0f;
    const cmd = data[0]>>8;
    data.shift();
    switch (cmd) {
      case 0x80:
        onMsg("noteOff", {
          channel: channel,
          note: data.shift() & 0x7f,
          vel: data.shift() & 0x7f,
        });
        break;
      case 0x90:
        onMsg("noteOn", {
          channel: channel,
          note: data.shift() & 0x7f,
          vel: data.shift() & 0x7f,
        });
        break;
  
      case 0xa0:
        onMsg("polyaftertouch", {
          channel: channel,
          note: data.shift() & 0x7f,
          pressure: data.shift() & 0x7f,
        });
        break;
      case 0xb0:
        onMsg("channelMode", {
          channel: channel,
          cc: data.shift() & 0x7f,
          val: data.shift() & 0x7f,
        });
        break;
      case 0xc0:
        onMsg("Program", {
          channel: channel,
          program: data.shift() & 0x7f,
        });
        break;
      case 0xe0:
        onMsg("pitchbend", {
          channel: channel,
          note: data.shift() & 0x7f,
          pressure: data.shift() & 0x7f,
        });
        break;
      default:
        break;
    }
}
export function bufferReader(buffer) {
    let _offset = 0, eos = false;
    const EOS = "OES";
    let _buf = [buffer];
    let bl = buffer.byteLength;
    const fgetc = () => {
        if(_offset>bl+10000){
            throw "sigterm";
        }
        const ret = _buf[0][_offset];
        _offset++;
        
        return ret;
    };
    const btoa = () => String.fromCharCode(fgetc());
    const read32 = () => (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
    const read16 = () => (fgetc() << 8) | fgetc();
    const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
    const fgets = (n) => {
        let s = "";
        while (n-- > 0)
            s += btoa();
        return s;
    };
    const fgetnc = (n) => n > 1 ? [fgetc(), ...fgetnc(n - 1)] : [fgetc()];
    const readVarLength = () => {
        let v = 0;
        let n = fgetc();
        v = n & 0x7f;
        while (n & 0x80) {
            n = fgetc();
            v = (v << 7) | (n & 0x7f);
        }
        return v;
    };
    return {
        pump: (ab) => {
            _buf.push(ab);
        },
        get offset() {
            return _offset;
        },
        set offset(offset) {
            _offset = offset;
        },
        fgetc,
        btoa,
        read32,
        read16,
        read24,
        fgetnc,
        readVarLength,
        fgets,
    };
}
function checkeos(_offset, bl, _buf, eos) {
    if (_offset > bl) {
        _buf.shift();
        if (_buf[0]) {
            bl = _buf[0].length;
        }
        else {
            eos = true;
        }
    }
    return { bl, eos };
}
