// 2xBR
const SCALE = 2;
// Weights should emphasize luminance (Y), in order to work. Feel free to experiment.
const [Y_WEIGHT, U_WEIGHT, V_WEIGHT] = [48, 7, 6];
class Pixel {
    constructor(value = 0) {
        this.value = value;
    }
    get red() {
        return this.value & 0x000000FF;
    }
    get green() {
        return (this.value & 0x0000FF00) >> 8;
    }
    get blue() {
        return (this.value & 0x00FF0000) >> 16;
    }
    get alpha() {
        return (this.value & 0xFF000000) >> 24;
    }
}
/**
* This is the window or `vision` of the xBR algorithm. The 10th index, the pixel
* at the center holds the current pixel being scaled.
*
* @property matrix
* @type Array
*/
const matrix = Object.freeze([
    new Pixel(), new Pixel(), new Pixel(),
    new Pixel(), new Pixel(), new Pixel(), new Pixel(), new Pixel(),
    new Pixel(), new Pixel(), new Pixel(), new Pixel(), new Pixel(),
    new Pixel(), new Pixel(), new Pixel(), new Pixel(), new Pixel(),
    new Pixel(), new Pixel(), new Pixel(),
]);
/**
* Returns the absolute value of a number.
*
* **Note**
* `return (x >> 31) ^ x + (x >> 31)` also works (w/out a mask)
*
* @method abs
* @param x {Number}
* @return Number
*/
const abs = (x) => {
    const mask = x >> 31;
    x = x ^ mask;
    x = x - mask;
    return x;
};
/**
* Calculates the weighted difference between two pixels.
*
* These are the steps:
* 1. Finds absolute color diference between two pixels.
* 2. Converts color difference into Y'UV, seperating color from light.
* 3. Applies Y'UV thresholds, giving importance to luminance.
*/
const calcWeightedDifference = (pixelA, pixelB) => {
    const r = abs(pixelA.red - pixelB.red);
    const b = abs(pixelA.blue - pixelB.blue);
    const g = abs(pixelA.green - pixelB.green);
    const y = r * .299000 + g * .587000 + b * .114000;
    const u = r * -.168736 + g * -.331264 + b * .500000;
    const v = r * .500000 + g * -.418688 + b * -.081312;
    const weight = (y * Y_WEIGHT) + (u * U_WEIGHT) + (v * V_WEIGHT);
    return weight;
};
/**
* Blends two pixels together and retuns an new Pixel.
*
* **Note** This function ignores the alpha channel, if you wanted to work on
* images with transparancy, this is where you;d want to start.
*
* @method blend
* @param pixelA {Pixel}
* @param pixelB {Pixel}
* @param alpha {Number}
* @return Pixel
*/
const blend = (pixelA, pixelB, alpha) => {
    const reverseAlpha = 1 - alpha;
    const r = (alpha * pixelB.red) + (reverseAlpha * pixelA.red);
    const g = (alpha * pixelB.green) + (reverseAlpha * pixelA.green);
    const b = (alpha * pixelB.blue) + (reverseAlpha * pixelA.blue);
    return new Pixel(r | g << 8 | b << 16 | -16777216);
};
export const xBR = (context, srcX = 0, srcY = 0, srcW = context.canvas.width, srcH = context.canvas.height) => {
    // original
    const oImageData = context.getImageData(srcX, srcY, srcW, srcH);
    const oPixelView = new Uint32Array(oImageData.data.buffer);
    console.log('oImageData', oImageData, oImageData.data.buffer);
    console.log('oPixelView', Array.from(oPixelView).map(color => color.toString(16)));
    // scaled
    const [scaledWidth, scaledHeight] = [srcW * SCALE, srcH * SCALE];
    const sImageData = context.createImageData(scaledWidth, scaledHeight);
    const sPixelView = new Uint32Array(sImageData.data.buffer);
    const coord2index = (x, y) => srcW * y + x;
    /*
    * Main Loop; Algorithm is applied here
    */
    for (let x = 0; x < srcW; ++x) {
        for (let y = 0; y < srcH; ++y) {
            /* Matrix: 10 is (0,0) i.e. current pixel.
                -2 | -1|  0| +1| +2 	(x)
            ______________________________
            -2 |	    [ 0][ 1][ 2]
            -1 |	[ 3][ 4][ 5][ 6][ 7]
             0 |	[ 8][ 9][10][11][12]
            +1 |	[13][14][15][16][17]
            +2 |	    [18][19][20]
            (y)|
            */
            matrix[0].value = oPixelView[coord2index(x - 1, y - 2)];
            matrix[1].value = oPixelView[coord2index(x, y - 2)];
            matrix[2].value = oPixelView[coord2index(x + 1, y - 2)];
            matrix[3].value = oPixelView[coord2index(x - 2, y - 1)];
            matrix[4].value = oPixelView[coord2index(x - 1, y - 1)];
            matrix[5].value = oPixelView[coord2index(x, y - 1)];
            matrix[6].value = oPixelView[coord2index(x + 1, y - 1)];
            matrix[7].value = oPixelView[coord2index(x + 2, y - 1)];
            matrix[8].value = oPixelView[coord2index(x - 2, y)];
            matrix[9].value = oPixelView[coord2index(x - 1, y)];
            matrix[10].value = oPixelView[coord2index(x, y)];
            matrix[11].value = oPixelView[coord2index(x + 1, y)];
            matrix[12].value = oPixelView[coord2index(x + 2, y)];
            matrix[13].value = oPixelView[coord2index(x - 2, y + 1)];
            matrix[14].value = oPixelView[coord2index(x - 1, y + 1)];
            matrix[15].value = oPixelView[coord2index(x, y + 1)];
            matrix[16].value = oPixelView[coord2index(x + 1, y + 1)];
            matrix[17].value = oPixelView[coord2index(x + 2, y + 1)];
            matrix[18].value = oPixelView[coord2index(x - 1, y + 2)];
            matrix[19].value = oPixelView[coord2index(x, y + 2)];
            matrix[20].value = oPixelView[coord2index(x + 1, y + 2)];
            // Calculate color weights using 2 points in the matrix
            const d_10_9 = calcWeightedDifference(matrix[10], matrix[9]);
            const d_10_5 = calcWeightedDifference(matrix[10], matrix[5]);
            const d_10_11 = calcWeightedDifference(matrix[10], matrix[11]);
            const d_10_15 = calcWeightedDifference(matrix[10], matrix[15]);
            const d_10_14 = calcWeightedDifference(matrix[10], matrix[14]);
            const d_10_6 = calcWeightedDifference(matrix[10], matrix[6]);
            const d_4_8 = calcWeightedDifference(matrix[4], matrix[8]);
            const d_4_1 = calcWeightedDifference(matrix[4], matrix[1]);
            const d_9_5 = calcWeightedDifference(matrix[9], matrix[5]);
            const d_9_15 = calcWeightedDifference(matrix[9], matrix[15]);
            const d_9_3 = calcWeightedDifference(matrix[9], matrix[3]);
            const d_5_11 = calcWeightedDifference(matrix[5], matrix[11]);
            const d_5_0 = calcWeightedDifference(matrix[5], matrix[0]);
            const d_10_4 = calcWeightedDifference(matrix[10], matrix[4]);
            const d_10_16 = calcWeightedDifference(matrix[10], matrix[16]);
            const d_6_12 = calcWeightedDifference(matrix[6], matrix[12]);
            const d_6_1 = calcWeightedDifference(matrix[6], matrix[1]);
            const d_11_15 = calcWeightedDifference(matrix[11], matrix[15]);
            const d_11_7 = calcWeightedDifference(matrix[11], matrix[7]);
            const d_5_2 = calcWeightedDifference(matrix[5], matrix[2]);
            const d_14_8 = calcWeightedDifference(matrix[14], matrix[8]);
            const d_14_19 = calcWeightedDifference(matrix[14], matrix[19]);
            const d_15_18 = calcWeightedDifference(matrix[15], matrix[18]);
            const d_9_13 = calcWeightedDifference(matrix[9], matrix[13]);
            const d_16_12 = calcWeightedDifference(matrix[16], matrix[12]);
            const d_16_19 = calcWeightedDifference(matrix[16], matrix[19]);
            const d_15_20 = calcWeightedDifference(matrix[15], matrix[20]);
            const d_15_17 = calcWeightedDifference(matrix[15], matrix[17]);
            // Top Left Edge Detection Rule
            const a1 = (d_10_14 + d_10_6 + d_4_8 + d_4_1 + (4 * d_9_5));
            const b1 = (d_9_15 + d_9_3 + d_5_11 + d_5_0 + (4 * d_10_4));
            if (a1 < b1) {
                const new_pixel = (d_10_9 <= d_10_5) ? matrix[9] : matrix[5];
                const blended_pixel = blend(new_pixel, matrix[10], .5);
                sPixelView[((y * SCALE) * scaledWidth) + (x * SCALE)] = blended_pixel.value;
            }
            else {
                sPixelView[((y * SCALE) * scaledWidth) + (x * SCALE)] = matrix[10].value;
            }
            // Top Right Edge Detection Rule
            const a2 = (d_10_16 + d_10_4 + d_6_12 + d_6_1 + (4 * d_5_11));
            const b2 = (d_11_15 + d_11_7 + d_9_5 + d_5_2 + (4 * d_10_6));
            if (a2 < b2) {
                const new_pixel = (d_10_5 <= d_10_11) ? matrix[5] : matrix[11];
                const blended_pixel = blend(new_pixel, matrix[10], .5);
                sPixelView[((y * SCALE) * scaledWidth) + (x * SCALE + 1)] = blended_pixel.value;
            }
            else {
                sPixelView[((y * SCALE) * scaledWidth) + (x * SCALE + 1)] = matrix[10].value;
            }
            // Bottom Left Edge Detection Rule
            const a3 = (d_10_4 + d_10_16 + d_14_8 + d_14_19 + (4 * d_9_15));
            const b3 = (d_9_5 + d_9_13 + d_11_15 + d_15_18 + (4 * d_10_14));
            if (a3 < b3) {
                const new_pixel = (d_10_9 <= d_10_15) ? matrix[9] : matrix[15];
                const blended_pixel = blend(new_pixel, matrix[10], .5);
                const index = ((y * SCALE + 1) * scaledWidth) + (x * SCALE);
                sPixelView[index] = blended_pixel.value;
            }
            else {
                const index = ((y * SCALE + 1) * scaledWidth) + (x * SCALE);
                sPixelView[index] = matrix[10].value;
            }
            // Bottom Right Edge Detection Rule
            const a4 = (d_10_6 + d_10_14 + d_16_12 + d_16_19 + (4 * d_11_15));
            const b4 = (d_9_15 + d_15_20 + d_15_17 + d_5_11 + (4 * d_10_16));
            if (a4 < b4) {
                const new_pixel = (d_10_11 <= d_10_15) ? matrix[11] : matrix[15];
                const blended_pixel = blend(new_pixel, matrix[10], .5);
                sPixelView[((y * SCALE + 1) * scaledWidth) + (x * SCALE + 1)] = blended_pixel.value;
            }
            else {
                sPixelView[((y * SCALE + 1) * scaledWidth) + (x * SCALE + 1)] = matrix[10].value;
            }
        }
    }
    return sImageData;
};
