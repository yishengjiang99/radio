export const BoxCanvas = (containerElement = document.body) => {
    function getInstance() {
        const existing = document.querySelector("canvas#BoxCanvas");
        if (existing)
            return existing;
        const can = document.createElement("canvas#BoxCanvas");
        containerElement.append(can);
        return can;
    }
    const canvas = getInstance();
    const ctgx = canvas.getContext("2d");
    canvas.style.width = 1024;
    canvas.style.height = 1024;
    canvas.style.position = "absolute";
    canvas.style.top = "50%";
    canvas.style.left = "50%";
    canvas.style.transform = "translate(-50%,-50%)";
    canvas.setAttribute("width", 1024);
    canvas.setAttribute("height", 1024);
    const cells = 16 * 88;
    const gridw = 1024 / 88;
    const gridh = 1024 / 16;
    ctgx.lineWidth = 1;
    ctgx.strokeStyle = "grey";
    ctgx.clearRect(0, 0, 1024, 1024);
    ctgx.fillRect(0, 0, 1024, 1024);
    return {
        drawBox: (x, y) => {
            ctgx.beginPath();
            ctgx.fillStyle = "red";
            ctgx.rect(obj.note * gridw, obj.channel * gridh, gridw, gridh);
            ctgx.stroke();
            ctgx.fill();
        },
        clearBox: (x, y) => {
            ctgx.clearRect(obj.note * gridw, obj.channel * gridh, gridw, gridh);
            ctgx.fillStyle = "black";
            ctgx.rect(obj.note * gridw, obj.channel * gridh, gridw, gridh);
            ctgx.stroke();
            ctgx.fill();
        },
    };
};
