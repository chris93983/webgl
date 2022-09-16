class XBROptions {
    constructor(blendColors = true, scaleAlpha = false) {
        this.blendColors = blendColors;
        this.scaleAlpha = scaleAlpha;
    }
}
const USE_3X_ORIGINAL_IMPLEMENTATION = false;
const [REDMASK, GREENMASK, BLUEMASK, ALPHAMASK, THRESHHOLD_Y, THRESHHOLD_U, THRESHHOLD_V] = [0x000000FF, 0x0000FF00, 0x00FF0000, 0xFF000000, 48, 7, 6];
// Convert an ARGB byte to YUV
const getYuv = (p) => {
    const [r, g, b] = [p & REDMASK, (p & GREENMASK) >> 8, (p & BLUEMASK) >> 16];
    const [y, u, v] = [
        r * .299000 + g * .587000 + b * .114000,
        r * -.168736 + g * -.331264 + b * .500000,
        r * .500000 + g * -.418688 + b * -.081312,
    ];
    return [y, u, v];
};
const yuvDifference = (A, B, scaleAlpha = false) => {
    const [alphaA, alphaB] = [((A & ALPHAMASK) >> 24) & 0xff, ((B & ALPHAMASK) >> 24) & 0xff];
    if (alphaA === 0 && alphaB === 0) {
        return 0;
    }
    if (!scaleAlpha && (alphaA < 255 || alphaB < 255)) {
        // Very large value not attainable by the thresholds
        return 1000000;
    }
    if (alphaA === 0 || alphaB === 0) {
        // Very large value not attainable by the thresholds
        return 1000000;
    }
    const [yuvA, yuvB] = [getYuv(A), getYuv(B)];
    /*Add HQx filters threshold & return*/
    return Math.abs(yuvA[0] - yuvB[0]) * THRESHHOLD_Y
        + Math.abs(yuvA[1] - yuvB[1]) * THRESHHOLD_U
        + Math.abs(yuvA[2] - yuvB[2]) * THRESHHOLD_V;
};
const isEqual = (A, B, scaleAlpha = false) => {
    const [alphaA, alphaB] = [((A & ALPHAMASK) >> 24) & 0xff, ((B & ALPHAMASK) >> 24) & 0xff];
    if (alphaA === 0 && alphaB === 0) {
        return true;
    }
    if (!scaleAlpha && (alphaA < 255 || alphaB < 255)) {
        return false;
    }
    if (alphaA === 0 || alphaB === 0) {
        return false;
    }
    const [yuvA, yuvB] = [getYuv(A), getYuv(B)];
    if (Math.abs(yuvA[0] - yuvB[0]) > THRESHHOLD_Y) {
        return false;
    }
    if (Math.abs(yuvA[1] - yuvB[1]) > THRESHHOLD_U) {
        return false;
    }
    if (Math.abs(yuvA[2] - yuvB[2]) > THRESHHOLD_V) {
        return false;
    }
    return true;
};
const pixelInterpolate = (A, B, q1, q2) => {
    const [alphaA, alphaB] = [((A & ALPHAMASK) >> 24) & 0xff, ((B & ALPHAMASK) >> 24) & 0xff];
    /*Extract each value from 32bit Uint & blend colors together*/
    let r, g, b, a;
    if (alphaA === 0) {
        r = B & REDMASK;
        g = (B & GREENMASK) >> 8;
        b = (B & BLUEMASK) >> 16;
    }
    else if (alphaB === 0) {
        r = A & REDMASK;
        g = (A & GREENMASK) >> 8;
        b = (A & BLUEMASK) >> 16;
    }
    else {
        r = (q2 * (B & REDMASK) + q1 * (A & REDMASK)) / (q1 + q2);
        g = (q2 * ((B & GREENMASK) >> 8) + q1 * ((A & GREENMASK) >> 8)) / (q1 + q2);
        b = (q2 * ((B & BLUEMASK) >> 16) + q1 * ((A & BLUEMASK) >> 16)) / (q1 + q2);
    }
    a = (q2 * alphaB + q1 * alphaA) / (q1 + q2);
    /*The bit hack '~~' is used to floor the values like Math.floor, but faster*/
    return ((~~r) | ((~~g) << 8) | ((~~b) << 16) | ((~~a) << 24));
};
const getRelatedPoints = (input, x, y, width, height) => {
    const xm1 = Math.max(x - 1, 0);
    const xm2 = Math.max(x - 2, 0);
    const ym1 = Math.max(y - 1, 0);
    const ym2 = Math.max(y - 2, 0);
    const xp1 = Math.min(x + 1, width - 1);
    const xp2 = Math.min(x + 2, width - 1);
    const yp1 = Math.min(y + 1, height - 1);
    const yp2 = Math.min(y + 2, height - 1);
    return [
        input[xm1 + ym2 * width],
        input[x + ym2 * width],
        input[xp1 + ym2 * width],
        input[xm2 + ym1 * width],
        input[xm1 + ym1 * width],
        input[x + ym1 * width],
        input[xp1 + ym1 * width],
        input[xp2 + ym1 * width],
        input[xm2 + y * width],
        input[xm1 + y * width],
        input[x + y * width],
        input[xp1 + y * width],
        input[xp2 + y * width],
        input[xm2 + yp1 * width],
        input[xm1 + yp1 * width],
        input[x + yp1 * width],
        input[xp1 + yp1 * width],
        input[xp2 + yp1 * width],
        input[xm1 + yp2 * width],
        input[x + yp2 * width],
        input[xp1 + yp2 * width] /* i5 */
    ];
};
// This is the XBR2x by Hyllian (see http://board.byuu.org/viewtopic.php?f=10&t=2248)
const computeXbr2x = (input, oriX, oriY, oriW, oriH, output, dstX, dstY, dstW, options) => {
    const [a1, b1, c1, a0, pa, pb, pc, c4, d0, pd, pe, pf, f4, g0, pg, ph, pi, i4, g5, h5, i5,] = getRelatedPoints(input, oriX, oriY, oriW, oriH);
    let [e0, e1, e2, e3] = new Array(4).fill(pe);
    [e1, e2, e3] = kernel2Xv5(pe, pi, ph, pf, pg, pc, pd, pb, f4, i4, h5, i5, e1, e2, e3, options);
    [e0, e3, e1] = kernel2Xv5(pe, pc, pf, pb, pi, pa, ph, pd, b1, c1, f4, c4, e0, e3, e1, options);
    [e2, e1, e0] = kernel2Xv5(pe, pa, pb, pd, pc, pg, pf, ph, d0, a0, b1, a1, e2, e1, e0, options);
    [e3, e0, e2] = kernel2Xv5(pe, pg, pd, ph, pa, pi, pb, pf, h5, g5, d0, g0, e3, e0, e2, options);
    output[dstX + dstY * dstW] = e0;
    output[dstX + 1 + dstY * dstW] = e1;
    output[dstX + (dstY + 1) * dstW] = e2;
    output[dstX + 1 + (dstY + 1) * dstW] = e3;
};
const computeXbr3x = (input, oriX, oriY, oriW, oriH, output, dstX, dstY, dstW, options) => {
    const [a1, b1, c1, a0, pa, pb, pc, c4, d0, pd, pe, pf, f4, g0, pg, ph, pi, i4, g5, h5, i5,] = getRelatedPoints(input, oriX, oriY, oriW, oriH);
    let [e0, e1, e2, e3, e4, e5, e6, e7, e8] = new Array(9).fill(pe);
    [e2, e5, e6, e7, e8] = kernel3X(pe, pi, ph, pf, pg, pc, pd, pb, f4, i4, h5, i5, e2, e5, e6, e7, e8, options);
    [e0, e1, e8, e5, e2] = kernel3X(pe, pc, pf, pb, pi, pa, ph, pd, b1, c1, f4, c4, e0, e1, e8, e5, e2, options);
    [e6, e3, e2, e1, e0] = kernel3X(pe, pa, pb, pd, pc, pg, pf, ph, d0, a0, b1, a1, e6, e3, e2, e1, e0, options);
    [e8, e7, e0, e3, e6] = kernel3X(pe, pg, pd, ph, pa, pi, pb, pf, h5, g5, d0, g0, e8, e7, e0, e3, e6, options);
    output[dstX + dstY * dstW] = e0;
    output[dstX + 1 + dstY * dstW] = e1;
    output[dstX + 2 + dstY * dstW] = e2;
    output[dstX + (dstY + 1) * dstW] = e3;
    output[dstX + 1 + (dstY + 1) * dstW] = e4;
    output[dstX + 2 + (dstY + 1) * dstW] = e5;
    output[dstX + (dstY + 2) * dstW] = e6;
    output[dstX + 1 + (dstY + 2) * dstW] = e7;
    output[dstX + 2 + (dstY + 2) * dstW] = e8;
};
const computeXbr4x = (input, oriX, oriY, oriW, oriH, output, dstX, dstY, dstW, options) => {
    const [a1, b1, c1, a0, pa, pb, pc, c4, d0, pd, pe, pf, f4, g0, pg, ph, pi, i4, g5, h5, i5,] = getRelatedPoints(input, oriX, oriY, oriW, oriH);
    let [e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, ea, eb, ec, ed, ee, ef] = new Array(16).fill(pe);
    [ef, ee, eb, e3, e7, ea, ed, ec] = kernel4Xv2(pe, pi, ph, pf, pg, pc, pd, pb, f4, i4, h5, i5, ef, ee, eb, e3, e7, ea, ed, ec, options);
    [e3, e7, e2, e0, e1, e6, eb, ef] = kernel4Xv2(pe, pc, pf, pb, pi, pa, ph, pd, b1, c1, f4, c4, e3, e7, e2, e0, e1, e6, eb, ef, options);
    [e0, e1, e4, ec, e8, e5, e2, e3] = kernel4Xv2(pe, pa, pb, pd, pc, pg, pf, ph, d0, a0, b1, a1, e0, e1, e4, ec, e8, e5, e2, e3, options);
    [ec, e8, ed, ef, ee, e9, e4, e0] = kernel4Xv2(pe, pg, pd, ph, pa, pi, pb, pf, h5, g5, d0, g0, ec, e8, ed, ef, ee, e9, e4, e0, options);
    output[dstX + dstY * dstW] = e0;
    output[dstX + 1 + dstY * dstW] = e1;
    output[dstX + 2 + dstY * dstW] = e2;
    output[dstX + 3 + dstY * dstW] = e3;
    output[dstX + (dstY + 1) * dstW] = e4;
    output[dstX + 1 + (dstY + 1) * dstW] = e5;
    output[dstX + 2 + (dstY + 1) * dstW] = e6;
    output[dstX + 3 + (dstY + 1) * dstW] = e7;
    output[dstX + (dstY + 2) * dstW] = e8;
    output[dstX + 1 + (dstY + 2) * dstW] = e9;
    output[dstX + 2 + (dstY + 2) * dstW] = ea;
    output[dstX + 3 + (dstY + 2) * dstW] = eb;
    output[dstX + (dstY + 3) * dstW] = ec;
    output[dstX + 1 + (dstY + 3) * dstW] = ed;
    output[dstX + 2 + (dstY + 3) * dstW] = ee;
    output[dstX + 3 + (dstY + 3) * dstW] = ef;
};
const alphaBlend32W = (dst, src, blendColors) => blendColors ? pixelInterpolate(dst, src, 7, 1) : dst;
const alphaBlend64W = (dst, src, blendColors) => blendColors ? pixelInterpolate(dst, src, 3, 1) : dst;
const alphaBlend128W = (dst, src, blendColors) => blendColors ? pixelInterpolate(dst, src, 1, 1) : dst;
const alphaBlend192W = (dst, src, blendColors) => blendColors ? pixelInterpolate(dst, src, 1, 3) : src;
const alphaBlend224W = (dst, src, blendColors) => blendColors ? pixelInterpolate(dst, src, 1, 7) : src;
const leftUp2_2X = (n3, n2, pixel, blendColors) => {
    const blendedN2 = alphaBlend64W(n2, pixel, blendColors);
    return [alphaBlend224W(n3, pixel, blendColors), blendedN2, blendedN2];
};
const left2_2X = (n3, n2, pixel, blendColors) => [alphaBlend192W(n3, pixel, blendColors), alphaBlend64W(n2, pixel, blendColors)];
const up2_2X = (n3, n1, pixel, blendColors) => [alphaBlend192W(n3, pixel, blendColors), alphaBlend64W(n1, pixel, blendColors)];
const dia_2X = (n3, pixel, blendColors) => alphaBlend128W(n3, pixel, blendColors);
const kernel2Xv5 = (pe, pi, ph, pf, pg, pc, pd, pb, f4, i4, h5, i5, n1, n2, n3, options) => {
    let ex = (pe !== ph && pe !== pf);
    if (!ex) {
        return [n1, n2, n3];
    }
    const { scaleAlpha, blendColors } = options;
    let e = (yuvDifference(pe, pc, scaleAlpha) + yuvDifference(pe, pg, scaleAlpha) + yuvDifference(pi, h5, scaleAlpha) + yuvDifference(pi, f4, scaleAlpha)) + (yuvDifference(ph, pf) << 2), i = (yuvDifference(ph, pd, scaleAlpha) + yuvDifference(ph, i5, scaleAlpha) + yuvDifference(pf, i4, scaleAlpha) + yuvDifference(pf, pb, scaleAlpha)) + (yuvDifference(pe, pi, scaleAlpha) << 2), px = (yuvDifference(pe, pf, scaleAlpha) <= yuvDifference(pe, ph, scaleAlpha)) ? pf : ph;
    if ((e < i) && (!isEqual(pf, pb, scaleAlpha) && !isEqual(ph, pd, scaleAlpha) || isEqual(pe, pi, scaleAlpha) && (!isEqual(pf, i4, scaleAlpha) && !isEqual(ph, i5, scaleAlpha)) || isEqual(pe, pg, scaleAlpha) || isEqual(pe, pc, scaleAlpha))) {
        let ke = yuvDifference(pf, pg, scaleAlpha), ki = yuvDifference(ph, pc, scaleAlpha), ex2 = (pe !== pc && pb !== pc), ex3 = (pe !== pg && pd !== pg);
        if (((ke << 1) <= ki) && ex3 || (ke >= (ki << 1)) && ex2) {
            if (((ke << 1) <= ki) && ex3) {
                let leftOut = left2_2X(n3, n2, px, blendColors);
                n3 = leftOut[0];
                n2 = leftOut[1];
            }
            if ((ke >= (ki << 1)) && ex2) {
                let upOut = up2_2X(n3, n1, px, blendColors);
                n3 = upOut[0];
                n1 = upOut[1];
            }
        }
        else {
            n3 = dia_2X(n3, px, blendColors);
        }
    }
    else if (e <= i) {
        n3 = alphaBlend64W(n3, px, blendColors);
    }
    return [n1, n2, n3];
};
const leftUp2_3X = (n7, n5, n6, n2, n8, pixel, blendColors) => {
    const [blendedN7, blendedN6] = [alphaBlend192W(n7, pixel, blendColors), alphaBlend64W(n6, pixel, blendColors)];
    return [blendedN7, blendedN7, blendedN6, blendedN6, pixel];
};
const left2_3X = (n7, n5, n6, n8, pixel, blendColors) => {
    return [alphaBlend192W(n7, pixel, blendColors), alphaBlend64W(n5, pixel, blendColors), alphaBlend64W(n6, pixel, blendColors), pixel];
};
const up2_3X = (n5, n7, n2, n8, pixel, blendColors) => {
    return [alphaBlend192W(n5, pixel, blendColors), alphaBlend64W(n7, pixel, blendColors), alphaBlend64W(n2, pixel, blendColors), pixel];
};
const dia_3X = (n8, n5, n7, pixel, blendColors) => {
    return [alphaBlend224W(n8, pixel, blendColors), alphaBlend32W(n5, pixel, blendColors), alphaBlend32W(n7, pixel, blendColors)];
};
const kernel3X = (pe, pi, ph, pf, pg, pc, pd, pb, f4, i4, h5, i5, n2, n5, n6, n7, n8, options) => {
    const ex = (pe !== ph && pe !== pf);
    if (!ex) {
        return [n2, n5, n6, n7, n8];
    }
    const { scaleAlpha, blendColors } = options;
    const e = (yuvDifference(pe, pc, scaleAlpha) + yuvDifference(pe, pg, scaleAlpha) + yuvDifference(pi, h5, scaleAlpha) + yuvDifference(pi, f4, scaleAlpha)) + (yuvDifference(ph, pf, scaleAlpha) << 2);
    const i = (yuvDifference(ph, pd, scaleAlpha) + yuvDifference(ph, i5, scaleAlpha) + yuvDifference(pf, i4, scaleAlpha) + yuvDifference(pf, pb, scaleAlpha)) + (yuvDifference(pe, pi, scaleAlpha) << 2);
    let state;
    if (USE_3X_ORIGINAL_IMPLEMENTATION) {
        state = ((e < i) && (!isEqual(pf, pb, scaleAlpha) && !isEqual(ph, pd, scaleAlpha) || isEqual(pe, pi, scaleAlpha) && (!isEqual(pf, i4, scaleAlpha) && !isEqual(ph, i5, scaleAlpha)) || isEqual(pe, pg, scaleAlpha) || isEqual(pe, pc, scaleAlpha)));
    }
    else {
        state = ((e < i) && (!isEqual(pf, pb, scaleAlpha) && !isEqual(pf, pc, scaleAlpha) || !isEqual(ph, pd, scaleAlpha) && !isEqual(ph, pg, scaleAlpha) || isEqual(pe, pi, scaleAlpha) && (!isEqual(pf, f4, scaleAlpha) && !isEqual(pf, i4, scaleAlpha) || !isEqual(ph, h5, scaleAlpha) && !isEqual(ph, i5, scaleAlpha)) || isEqual(pe, pg, scaleAlpha) || isEqual(pe, pc, scaleAlpha)));
    }
    if (state) {
        const [ke, ki] = [yuvDifference(pf, pg, scaleAlpha), yuvDifference(ph, pc, scaleAlpha)];
        const [ex2, ex3] = [pe !== pc && pb !== pc, pe !== pg && pd !== pg];
        const px = (yuvDifference(pe, pf, scaleAlpha) <= yuvDifference(pe, ph, scaleAlpha)) ? pf : ph;
        if (((ke << 1) <= ki) && ex3 && (ke >= (ki << 1)) && ex2) {
            [n7, n5, n6, n2, n8] = leftUp2_3X(n7, n5, n6, n2, n8, px, blendColors);
        }
        else if (((ke << 1) <= ki) && ex3) {
            [n7, n5, n6, n8] = left2_3X(n7, n5, n6, n8, px, blendColors);
        }
        else if ((ke >= (ki << 1)) && ex2) {
            [n5, n7, n2, n8] = up2_3X(n5, n7, n2, n8, px, blendColors);
        }
        else {
            [n8, n5, n7] = dia_3X(n8, n5, n7, px, blendColors);
        }
    }
    else if (e <= i) {
        n8 = alphaBlend128W(n8, ((yuvDifference(pe, pf, scaleAlpha) <= yuvDifference(pe, ph, scaleAlpha)) ? pf : ph), blendColors);
    }
    return [n2, n5, n6, n7, n8];
};
// 4xBR
const leftUp2 = (n15, n14, n11, n13, n12, n10, n7, n3, pixel, blendColors) => {
    const blendedN13 = alphaBlend192W(n13, pixel, blendColors), blendedN12 = alphaBlend64W(n12, pixel, blendColors);
    return [pixel, pixel, pixel, blendedN12, blendedN12, blendedN12, blendedN13, n3];
};
const left2 = (n15, n14, n11, n13, n12, n10, pixel, blendColors) => {
    return [
        pixel,
        pixel,
        alphaBlend192W(n11, pixel, blendColors),
        alphaBlend192W(n13, pixel, blendColors),
        alphaBlend64W(n12, pixel, blendColors),
        alphaBlend64W(n10, pixel, blendColors)
    ];
};
const up2 = (n15, n14, n11, n3, n7, n10, pixel, blendColors) => {
    return [
        pixel,
        alphaBlend192W(n14, pixel, blendColors),
        pixel,
        alphaBlend64W(n3, pixel, blendColors),
        alphaBlend192W(n7, pixel, blendColors),
        alphaBlend64W(n10, pixel, blendColors)
    ];
};
const dia = (n15, n14, n11, pixel, blendColors) => {
    return [
        pixel,
        alphaBlend128W(n14, pixel, blendColors),
        alphaBlend128W(n11, pixel, blendColors)
    ];
};
const kernel4Xv2 = (pe, pi, ph, pf, pg, pc, pd, pb, f4, i4, h5, i5, n15, n14, n11, n3, n7, n10, n13, n12, options) => {
    var ex = (pe !== ph && pe !== pf);
    if (!ex) {
        return [n15, n14, n11, n3, n7, n10, n13, n12];
    }
    const { scaleAlpha, blendColors } = options;
    const e = (yuvDifference(pe, pc, scaleAlpha) + yuvDifference(pe, pg, scaleAlpha) + yuvDifference(pi, h5, scaleAlpha) + yuvDifference(pi, f4, scaleAlpha)) + (yuvDifference(ph, pf, scaleAlpha) << 2), i = (yuvDifference(ph, pd, scaleAlpha) + yuvDifference(ph, i5, scaleAlpha) + yuvDifference(pf, i4, scaleAlpha) + yuvDifference(pf, pb, scaleAlpha)) + (yuvDifference(pe, pi, scaleAlpha) << 2), px = (yuvDifference(pe, pf, scaleAlpha) <= yuvDifference(pe, ph, scaleAlpha)) ? pf : ph;
    if ((e < i) && (!isEqual(pf, pb, scaleAlpha) && !isEqual(ph, pd, scaleAlpha) || isEqual(pe, pi, scaleAlpha) && (!isEqual(pf, i4, scaleAlpha) && !isEqual(ph, i5, scaleAlpha)) || isEqual(pe, pg, scaleAlpha) || isEqual(pe, pc, scaleAlpha))) {
        const ke = yuvDifference(pf, pg, scaleAlpha), ki = yuvDifference(ph, pc, scaleAlpha), ex2 = (pe !== pc && pb !== pc), ex3 = (pe !== pg && pd !== pg);
        if (((ke << 1) <= ki) && ex3 || (ke >= (ki << 1)) && ex2) {
            if (((ke << 1) <= ki) && ex3) {
                [n15, n14, n11, n13, n12, n10] = left2(n15, n14, n11, n13, n12, n10, px, blendColors);
            }
            if ((ke >= (ki << 1)) && ex2) {
                [n15, n14, n11, n3, n7, n10] = up2(n15, n14, n11, n3, n7, n10, px, blendColors);
            }
        }
        else {
            [n15, n14, n11] = dia(n15, n14, n11, px, blendColors);
        }
    }
    else if (e <= i) {
        n15 = alphaBlend128W(n15, px, blendColors);
    }
    return [n15, n14, n11, n3, n7, n10, n13, n12];
};
export const xbr2x = (pixelArray, width, height, options = new XBROptions()) => {
    const output = new Uint32Array(width * height * 4);
    for (let c = 0; c < width; c++) {
        for (let d = 0; d < height; d++) {
            computeXbr2x(pixelArray, c, d, width, height, output, c * 2, d * 2, width * 2, options);
        }
    }
    return output;
};
export const xbr3x = (pixelArray, width, height, options = new XBROptions()) => {
    const output = new Uint32Array(width * height * 9);
    for (let c = 0; c < width; c++) {
        for (let d = 0; d < height; d++) {
            computeXbr3x(pixelArray, c, d, width, height, output, c * 3, d * 3, width * 3, options);
        }
    }
    return output;
};
export const xbr4x = (pixelArray, width, height, options = new XBROptions()) => {
    const output = new Uint32Array(width * height * 16);
    for (let c = 0; c < width; c++) {
        for (let d = 0; d < height; d++) {
            computeXbr4x(pixelArray, c, d, width, height, output, c * 4, d * 4, width * 4, options);
        }
    }
    return output;
};
