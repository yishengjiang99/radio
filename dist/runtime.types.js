export function cent2hz(centiHz) {
    return 8.176 * Math.pow(2, centiHz / 1200.0);
}
export function timecent2sec(timecent) {
    return Math.pow(2, timecent / 1200.0);
}
export function centidb2gain(centibel) {
    return Math.pow(10, centibel / 200);
}
export var LOOPMODES;
(function (LOOPMODES) {
    LOOPMODES[LOOPMODES["NO_LOOP"] = 0] = "NO_LOOP";
    LOOPMODES[LOOPMODES["CONTINUOUS_LOOP"] = 1] = "CONTINUOUS_LOOP";
    LOOPMODES[LOOPMODES["NO_LOOP_EQ"] = 2] = "NO_LOOP_EQ";
    LOOPMODES[LOOPMODES["LOOP_DURATION_PRESS"] = 3] = "LOOP_DURATION_PRESS";
})(LOOPMODES || (LOOPMODES = {}));
/**
ABSOLUTE CENTIBELS - An absolute measure of the attenuation of a signal, based on a reference of
zero being no attenuation. A centibel is a tenth of a decibel, or a ratio in signal amplitude of the two
hundredth root of 10, approximately 1.011579454.
RELATIVE CENTIBELS - A relative measure of the attenua
 */
export var EnvelopeTarget;
(function (EnvelopeTarget) {
    EnvelopeTarget[EnvelopeTarget["VOLUME"] = 0] = "VOLUME";
    EnvelopeTarget[EnvelopeTarget["PITCH"] = 1] = "PITCH";
    EnvelopeTarget[EnvelopeTarget["FILTER"] = 2] = "FILTER";
})(EnvelopeTarget || (EnvelopeTarget = {}));
export var stagesEnum;
(function (stagesEnum) {
    stagesEnum[stagesEnum["delay"] = 0] = "delay";
    stagesEnum[stagesEnum["attack"] = 1] = "attack";
    stagesEnum[stagesEnum["hold"] = 2] = "hold";
    stagesEnum[stagesEnum["decay"] = 3] = "decay";
    stagesEnum[stagesEnum["release"] = 4] = "release";
    stagesEnum[stagesEnum["done"] = 5] = "done";
})(stagesEnum || (stagesEnum = {}));
export const dbfs = 960;
