type NoteEvent = {
  midi: number;
  instrument: string;
  start: number;
  duration: number;
  trackId: number;
};
export function startEvents() {
  const HEIGHT = window.innerHeight;
  const WIDTH = window.innerWidth;
  var canvas: HTMLCanvasElement = document.createElement("canvas")!; //(elemId);
  const canvasCtx: CanvasRenderingContext2D = canvas.getContext("2d")!;
  canvas.setAttribute("width", 1 * WIDTH + "");
  canvas.setAttribute("height", 2 * HEIGHT + "");
  canvas.style.zIndex = "-3";
  canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  document.body.append(canvas);

  let svt = new EventSource("https://www.grepawk.com/bach/rt");

  svt.onopen = () => {
    // @ts-ignore
    svt.addEventListener("note", onNote);
  };

  const lookbackWindow = 70 * 256;
  let latest: number = 0;

  const convertY = (start: number): number =>
    ((start - latest) / lookbackWindow) * latest;

  //  ((latest - start) / 20) * 0xff * HEIGHT;
  const pendingNotes: NoteEvent[] = [];
  let dy = -HEIGHT;
  canvas.style.transform = `translate(0,${dy}px)`;

  const onNote = ({ data }: MessageEvent) => {
    const json = JSON.parse(data);
    pendingNotes.push({
      start: json.ticks,
      duration: json.durationTicks,
      midi: json.midi,
      instrument: json.instrument,
      trackId: json.trackId,
    });
  };

  function draw() {
    let lastCycle = latest;
    while (pendingNotes.length) {
      const newret: NoteEvent = pendingNotes.shift()!;
      if (newret.start > latest) {
        latest = newret.start;
      }
      canvasCtx.beginPath();
      canvasCtx.fillStyle = `rgba(${pallet[newret.trackId]},1)`;
      const rheight = ((newret.duration / lookbackWindow) * HEIGHT) / 3;
      canvasCtx.fillRect(
        (newret.midi / 88) * WIDTH,
        -dy - rheight,
        WIDTH / 0x7f,
        rheight
      );
      canvasCtx.stroke();
    }
    console.log(dy);
    //  canvasCtx.transform(0, 0, 0, 0, convertY(latest - lastCycle), 0);
    canvas.style.transform = `translate(0,${dy++}px)`;
    if (dy > 0) {
      dy = -HEIGHT;
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    }
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
const pallet = [
  "222, 201, 233",
  "218, 195, 232",
  "210, 183, 229",
  "193, 158, 224",
  "177, 133, 219",
  "160, 108, 213",
  "145, 99, 203",
  "129, 90, 192",
  "114, 81, 181",
  "98, 71, 170",
];
