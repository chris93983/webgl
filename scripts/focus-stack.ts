import { getImageData } from "./utils/get-image-data.js";

const [REDMASK, GREENMASK, BLUEMASK, ALPHAMASK, THRESHHOLD_Y, THRESHHOLD_U, THRESHHOLD_V] = [0x000000FF, 0x0000FF00, 0x00FF0000, 0xFF000000, 48, 7, 6];

const getRelatedPoints1 = (input: Uint32Array, x: number, y: number, width: number, height: number): number[] => {
    const xm1 = Math.max(x - 1, 0);
    const ym1 = Math.max(y - 1, 0);
    const xp1 = Math.min(x + 1, width - 1);
    const yp1 = Math.min(y + 1, height - 1);

    return [
        input[xm1 + ym1 * width],  /* pa */
        input[x + ym1 * width], /* pb */
        input[xp1 + ym1 * width],  /* pc */

        input[xm1 + y * width], /* pd */
        input[x + y * width],/* pe */
        input[xp1 + y * width], /* pf */

        input[xm1 + yp1 * width],  /* pg */
        input[x + yp1 * width], /* ph */
        input[xp1 + yp1 * width],  /* pi */
    ];
};

const getRelatedPoints2 = (input: Uint32Array, x: number, y: number, width: number, height: number): number[] => {
    const xm1 = Math.max(x - 1, 0);
    const xm2 = Math.max(x - 2, 0);
    const ym1 = Math.max(y - 1, 0);
    const ym2 = Math.max(y - 2, 0);
    const xp1 = Math.min(x + 1, width - 1);
    const xp2 = Math.min(x + 2, width - 1);
    const yp1 = Math.min(y + 1, height - 1);
    const yp2 = Math.min(y + 2, height - 1);

    return [
        input[xm1 + ym2 * width],  /* a1 */
        input[x + ym2 * width], /* b1 */
        input[xp1 + ym2 * width],  /* c1 */

        input[xm2 + ym1 * width],  /* a0 */
        input[xm1 + ym1 * width],  /* pa */
        input[x + ym1 * width], /* pb */
        input[xp1 + ym1 * width],  /* pc */
        input[xp2 + ym1 * width],  /* c4 */

        input[xm2 + y * width], /* d0 */
        input[xm1 + y * width], /* pd */
        input[x + y * width],/* pe */
        input[xp1 + y * width], /* pf */
        input[xp2 + y * width], /* f4 */

        input[xm2 + yp1 * width],  /* g0 */
        input[xm1 + yp1 * width],  /* pg */
        input[x + yp1 * width], /* ph */
        input[xp1 + yp1 * width],  /* pi */
        input[xp2 + yp1 * width],  /* i4 */

        input[xm1 + yp2 * width],  /* g5 */
        input[x + yp2 * width], /* h5 */
        input[xp1 + yp2 * width]   /* i5 */
    ];
};

const getRelatedPoints3 = (input: Uint32Array, x: number, y: number, width: number, height: number): number[] => {
    const xm1 = Math.max(x - 1, 0);
    const xm2 = Math.max(x - 2, 0);
    const xm3 = Math.max(x - 3, 0);
    const ym1 = Math.max(y - 1, 0);
    const ym2 = Math.max(y - 2, 0);
    const ym3 = Math.max(y - 3, 0);
    const xp1 = Math.min(x + 1, width - 1);
    const xp2 = Math.min(x + 2, width - 1);
    const xp3 = Math.min(x + 3, width - 1);
    const yp1 = Math.min(y + 1, height - 1);
    const yp2 = Math.min(y + 2, height - 1);
    const yp3 = Math.min(y + 3, height - 1);

    return [
        input[xm2 + ym3 * width],  /* a1 */
        input[xm1 + ym3 * width],  /* a1 */
        input[x + ym3 * width], /* b1 */
        input[xp1 + ym3 * width],  /* c1 */
        input[xp2 + ym3 * width],  /* c1 */

        input[xm3 + ym2 * width],  /* a1 */
        input[xm2 + ym2 * width],  /* a1 */
        input[xm1 + ym2 * width],  /* a1 */
        input[x + ym2 * width], /* b1 */
        input[xp1 + ym2 * width],  /* c1 */
        input[xp2 + ym2 * width],  /* c1 */
        input[xp3 + ym2 * width],  /* c1 */

        input[xm3 + ym1 * width],  /* a0 */
        input[xm2 + ym1 * width],  /* a0 */
        input[xm1 + ym1 * width],  /* pa */
        input[x + ym1 * width], /* pb */
        input[xp1 + ym1 * width],  /* pc */
        input[xp2 + ym1 * width],  /* c4 */
        input[xp3 + ym1 * width],  /* c4 */

        input[xm3 + y * width], /* d0 */
        input[xm2 + y * width], /* d0 */
        input[xm1 + y * width], /* pd */
        input[x + y * width],/* pe */
        input[xp1 + y * width], /* pf */
        input[xp2 + y * width], /* f4 */
        input[xp3 + y * width], /* f4 */

        input[xm3 + yp1 * width],  /* g0 */
        input[xm2 + yp1 * width],  /* g0 */
        input[xm1 + yp1 * width],  /* pg */
        input[x + yp1 * width], /* ph */
        input[xp1 + yp1 * width],  /* pi */
        input[xp2 + yp1 * width],  /* i4 */
        input[xp3 + yp1 * width],  /* i4 */

        input[xm3 + yp2 * width],  /* g5 */
        input[xm2 + yp2 * width],  /* g5 */
        input[xm1 + yp2 * width],  /* g5 */
        input[x + yp2 * width], /* h5 */
        input[xp1 + yp2 * width],   /* i5 */
        input[xp2 + yp2 * width],   /* i5 */
        input[xp3 + yp2 * width],   /* i5 */

        input[xm2 + yp3 * width],  /* g5 */
        input[xm1 + yp3 * width],  /* g5 */
        input[x + yp3 * width], /* h5 */
        input[xp1 + yp3 * width],   /* i5 */
        input[xp2 + yp3 * width],   /* i5 */
    ];
};

