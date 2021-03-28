export function fetchXML(url, target) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        xhr.responseXML.documentElement
            .querySelectorAll("Url")
            .forEach((elem) => target.appendChild(new Option(elem.textContent.split("/").pop(), elem.textContent)));
    };
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
}
