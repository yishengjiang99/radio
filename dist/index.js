import { fetchSoundFont } from "./readsf.js";
import { readMidi } from "./readmidi.js";
import { fetchAwaitBuffer, fetchXML } from "./fetch-utils.js";
import { BoxCanvas } from "./canvas.js";
import {playPauseTimer}from'./runclock.js';//.js
import {logdiv} from './mkdiv.js';

// @ts-ignore
const containerbase = "https://grep32bit.blob.core.windows.net";
const [sfselect, midselect] = document.body.querySelectorAll("select");

const sf2url = containerbase + "/sf2?resttype=container&comp=list";
const midiurl =
  "https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list";
let midlist = [];

//state vars;
let nowplaying = {
  tracks: [],
  header:null
}

fetchXML(midiurl, (list) => {
  list.forEach((elem, idx) => {
    midselect.appendChild(
      new Option(elem.textContent.split("/").pop(), elem.textContent)
    );
    midlist.push(elem.textContent);
    if (idx == 0) {
      loadMidi(midlist[0]);
    }
  });
});
midselect.onchange = () => {
  const {header,tracks} = loadMidi(midselect.value);
  main.append(tracks.map((t,idx)=>
    t.events.slice(0,4).map(({time, type })=>`${time}:${type}`).join("\n")
  ).map(tinfo=>`<div>${tinfo}</div>`).join(""));
}
async function loadMidi(url) {
  const canvas = BoxCanvas();
  const ab = await fetchAwaitBuffer(url);
  const midi_chan_vol_cc = 7;
  const midi_mast_vol_cc = 11;
  const {header, tracks} = readMidi(new Uint8Array(ab), (cmd, obj) => {
   stdout(cmd + JSON.stringify(obj));
   switch (cmd) {
     case "noteOn":
             //  rend_ctx && rend_ctx.keyOn(obj.note, obj.vel, obj.channel);
       if(obj.vel==0){
        requestAnimationFrame(() => {
          canvas.clearBox(obj.note, obj.channel);
        });

       }else{
        requestAnimationFrame(() => {
          canvas.drawBox(obj.note, obj.channel);
        });
       }
      

       break;
     case "noteOff":
       //rend_ctx && rend_ctx.keyOff(obj.channel);
       requestAnimationFrame(() => {
         canvas.clearBox(obj.note, obj.channel);
       });
       break;
     case "Program":
          // rend_ctx.programs[obj.channel].presetId = obj.program;
       break;
     case "channelMode":
       switch (obj.cc) {
         case midi_chan_vol_cc:
        //  rend_ctx.chanVols[obj.channel] = obj.val;
           break;
         case midi_mast_vol_cc:
          // rend_ctx.masterVol = obj.val; //[obj.channel] = obj.val;
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
playPauseTimer((t)=>{
  nowplaying.tracks.map(t=>{
    if(t.events[0] && t.events[0].time<t+.20){
      console.log('fire off', t.events.shift()) ;
    }
  });
});

const {
  stderr,
  stdout,
  infoPanel,
  errPanel,
}=logdiv();
document.body.append(infoPanel);
document.body.append(errPanel);