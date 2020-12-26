let timer: any;
let _bpm = 0;
onmessage = (e) => {
  let bpm = e.data;
  if (bpm == _bpm) return;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    postMessage("tick");
  }, 60000 / bpm / 4);
  _bpm = bpm;
};
