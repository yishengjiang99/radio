/* eslint-disable react-hooks/exhaustive-deps */
import logo from "./logo.svg";
import "./App.css";
import { useState, useRef, useEffect } from "react";
type NoteEvent = {
  midi: number;
  instrument: string;
  start: number;
  duration: number;
};
const Bar: React.FC<{
  y: number;
  x: number;
  height?: number; // = 40;
  width?: number;
  fill: string;
}> = ({ x = 0, y, height = 20, width = 20, fill = "red" }) => {
  return (
    <rect
      className="App-logo"
      width={width}
      height={height}
      fill={fill}
      x={x}
    ></rect>
  );
};

let ticker = new Worker(
  URL.createObjectURL(
    new Blob(
      [
        `
        let timer;
        let t= -256;
        let _bpm = 0;
        onmessage = (e) => {
          let bpm = e.data;
          if (bpm == _bpm) return;
          if (timer) clearInterval(timer);
          timer = setInterval(() => {
            t+= 256/4;
            postMessage(t);
          }, 60000 / bpm / 4);
          _bpm = bpm;
        };
        `,
      ],
      { type: "application/javascript" }
    )
  )
);

const w = window.innerWidth;
const h = window.innerHeight;
function App() {
  const [time, setTime] = useState<number>(-5);
  const [tempo, setTempo] = useState<number>(0);
  const [notes, setNotes] = useState<NoteEvent[]>([
    {
      midi: 50,
      duration: 240,
      start: 150,
      instrument: "clarinet",
    },
  ]);
  useEffect(() => {
    ticker.onmessage = (e) => {
      requestAnimationFrame(() => setTime(e.data));
    };
  }, []);
  useEffect(() => {
    if (tempo > 1) ticker.postMessage(tempo);
  }, [tempo]);
  return (
    <div className="App-header">
      {notes.length}notes
      <span> {ticker ? "ticker defined" : "ybdned"} </span>
      <input
        type="range"
        value={tempo}
        max="280"
        min="30"
        onChange={(e) => {
          setTempo(parseInt(e.target.value));
          // ticker.postMessage()
        }}
      />
      <span key={1}>time: {time.toFixed(2)}</span>
      <span key={2}>temp: {tempo}</span>
      <svg
        key={3}
        style={{
          animation:
            tempo > 1 ? `App-logo-dx infinite  ${600 / tempo}s linear` : "",
        }}
        viewBox={`0 0 ${w} ${h}`} //"0,0,"",500"
      ></svg>
    </div>
  );
}

export default App;

export function startEvents() {
  const canvas: HTMLCanvasElement = document.createElement<HTMLCanvasElement>(
    "canvas"
  );

  let svt = new EventSource("https://www.grepawk.com/bach/rt");

  svt.onopen = () => {
    // @ts-ignore
    svt.addEventListener("note", onNote);
  };

  const activeNotes: NoteEvent[] = [];
  const lookbackWindow = 30 * 256;
  let latest: number = 0;

  const convertY = (start: number): number =>
    ((latest - start) / lookbackWindow) * h;
  const onNote = ({ data }: MessageEvent) => {
    const json = JSON.parse(data);
    latest = json.ticks;
    activeNotes.push({
      start: json.ticks,
      duration: json.durationTicks,
      midi: json.midi,
      instrument: json.instrument,
    });
  };

  function draw() {
    while (
      activeNotes.length > 0 &&
      activeNotes[0].start < latest - lookbackWindow
    )
      requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