const getRelatedPoints4 = (input: Uint32Array, x: number, y: number, width: number, height: number): number[] => {
    const xm1 = Math.max(x - 1, 0);
    const xm2 = Math.max(x - 2, 0);
    const xm3 = Math.max(x - 3, 0);
    const xm4 = Math.max(x - 4, 0);
    const ym1 = Math.max(y - 1, 0);
    const ym2 = Math.max(y - 2, 0);
    const ym3 = Math.max(y - 3, 0);
    const ym4 = Math.max(y - 4, 0);
    const xp1 = Math.min(x + 1, width - 1);
    const xp2 = Math.min(x + 2, width - 1);
    const xp3 = Math.min(x + 3, width - 1);
    const xp4 = Math.min(x + 4, width - 1);
    const yp1 = Math.min(y + 1, height - 1);
    const yp2 = Math.min(y + 2, height - 1);
    const yp3 = Math.min(y + 3, height - 1);
    const yp4 = Math.min(y + 4, height - 1);

    return [
        input[xm3+ ym4 * width],  /* a1 */
        input[xm2 + ym4 * width],  /* a1 */
        input[xm1 + ym4 * width],  /* a1 */
        input[x + ym4 * width], /* b1 */
        input[xp1 + ym4 * width],  /* c1 */
        input[xp2 + ym4 * width],  /* c1 */
        input[xp3 + ym4 * width],  /* c1 */

        input[xm4+ ym3 * width],  /* a1 */
        input[xm3+ ym3 * width],  /* a1 */
        input[xm2 + ym3 * width],  /* a1 */
        input[xm1 + ym3 * width],  /* a1 */
        input[x + ym3 * width], /* b1 */
        input[xp1 + ym3 * width],  /* c1 */
        input[xp2 + ym3 * width],  /* c1 */
        input[xp3 + ym3 * width],  /* c1 */
        input[xp4 + ym3 * width],  /* c1 */

        input[xm4 + ym2 * width],  /* a1 */
        input[xm3 + ym2 * width],  /* a1 */
        input[xm2 + ym2 * width],  /* a1 */
        input[xm1 + ym2 * width],  /* a1 */
        input[x + ym2 * width], /* b1 */
        input[xp1 + ym2 * width],  /* c1 */
        input[xp2 + ym2 * width],  /* c1 */
        input[xp3 + ym2 * width],  /* c1 */
        input[xp4 + ym2 * width],  /* c1 */

        input[xm4 + ym1 * width],  /* a0 */
        input[xm3 + ym1 * width],  /* a0 */
        input[xm2 + ym1 * width],  /* a0 */
        input[xm1 + ym1 * width],  /* pa */
        input[x + ym1 * width], /* pb */
        input[xp1 + ym1 * width],  /* pc */
        input[xp2 + ym1 * width],  /* c4 */
        input[xp3 + ym1 * width],  /* c4 */
        input[xp4 + ym1 * width],  /* c4 */

        input[xm4 + y * width], /* d0 */
        input[xm3 + y * width], /* d0 */
        input[xm2 + y * width], /* d0 */
        input[xm1 + y * width], /* pd */
        input[x + y * width],/* pe */
        input[xp1 + y * width], /* pf */
        input[xp2 + y * width], /* f4 */
        input[xp3 + y * width], /* f4 */
        input[xp4 + y * width], /* f4 */

        input[xm4 + yp1 * width],  /* g0 */
        input[xm3 + yp1 * width],  /* g0 */
        input[xm2 + yp1 * width],  /* g0 */
        input[xm1 + yp1 * width],  /* pg */
        input[x + yp1 * width], /* ph */
        input[xp1 + yp1 * width],  /* pi */
        input[xp2 + yp1 * width],  /* i4 */
        input[xp3 + yp1 * width],  /* i4 */
        input[xp4 + yp1 * width],  /* i4 */

        input[xm4 + yp2 * width],  /* g5 */
        input[xm3 + yp2 * width],  /* g5 */
        input[xm2 + yp2 * width],  /* g5 */
        input[xm1 + yp2 * width],  /* g5 */
        input[x + yp2 * width], /* h5 */
        input[xp1 + yp2 * width],   /* i5 */
        input[xp2 + yp2 * width],   /* i5 */
        input[xp3 + yp2 * width],   /* i5 */
        input[xp4 + yp2 * width],   /* i5 */

        input[xm4 + yp3 * width],  /* g5 */
        input[xm3 + yp3 * width],  /* g5 */
        input[xm2 + yp3 * width],  /* g5 */
        input[xm1 + yp3 * width],  /* g5 */
        input[x + yp3 * width], /* h5 */
        input[xp1 + yp3 * width],   /* i5 */
        input[xp2 + yp3 * width],   /* i5 */
        input[xp3 + yp3 * width],   /* i5 */
        input[xp4 + yp3 * width],   /* i5 */

        input[xm3 + yp4 * width],  /* g5 */
        input[xm2 + yp4 * width],  /* g5 */
        input[xm1 + yp4 * width],  /* g5 */
        input[x + yp4 * width], /* h5 */
        input[xp1 + yp4 * width],   /* i5 */
        input[xp2 + yp4 * width],   /* i5 */
        input[xp3 + yp4 * width],   /* i5 */
    ];
};

