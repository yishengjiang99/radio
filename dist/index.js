import { fetchSoundFont } from "./readsf.js";
import { readMidi } from "./readmidi.js";
import { fetchAwaitBuffer, fetchXML } from "./fetch-utils.js";
import { BoxCanvas } from "./canvas.js";
import { RenderCtx } from "./render-ctx.js";
// @ts-ignore
const containerbase = "https://dsp.grepawk.com/radio";
const [sfselect, midselect] = document.body.querySelectorAll("select");

const sf2url = containerbase + "/sf2?resttype=container&comp=list";
const midiurl = containerbase + "/midi.xml";
fetchXML(midiurl, midselect);
midselect.onchange = () => loadMidi(midselect.value);

async function loadMidi(url) {
  const canvas = BoxCanvas();
  const ab = await fetchAwaitBuffer(url);
  const midi_chan_vol_cc = 7;
  const midi_mast_vol_cc = 11;
  readMidi(new Uint8Array(ab), (cmd, obj) => {
    switch (cmd) {
      case "noteOn":
        rend_ctx && rend_ctx.keyOn(obj.note, obj.vel, obj.channel);
        requestAnimationFrame(() => {
          canvas.drawBox(obj.note, obj.channel);
        });
        break;
      case "noteOff":
        rend_ctx && rend_ctx.keyOff(obj.channel);
        requestAnimationFrame(() => {
          canvas.clearBox(obj.note, obj.channel);
        });
        break;
      case "Program":
        rend_ctx.programs[obj.channel].presetId = obj.program;
        break;
      case "channelMode":
        switch (obj.cc) {
          case midi_chan_vol_cc:
            rend_ctx.chanVols[obj.channel] = obj.val;
            break;
          case midi_mast_vol_cc:
            rend_ctx.masterVol = obj.val; //[obj.channel] = obj.val;
            break;
          default:
            console.log(obj.cc, obj.val);
        }
        break;
      default:
        console.log(cmd, obj);
        break;
    }
  });
}
