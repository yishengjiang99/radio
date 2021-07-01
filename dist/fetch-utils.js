export function fetchXML(url, cb) {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    if(!xhr.responseXML) return;
    if(!xhr.responseXML.documentElement) return;
    const iter= xhr.responseXML.documentElement
        .querySelectorAll("Url");
    cb(iter);
    
  };
  xhr.open("GET", url);
  xhr.responseType = "document";
  xhr.send();
}
export async function fetchAwaitBuffer(url) {
  return await (await fetch(url)).arrayBuffer();
}
export const fetchWithRange = (url, range) => {
  return fetch(url, {
    headers: {
      Range: "bytes=" + range,
    },
  });
};