const getYuv = (p: number): number[] => {
    const [r, g, b] = [p & REDMASK, (p & GREENMASK) >> 8, (p & BLUEMASK) >> 16];
    const [y, u, v] = [
        r * .299000 + g * .587000 + b * .114000,
        r * - .168736 + g * - .331264 + b * .500000,
        r * .500000 + g * - .418688 + b * - .081312,
    ];
        
    return [y, u, v];
};

const yuvDifference = (A: number, B: number, scaleAlpha = false): number => {
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

export const getImageDepthMap = async (layer1: string, layer2: string, layer3: string): Promise<Uint32Array> => {
    const now = performance.now();
    const [imageData1, imageData2, imageData3] = [await getImageData(layer1), await getImageData(layer2), await getImageData(layer3)];
    const inputs = [new Uint32Array(imageData1.data.buffer), new Uint32Array(imageData2.data.buffer), new Uint32Array(imageData3.data.buffer)];
    const [input, input2, input3] = inputs;
    const output = new Uint32Array(input.length);

    for (let i = 0; i < input.length; i++) {
        const [x, y] = [i % imageData1.width, i / imageData1.width >> 0];
        const depth1 = getPixelDepth(input, x, y, imageData1.width, imageData1.height);
        const depth2 = getPixelDepth(input2, x, y, imageData2.width, imageData1.height);
        const depth3 = getPixelDepth(input3, x, y, imageData2.width, imageData1.height);
        const depths = [depth1, depth2, depth3];
        // const min = [Math.min(...depths);
        // const minIndex = depths.indexOf(min);
        const max = Math.max(...depths);
        const maxIndex = depths.indexOf(max);
        // const inputAverages = [input[i], input2[i], input3[i]];
        output[i] = inputs[maxIndex][i];
        // output[i] = inputs[minIndex][i];
    }

    console.log('time spent:', (performance.now() - now) >> 0, 'ms');

    return output;
};

const getPixelDepth = (input: Uint32Array, x: number, y: number, width: number, height: number): number => {
    const pixels = getRelatedPoints2(input, x, y, width, height);
    const differenceArray: Array<number> = [];

    for (let i = 0; i < pixels.length; i++) {
        if (i !== 10) {
            differenceArray.push(yuvDifference(pixels[10], pixels[1]));
        }
    }

    const average = differenceArray.reduce((a, b) => a + b, 0) / differenceArray.length;
    return average;
};
