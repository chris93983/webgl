import { interp1, interp2, interp3, interp4, interp5, interp6, interp7, interp8, interp9 } from './utils/interp.js';

const img = document.querySelector<HTMLImageElement>('#img');
img.onload = () => {
    document.body.appendChild(hqx(img, 2));
    document.body.appendChild(hqx(img, 3));
    document.body.appendChild(hqx(img, 4));
    img.style.marginBottom = `${img.height}px`;
};
// img.src = './images/advancewars.png';
img.src = './images/emeral.png';

let src: number[] = null, dest: number[] = null;
const MASK_2 = 0x00FF00, Ymask = 0x00FF0000, Umask = 0x0000FF00, Vmask = 0x000000FF, trY = 0x00300000, trU = 0x00000700, trV = 0x00000006;

const RGBtoYUV = (rgb: number): number => {
    const [r, g, b] = [(rgb & 0xFF0000) >> 16, (rgb & MASK_2) >> 8, rgb & 0x0000FF];
    return ((/*y=*/(0.299 * r + 0.587 * g + 0.114 * b) | 0) << 16) +
        ((/*u=*/((-0.169 * r - 0.331 * g + 0.5 * b) + 128) | 0) << 8) +
        (/*v=*/((0.5 * r - 0.419 * g - 0.081 * b) + 128) | 0);
};

const RGBAtoYUV = (rgb: number): number => {
    // const [r, g, b] = [(rgba & 0xFF000000) >> 24, (rgba & 0x00FF0000) >> 16, (rgba & 0x0000FF00) >> 8];
    // return ((/*y=*/(0.299 * r + 0.587 * g + 0.114 * b) | 0) << 16) +
    //     ((/*u=*/((-0.169 * r - 0.331 * g + 0.5 * b) + 128) | 0) << 8) +
    //     (/*v=*/((0.5 * r - 0.419 * g - 0.081 * b) + 128) | 0);
    const [r, g, b] = [(rgb & 0xFF0000) >> 16, (rgb & MASK_2) >> 8, rgb & 0x0000FF];
    return ((/*y=*/(0.299 * r + 0.587 * g + 0.114 * b) | 0) << 16) +
        ((/*u=*/((-0.169 * r - 0.331 * g + 0.5 * b) + 128) | 0) << 8) +
        (/*v=*/((0.5 * r - 0.419 * g - 0.081 * b) + 128) | 0);
};

const diffColor = (rgb1: number, rgb2: number): boolean => {
    // Mask against RGB_MASK to discard the alpha channel
    const [yuv1, yuv2] = [RGBAtoYUV(rgb1), RGBAtoYUV(rgb2)];
    return ((Math.abs((yuv1 & Ymask) - (yuv2 & Ymask)) > trY) || (Math.abs((yuv1 & Umask) - (yuv2 & Umask)) > trU) || (Math.abs((yuv1 & Vmask) - (yuv2 & Vmask)) > trV));
};

const getVendorAttribute = (el: CanvasRenderingContext2D, attr: string): any => {
    const uc = attr.charAt(0).toUpperCase() + attr.substr(1);
    return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
};

// This function normalizes getImageData to extract the real, actual
// pixels from an image. The naive method recently failed on retina
// devices with a backgingStoreRatio != 1
const getImagePixels = (image: HTMLImageElement, x: number, y: number, width: number, height: number): ImageData => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const ratio = getVendorAttribute(ctx, 'backingStorePixelRatio') || 1;
    (ctx as any).getImageDataHD = getVendorAttribute(ctx, 'getImageDataHD');
    canvas.width = Math.ceil(image.width / ratio);
    canvas.height = Math.ceil(image.height / ratio);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return ratio === 1 ? ctx.getImageData(x, y, width, height) : (ctx as any).getImageDataHD(x, y, width, height);
};

const hqx = (img: HTMLImageElement | HTMLCanvasElement, scale: 2 | 3 | 4): HTMLImageElement | HTMLCanvasElement => {
    if ([2, 3, 4].indexOf(scale) === -1) {
        return img;
    }

    let origCanvas: HTMLImageElement | HTMLCanvasElement, origCtx: CanvasRenderingContext2D, scaledCanvas: HTMLCanvasElement, origPixels: Uint8ClampedArray;
    if (img instanceof HTMLCanvasElement) {
        origCanvas = img;
        origCtx = origCanvas.getContext('2d');
        scaledCanvas = origCanvas;
        origPixels = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height).data;
    } else {
        origPixels = getImagePixels(img, 0, 0, img.width, img.height).data;
        scaledCanvas = document.createElement('canvas');
    }

    // pack RGBA colors into integers
    const count = img.width * img.height;
    src = new Array<number>(count);
    let index: number;

    for (let i = 0; i < count; i++) {
        src[i] = (origPixels[(index = i << 2) + 3] << 24) + (origPixels[index + 2] << 16) + (origPixels[index + 1] << 8) + origPixels[index];
        // src[i] = (origPixels[(index = i << 2) + 3] * (1 << 24)) + (origPixels[index + 2] << 16) + (origPixels[index + 1] << 8) + origPixels[index];
        // console.log('src', src[i]);
        // console.log('abgr', origPixels[(index = i << 2) + 3], (origPixels[index + 2] << 16), (origPixels[index + 1] << 8), origPixels[index]);
        // console.log('abgr-16', (origPixels[(index = i << 2) + 3] * (1 << 24)).toString(16), (origPixels[index + 2] << 16).toString(16), (origPixels[index + 1] << 8).toString(16), origPixels[index].toString(16));
        // console.log('src[i]1', i, src[i], src[i].toString(2), src[i].toString(16), );
        // src[i] = (origPixels[index = i * 4] << 24) + (origPixels[index + 1] << 16) + (origPixels[index + 2] << 8) + origPixels[index + 3];
        // console.log('src[i]2', i, src[i], src[i].toString(2), src[i].toString(16), origPixels[i * 4], origPixels[i * 4 + 1], origPixels[i * 4 + 2], origPixels[i * 4 + 3]);
    }

    // let dest: number[];
    if (scale === 2) dest = hq2x(img.width, img.height);
    else if (scale === 3) dest = hq3x(img.width, img.height);
    else if (scale === 4) dest = hq4x(img.width, img.height);

    scaledCanvas.width = img.width * scale;
    scaledCanvas.height = img.height * scale;
    const scaledCtx = scaledCanvas.getContext('2d');
    const scaledPixels = scaledCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);

    // unpack integers to RGBA
    let c: bigint | number, a: number, destLength = dest.length;
    for (let j = 0; j < destLength; j++) {
        a = ((c = dest[j]) & 0xFF000000) >> 24;
        scaledPixels.data[(index = j << 2) + 3] = a < 0 ? a + 256 : 0; // signed/unsigned :/
        scaledPixels.data[index + 2] = (c & 0x00FF0000) >> 16;
        scaledPixels.data[index + 1] = (c & 0x0000FF00) >> 8;
        scaledPixels.data[index] = c & 0x000000FF;

        // c = BigInt(dest[j]);
        // index = j << 2;
        // scaledPixels.data[index + 3] = Number(c & 0x000000FFn);
        // scaledPixels.data[index + 2] = Number((c & 0x0000FF00n) >> 8n);
        // scaledPixels.data[index + 1] = Number((c & 0x00FF0000n) >> 16n);
        // scaledPixels.data[index + 0] = Number((c & 0xFF000000n) >> 24n);
    }

    src = dest = null;
    scaledCtx.putImageData(scaledPixels, 0, 0);

    return scaledCanvas;
};

const hq2x = (width: number, height: number): Array<number> => {
    const dest = new Array(width * height * 4);

    let prevline: number, nextline: number,
        w: number[] = [],
        //dpL = width * 2, optimized
        dpL = width << 1,
        dp = 0,
        sp = 0;

    // internal to local optimization
    let YUV1: number, YUV2: number;

    //   +----+----+----+
    //   |    |    |    |
    //   | w1 | w2 | w3 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w4 | w5 | w6 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w7 | w8 | w9 |
    //   +----+----+----+

    for (let j = 0; j < height; j++) {
        prevline = j > 0 ? -width : 0;
        nextline = j < height - 1 ? width : 0;

        for (let i = 0; i < width; i++) {
            w[2] = src[sp + prevline];
            w[5] = src[sp];
            w[8] = src[sp + nextline];

            if (i > 0) {
                w[1] = src[sp + prevline - 1];
                w[4] = src[sp - 1];
                w[7] = src[sp + nextline - 1];
            } else {
                w[1] = w[2];
                w[4] = w[5];
                w[7] = w[8];
            }

            if (i < width - 1) {
                w[3] = src[sp + prevline + 1];
                w[6] = src[sp + 1];
                w[9] = src[sp + nextline + 1];
            } else {
                w[3] = w[2];
                w[6] = w[5];
                w[9] = w[8];
            }

            let pattern = 0;
            let flag = 1;

            YUV1 = RGBAtoYUV(w[5]);

            //for (k=1; k<=9; k++) optimized
            for (let k = 1; k < 10; k++) { // k<=9
                if (k === 5) continue;

                if (w[k] !== w[5]) {
                    YUV2 = RGBAtoYUV(w[k]);
                    if ((Math.abs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY) ||
                        (Math.abs((YUV1 & Umask) - (YUV2 & Umask)) > trU) ||
                        (Math.abs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV))
                        pattern |= flag;
                }
                flag <<= 1;
            }

            switch (pattern) {
                case 0:
                case 1:
                case 4:
                case 32:
                case 128:
                case 5:
                case 132:
                case 160:
                case 33:
                case 129:
                case 36:
                case 133:
                case 164:
                case 161:
                case 37:
                case 165:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 2:
                case 34:
                case 130:
                case 162:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 16:
                case 17:
                case 48:
                case 49:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 64:
                case 65:
                case 68:
                case 69:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 8:
                case 12:
                case 136:
                case 140:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 3:
                case 35:
                case 131:
                case 163:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 6:
                case 38:
                case 134:
                case 166:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 20:
                case 21:
                case 52:
                case 53:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 144:
                case 145:
                case 176:
                case 177:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 192:
                case 193:
                case 196:
                case 197:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 96:
                case 97:
                case 100:
                case 101:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 40:
                case 44:
                case 168:
                case 172:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 9:
                case 13:
                case 137:
                case 141:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 18:
                case 50:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 80:
                case 81:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 72:
                case 76:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 10:
                case 138:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 66:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 24:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 7:
                case 39:
                case 135:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 148:
                case 149:
                case 180:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 224:
                case 228:
                case 225:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 41:
                case 169:
                case 45:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 22:
                case 54:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 208:
                case 209:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 104:
                case 108:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 11:
                case 139:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 19:
                case 51:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp] = interp6(w[5], w[2], w[4]);
                        dest[dp + 1] = interp9(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 146:
                case 178:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                        dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    } else {
                        dest[dp + 1] = interp9(w[5], w[2], w[6]);
                        dest[dp + dpL + 1] = interp6(w[5], w[6], w[8]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    break;
                case 84:
                case 85:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + 1] = interp6(w[5], w[6], w[2]);
                        dest[dp + dpL + 1] = interp9(w[5], w[6], w[8]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    break;
                case 112:
                case 113:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL] = interp6(w[5], w[8], w[4]);
                        dest[dp + dpL + 1] = interp9(w[5], w[6], w[8]);
                    }
                    break;
                case 200:
                case 204:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                        dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    } else {
                        dest[dp + dpL] = interp9(w[5], w[8], w[4]);
                        dest[dp + dpL + 1] = interp6(w[5], w[8], w[6]);
                    }
                    break;
                case 73:
                case 77:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp] = interp6(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp9(w[5], w[8], w[4]);
                    }
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 42:
                case 170:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + dpL] = interp1(w[5], w[8]);
                    } else {
                        dest[dp] = interp9(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp6(w[5], w[4], w[8]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 14:
                case 142:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = interp1(w[5], w[6]);
                    } else {
                        dest[dp] = interp9(w[5], w[4], w[2]);
                        dest[dp + 1] = interp6(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 67:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 70:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 28:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 152:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 194:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 98:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 56:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 25:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 26:
                case 31:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 82:
                case 214:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 88:
                case 248:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 74:
                case 107:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 27:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 86:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 216:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 106:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 30:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 210:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 120:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 75:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 29:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 198:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 184:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 99:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 57:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 71:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 156:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 226:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 60:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 195:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 102:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 153:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 58:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 83:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 92:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 202:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 78:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 154:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 114:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 89:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 90:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 55:
                case 23:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp] = interp6(w[5], w[2], w[4]);
                        dest[dp + 1] = interp9(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 182:
                case 150:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    } else {
                        dest[dp + 1] = interp9(w[5], w[2], w[6]);
                        dest[dp + dpL + 1] = interp6(w[5], w[6], w[8]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    break;
                case 213:
                case 212:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp6(w[5], w[6], w[2]);
                        dest[dp + dpL + 1] = interp9(w[5], w[6], w[8]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    break;
                case 241:
                case 240:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp6(w[5], w[8], w[4]);
                        dest[dp + dpL + 1] = interp9(w[5], w[6], w[8]);
                    }
                    break;
                case 236:
                case 232:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    } else {
                        dest[dp + dpL] = interp9(w[5], w[8], w[4]);
                        dest[dp + dpL + 1] = interp6(w[5], w[8], w[6]);
                    }
                    break;
                case 109:
                case 105:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp6(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp9(w[5], w[8], w[4]);
                    }
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 171:
                case 43:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + dpL] = interp1(w[5], w[8]);
                    } else {
                        dest[dp] = interp9(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp6(w[5], w[4], w[8]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 143:
                case 15:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = interp1(w[5], w[6]);
                    } else {
                        dest[dp] = interp9(w[5], w[4], w[2]);
                        dest[dp + 1] = interp6(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 124:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 203:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 62:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 211:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 118:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 217:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 110:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 155:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 188:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 185:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 61:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 157:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 103:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 227:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 230:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 199:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 220:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 158:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 234:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 242:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 59:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 121:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 87:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 79:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 122:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 94:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 218:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 91:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 229:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 167:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 173:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 181:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 186:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 115:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 93:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 206:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 205:
                case 201:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + dpL] = interp7(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 174:
                case 46:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[4]);
                    } else {
                        dest[dp] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 179:
                case 147:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 1] = interp7(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 117:
                case 116:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 1] = interp7(w[5], w[6], w[8]);
                    }
                    break;
                case 189:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 231:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 126:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 219:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 125:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp6(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp9(w[5], w[8], w[4]);
                    }
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 221:
                    dest[dp] = interp1(w[5], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp6(w[5], w[6], w[2]);
                        dest[dp + dpL + 1] = interp9(w[5], w[6], w[8]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    break;
                case 207:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = interp1(w[5], w[6]);
                    } else {
                        dest[dp] = interp9(w[5], w[4], w[2]);
                        dest[dp + 1] = interp6(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 238:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    } else {
                        dest[dp + dpL] = interp9(w[5], w[8], w[4]);
                        dest[dp + dpL + 1] = interp6(w[5], w[8], w[6]);
                    }
                    break;
                case 190:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    } else {
                        dest[dp + 1] = interp9(w[5], w[2], w[6]);
                        dest[dp + dpL + 1] = interp6(w[5], w[6], w[8]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    break;
                case 187:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + dpL] = interp1(w[5], w[8]);
                    } else {
                        dest[dp] = interp9(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp6(w[5], w[4], w[8]);
                    }
                    dest[dp + 1] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 243:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[3]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp6(w[5], w[8], w[4]);
                        dest[dp + dpL + 1] = interp9(w[5], w[6], w[8]);
                    }
                    break;
                case 119:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp] = interp6(w[5], w[2], w[4]);
                        dest[dp + 1] = interp9(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 237:
                case 233:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 175:
                case 47:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    break;
                case 183:
                case 151:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 245:
                case 244:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
                case 250:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 123:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 95:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 222:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 252:
                    dest[dp] = interp2(w[5], w[1], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
                case 249:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp2(w[5], w[3], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 235:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp2(w[5], w[3], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 111:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[6]);
                    break;
                case 63:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp2(w[5], w[9], w[8]);
                    break;
                case 159:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 215:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    dest[dp + dpL] = interp2(w[5], w[7], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 246:
                    dest[dp] = interp2(w[5], w[1], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
                case 254:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
                case 253:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
                case 251:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 239:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    dest[dp + 1] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[6]);
                    break;
                case 127:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp2(w[5], w[2], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + dpL + 1] = interp1(w[5], w[9]);
                    break;
                case 191:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    dest[dp + dpL] = interp1(w[5], w[8]);
                    dest[dp + dpL + 1] = interp1(w[5], w[8]);
                    break;
                case 223:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    dest[dp + dpL] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 247:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
                case 255:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]); 0
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp + 1] = interp1(w[5], w[3]); 0
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[7]); 0
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp + dpL + 1] = interp1(w[5], w[9]); 0
                    }
                    break;
            }
            sp++;
            dp += 2;
        }
        dp += dpL;
    }

    return dest;
};

const hq3x = (width: number, height: number): Array<number> => {
    const dest = new Array(width * height * 9);

    let
        prevline: number, nextline: number,
        w: number[] = [],
        dpL = width * 3,
        dp = 0,
        sp = 0;

    // internal to local optimization
    let YUV1: number, YUV2: number;

    //   +----+----+----+
    //   |	|	|	|
    //   | w1 | w2 | w3 |
    //   +----+----+----+
    //   |	|	|	|
    //   | w4 | w5 | w6 |
    //   +----+----+----+
    //   |	|	|	|
    //   | w7 | w8 | w9 |
    //   +----+----+----+

    for (let j = 0; j < height; j++) {
        prevline = j > 0 ? -width : 0;
        nextline = j < height - 1 ? width : 0;

        for (let i = 0; i < width; i++) {
            w[2] = src[sp + prevline];
            w[5] = src[sp];
            w[8] = src[sp + nextline];

            if (i > 0) {
                w[1] = src[sp + prevline - 1];
                w[4] = src[sp - 1];
                w[7] = src[sp + nextline - 1];
            } else {
                w[1] = w[2];
                w[4] = w[5];
                w[7] = w[8];
            }

            if (i < width - 1) {
                w[3] = src[sp + prevline + 1];
                w[6] = src[sp + 1];
                w[9] = src[sp + nextline + 1];
            } else {
                w[3] = w[2];
                w[6] = w[5];
                w[9] = w[8];
            }

            let pattern = 0;
            let flag = 1;

            YUV1 = RGBAtoYUV(w[5]);

            //for (k=1; k<=9; k++) optimized
            for (let k = 1; k < 10; k++) { // k<=9
                if (k === 5) continue;

                if (w[k] !== w[5]) {
                    YUV2 = RGBAtoYUV(w[k]);
                    if ((Math.abs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY) ||
                        (Math.abs((YUV1 & Umask) - (YUV2 & Umask)) > trU) ||
                        (Math.abs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV))
                        pattern |= flag;
                }
                flag <<= 1;
            }

            switch (pattern) {
                case 0:
                case 1:
                case 4:
                case 32:
                case 128:
                case 5:
                case 132:
                case 160:
                case 33:
                case 129:
                case 36:
                case 133:
                case 164:
                case 161:
                case 37:
                case 165:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 2:
                case 34:
                case 130:
                case 162:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 16:
                case 17:
                case 48:
                case 49:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 64:
                case 65:
                case 68:
                case 69:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 8:
                case 12:
                case 136:
                case 140:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 3:
                case 35:
                case 131:
                case 163:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 6:
                case 38:
                case 134:
                case 166:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 20:
                case 21:
                case 52:
                case 53:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 144:
                case 145:
                case 176:
                case 177:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 192:
                case 193:
                case 196:
                case 197:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 96:
                case 97:
                case 100:
                case 101:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 40:
                case 44:
                case 168:
                case 172:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 9:
                case 13:
                case 137:
                case 141:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 18:
                case 50:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 80:
                case 81:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 72:
                case 76:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 10:
                case 138:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 66:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 24:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 7:
                case 39:
                case 135:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 148:
                case 149:
                case 180:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 224:
                case 228:
                case 225:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 41:
                case 169:
                case 45:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 22:
                case 54:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 208:
                case 209:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 104:
                case 108:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 11:
                case 139:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 19:
                case 51:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 146:
                case 178:
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    } else {
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + 2] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    break;
                case 84:
                case 85:
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp5(w[6], w[8]);
                    }
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    break;
                case 112:
                case 113:
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + dpL + 2] = interp1(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp5(w[6], w[8]);
                    }
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    break;
                case 200:
                case 204:
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    break;
                case 73:
                case 77:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 42:
                case 170:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    } else {
                        dest[dp] = interp5(w[4], w[2]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 14:
                case 142:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp1(w[5], w[6]);
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[4], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 67:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 70:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 28:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 152:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 194:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 98:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 56:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 25:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 26:
                case 31:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 82:
                case 214:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                    } else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 88:
                case 248:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 74:
                case 107:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 27:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 86:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 216:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 106:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 30:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 210:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 120:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 75:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 29:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 198:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 184:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 99:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 57:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 71:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 156:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 226:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 60:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 195:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 102:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 153:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 58:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 83:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 92:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 202:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 78:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 154:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 114:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 89:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 90:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 55:
                case 23:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 182:
                case 150:
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    } else {
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + 2] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    break;
                case 213:
                case 212:
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp5(w[6], w[8]);
                    }
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    break;
                case 241:
                case 240:
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp1(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp5(w[6], w[8]);
                    }
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    break;
                case 236:
                case 232:
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    } else {
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    break;
                case 109:
                case 105:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 171:
                case 43:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    } else {
                        dest[dp] = interp5(w[4], w[2]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 143:
                case 15:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp1(w[5], w[6]);
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[4], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 124:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 203:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 62:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 211:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 118:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    } else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 217:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    } else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 110:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    } else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 155:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 188:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 185:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 61:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 157:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 103:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 227:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 230:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 199:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 220:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 158:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 234:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 242:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 59:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 121:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 87:
                    dest[dp] = interp1(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 79:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 122:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 94:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 218:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 91:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 229:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 167:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 173:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 181:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 186:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 115:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 93:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 206:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 205:
                case 201:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 174:
                case 46:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp1(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 179:
                case 147:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 117:
                case 116:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 189:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 231:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 126:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 219:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 125:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 221:
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp5(w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    break;
                case 207:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp1(w[5], w[6]);
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp5(w[4], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 238:
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    }
                    else {
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    break;
                case 190:
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    }
                    else {
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + 2] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    break;
                case 187:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    }
                    else {
                        dest[dp] = interp5(w[4], w[2]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 243:
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp1(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp5(w[6], w[8]);
                    }
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    break;
                case 119:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 237:
                case 233:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 175:
                case 47:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    break;
                case 183:
                case 151:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 245:
                case 244:
                    dest[dp] = interp2(w[5], w[4], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 250:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 123:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 95:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 222:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 252:
                    dest[dp] = interp1(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 249:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 235:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 111:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 63:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 159:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 215:
                    dest[dp] = interp1(w[5], w[4]);
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 246:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[4]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 254:
                    dest[dp] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 253:
                    dest[dp] = interp1(w[5], w[2]);
                    dest[dp + 1] = interp1(w[5], w[2]);
                    dest[dp + 2] = interp1(w[5], w[2]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
                case 251:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + dpL] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + dpL] = interp3(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 239:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp1(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp1(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[6]);
                    break;
                case 127:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp4(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp4(w[5], w[8], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[9]);
                    break;
                case 191:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp1(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp1(w[5], w[8]);
                    break;
                case 223:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp4(w[5], w[4], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[4]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = w[5];
                        dest[dp + dpL + 2] = w[5];
                    }
                    else {
                        dest[dp + 1] = interp3(w[5], w[2]);
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp4(w[5], w[6], w[8]);
                    }
                    break;
                case 247:
                    dest[dp] = interp1(w[5], w[4]);
                        dest[dp + 1] = w[5];
                        if (diffColor(w[2], w[6])) {
                            dest[dp + 2] = w[5];
                        }
                        else {
                            dest[dp + 2] = interp2(w[5], w[2], w[6]);
                        }
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        if (diffColor(w[6], w[8])) {
                            dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        }
                        else {
                            dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                        }
                        break;
                case 255:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    }
                    else {
                        dest[dp] = interp2(w[5], w[4], w[2]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp2(w[5], w[6], w[8]);
                    }
                    break;
            }
            sp++;
            dp += 3;
        }
        //dp += (dpL * 2); optimized
        dp += (dpL << 1);
    }

    return dest;
};

const hq4x = (width: number, height: number): Array<number> => {
    const dest = new Array(width * height * 16);

    let prevline: number, nextline: number,
        w: number[] = [],
        //dpL = width * 4, optimized
        dpL = width << 2,
        dp = 0,
        sp = 0;

    // internal to local optimization
    let YUV1: number, YUV2: number;

    //   +----+----+----+
    //   |    |    |    |
    //   | w1 | w2 | w3 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w4 | w5 | w6 |
    //   +----+----+----+
    //   |    |    |    |
    //   | w7 | w8 | w9 |
    //   +----+----+----+

    for (let j = 0; j < height; j++) {
        prevline = j > 0 ? -width : 0;
        nextline = j < height - 1 ? width : 0;

        for (let i = 0; i < width; i++) {
            w[2] = src[sp + prevline];
            w[5] = src[sp];
            w[8] = src[sp + nextline];

            if (i > 0) {
                w[1] = src[sp + prevline - 1];
                w[4] = src[sp - 1];
                w[7] = src[sp + nextline - 1];
            }
            else {
                w[1] = w[2];
                w[4] = w[5];
                w[7] = w[8];
            }

            if (i < width - 1) {
                w[3] = src[sp + prevline + 1];
                w[6] = src[sp + 1];
                w[9] = src[sp + nextline + 1];
            }
            else {
                w[3] = w[2];
                w[6] = w[5];
                w[9] = w[8];
            }

            let pattern = 0;
            let flag = 1;

            YUV1 = RGBAtoYUV(w[5]);

            //for (k=1; k<=9; k++) optimized
            for (let k = 1; k < 10; k++) // k<=9
            {
                if (k === 5) continue;

                if (w[k] !== w[5]) {
                    YUV2 = RGBAtoYUV(w[k]);
                    if ((Math.abs((YUV1 & Ymask) - (YUV2 & Ymask)) > trY) ||
                        (Math.abs((YUV1 & Umask) - (YUV2 & Umask)) > trU) ||
                        (Math.abs((YUV1 & Vmask) - (YUV2 & Vmask)) > trV))
                        pattern |= flag;
                }
                flag <<= 1;
            }

            switch (pattern) {
                case 0:
                case 1:
                case 4:
                case 32:
                case 128:
                case 5:
                case 132:
                case 160:
                case 33:
                case 129:
                case 36:
                case 133:
                case 164:
                case 161:
                case 37:
                case 165:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 2:
                case 34:
                case 130:
                case 162:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 16:
                case 17:
                case 48:
                case 49:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 64:
                case 65:
                case 68:
                case 69:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 8:
                case 12:
                case 136:
                case 140:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 3:
                case 35:
                case 131:
                case 163:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 6:
                case 38:
                case 134:
                case 166:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 20:
                case 21:
                case 52:
                case 53:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 144:
                case 145:
                case 176:
                case 177:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 192:
                case 193:
                case 196:
                case 197:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 96:
                case 97:
                case 100:
                case 101:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 40:
                case 44:
                case 168:
                case 172:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 9:
                case 13:
                case 137:
                case 141:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 18:
                case 50:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 80:
                case 81:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 72:
                case 76:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 10:
                case 138:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 66:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 24:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 7:
                case 39:
                case 135:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 148:
                case 149:
                case 180:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 224:
                case 228:
                case 225:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 41:
                case 169:
                case 45:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 22:
                case 54:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    }
                    else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 208:
                case 209:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 104:
                case 108:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 11:
                case 139:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 19:
                case 51:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp8(w[5], w[4]);
                        dest[dp + 1] = interp3(w[5], w[4]);
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    }
                    else {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp8(w[2], w[6]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                        dest[dp + dpL + 3] = interp2(w[6], w[5], w[2]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 146:
                case 178:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    }
                    else {
                        dest[dp + 2] = interp2(w[2], w[5], w[6]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                        dest[dp + dpL + 3] = interp8(w[6], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[6], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    break;
                case 84:
                case 85:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 3] = interp8(w[5], w[2]);
                        dest[dp + dpL + 3] = interp3(w[5], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    }
                    else {
                        dest[dp + 3] = interp1(w[5], w[6]);
                        dest[dp + dpL + 3] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[6], w[8]);
                        dest[dp + (dpL * 3) + 2] = interp2(w[8], w[5], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 112:
                case 113:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp2(w[6], w[5], w[8]);
                        dest[dp + (dpL * 3)] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp8(w[8], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 200:
                case 204:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                        dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    }
                    else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[4], w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp8(w[8], w[4]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    break;
                case 73:
                case 77:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp8(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    }
                    else {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[4], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp2(w[8], w[5], w[4]);
                    }
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 42:
                case 170:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    }
                    else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp2(w[2], w[5], w[4]);
                        dest[dp + dpL] = interp8(w[4], w[2]);
                        dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp1(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 14:
                case 142:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + 2] = interp3(w[5], w[6]);
                        dest[dp + 3] = interp8(w[5], w[6]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    }
                    else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp8(w[2], w[4]);
                        dest[dp + 2] = interp1(w[2], w[5]);
                        dest[dp + 3] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp2(w[4], w[5], w[2]);
                        dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 67:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 70:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 28:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 152:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 194:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 98:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 56:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 25:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 26:
                case 31:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    }
                    else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 82:
                case 214:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 88:
                case 248:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 74:
                case 107:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 27:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 86:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 216:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 106:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 30:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 210:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 120:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 75:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 29:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 198:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 184:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 99:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 57:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 71:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 156:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 226:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 60:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 195:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 102:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 153:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 58:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 83:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 92:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 202:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 78:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 154:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 114:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    break;
                case 89:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 90:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 55:
                case 23:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp8(w[5], w[4]);
                        dest[dp + 1] = interp3(w[5], w[4]);
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp8(w[2], w[6]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                        dest[dp + dpL + 3] = interp2(w[6], w[5], w[2]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 182:
                case 150:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    } else {
                        dest[dp + 2] = interp2(w[2], w[5], w[6]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                        dest[dp + dpL + 3] = interp8(w[6], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[6], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    break;
                case 213:
                case 212:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 3] = interp8(w[5], w[2]);
                        dest[dp + dpL + 3] = interp3(w[5], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp1(w[5], w[6]);
                        dest[dp + dpL + 3] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[6], w[8]);
                        dest[dp + (dpL * 3) + 2] = interp2(w[8], w[5], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 241:
                case 240:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp2(w[6], w[5], w[8]);
                        dest[dp + (dpL * 3)] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp8(w[8], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 236:
                case 232:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                        dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[4], w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp8(w[8], w[4]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    break;
                case 109:
                case 105:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp8(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[4], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp2(w[8], w[5], w[4]);
                    }
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 171:
                case 43:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                        dest[dp + dpL + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp2(w[2], w[5], w[4]);
                        dest[dp + dpL] = interp8(w[4], w[2]);
                        dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp1(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 143:
                case 15:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp3(w[5], w[6]);
                        dest[dp + 3] = interp8(w[5], w[6]);
                        dest[dp + dpL] = w[5];
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp8(w[2], w[4]);
                        dest[dp + 2] = interp1(w[2], w[5]);
                        dest[dp + 3] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp2(w[4], w[5], w[2]);
                        dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 124:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 203:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 62:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 211:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 118:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 217:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 110:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 155:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 188:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 185:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 61:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 157:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 103:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 227:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 230:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 199:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 220:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 158:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 234:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 242:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    break;
                case 59:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 121:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 87:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 79:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 122:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 94:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 218:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 91:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 229:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 167:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 173:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 181:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 186:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 115:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    break;
                case 93:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 206:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 205:
                case 201:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[4]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 174:
                case 46:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = interp8(w[5], w[1]);
                        dest[dp + 1] = interp1(w[5], w[1]);
                        dest[dp + dpL] = interp1(w[5], w[1]);
                        dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                        dest[dp + 1] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp1(w[5], w[4]);
                        dest[dp + dpL + 1] = w[5];
                    }
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 179:
                case 147:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = interp1(w[5], w[3]);
                        dest[dp + 3] = interp8(w[5], w[3]);
                        dest[dp + dpL + 2] = interp3(w[5], w[3]);
                        dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    } else {
                        dest[dp + 2] = interp1(w[5], w[2]);
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 117:
                case 116:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[6]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    break;
                case 189:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 231:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 126:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 219:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 125:
                    if (diffColor(w[8], w[4])) {
                        dest[dp] = interp8(w[5], w[2]);
                        dest[dp + dpL] = interp3(w[5], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[4]);
                        dest[dp + dpL] = interp1(w[4], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[4], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp2(w[8], w[5], w[4]);
                    }
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 221:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + 3] = interp8(w[5], w[2]);
                        dest[dp + dpL + 3] = interp3(w[5], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp1(w[5], w[6]);
                        dest[dp + dpL + 3] = interp1(w[6], w[5]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[6], w[8]);
                        dest[dp + (dpL * 3) + 2] = interp2(w[8], w[5], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 207:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + 2] = interp3(w[5], w[6]);
                        dest[dp + 3] = interp8(w[5], w[6]);
                        dest[dp + dpL] = w[5];
                        dest[dp + dpL + 1] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp8(w[2], w[4]);
                        dest[dp + 2] = interp1(w[2], w[5]);
                        dest[dp + 3] = interp1(w[5], w[2]);
                        dest[dp + dpL] = interp2(w[4], w[5], w[2]);
                        dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    }
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 238:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                        dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp2(w[4], w[5], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp8(w[8], w[4]);
                        dest[dp + (dpL * 3) + 2] = interp1(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp1(w[5], w[8]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    break;
                case 190:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                        dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    } else {
                        dest[dp + 2] = interp2(w[2], w[5], w[6]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                        dest[dp + dpL + 3] = interp8(w[6], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[6], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp1(w[5], w[6]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    break;
                case 187:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                        dest[dp + dpL + 1] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                        dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp2(w[2], w[5], w[4]);
                        dest[dp + dpL] = interp8(w[4], w[2]);
                        dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp1(w[5], w[4]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 243:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp2(w[6], w[5], w[8]);
                        dest[dp + (dpL * 3)] = interp1(w[5], w[8]);
                        dest[dp + (dpL * 3) + 1] = interp1(w[8], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp8(w[8], w[6]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 119:
                    if (diffColor(w[2], w[6])) {
                        dest[dp] = interp8(w[5], w[4]);
                        dest[dp + 1] = interp3(w[5], w[4]);
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 2] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp] = interp1(w[5], w[2]);
                        dest[dp + 1] = interp1(w[2], w[5]);
                        dest[dp + 2] = interp8(w[2], w[6]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                        dest[dp + dpL + 3] = interp2(w[6], w[5], w[2]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 237:
                case 233:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[6]);
                    dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp7(w[5], w[6], w[2]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    } else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 175:
                case 47:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp7(w[5], w[6], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    break;
                case 183:
                case 151:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp7(w[5], w[4], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[4]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 245:
                case 244:
                    dest[dp] = interp2(w[5], w[2], w[4]);
                    dest[dp + 1] = interp6(w[5], w[2], w[4]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp6(w[5], w[4], w[2]);
                    dest[dp + dpL + 1] = interp7(w[5], w[4], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 250:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    break;
                case 123:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 95:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 222:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 252:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp6(w[5], w[2], w[1]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 249:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp6(w[5], w[2], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    }
                    else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    break;
                case 235:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp6(w[5], w[6], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    }
                    else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 111:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp6(w[5], w[6], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 63:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp6(w[5], w[8], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 159:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp6(w[5], w[8], w[7]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 215:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp6(w[5], w[4], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 246:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp6(w[5], w[4], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 254:
                    dest[dp] = interp8(w[5], w[1]);
                    dest[dp + 1] = interp1(w[5], w[1]);
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = interp1(w[5], w[1]);
                    dest[dp + dpL + 1] = interp3(w[5], w[1]);
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 253:
                    dest[dp] = interp8(w[5], w[2]);
                    dest[dp + 1] = interp8(w[5], w[2]);
                    dest[dp + 2] = interp8(w[5], w[2]);
                    dest[dp + 3] = interp8(w[5], w[2]);
                    dest[dp + dpL] = interp3(w[5], w[2]);
                    dest[dp + dpL + 1] = interp3(w[5], w[2]);
                    dest[dp + dpL + 2] = interp3(w[5], w[2]);
                    dest[dp + dpL + 3] = interp3(w[5], w[2]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    } else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 251:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = interp1(w[5], w[3]);
                    dest[dp + 3] = interp8(w[5], w[3]);
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[3]);
                    dest[dp + dpL + 3] = interp1(w[5], w[3]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    } else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    break;
                case 239:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = interp3(w[5], w[6]);
                    dest[dp + 3] = interp8(w[5], w[6]);
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = interp3(w[5], w[6]);
                    dest[dp + dpL + 3] = interp8(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp8(w[5], w[6]);
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    } else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    dest[dp + (dpL * 3) + 2] = interp3(w[5], w[6]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[6]);
                    break;
                case 127:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 2] = w[5];
                        dest[dp + 3] = w[5];
                        dest[dp + dpL + 3] = w[5];
                    } else {
                        dest[dp + 2] = interp5(w[2], w[5]);
                        dest[dp + 3] = interp5(w[2], w[6]);
                        dest[dp + dpL + 3] = interp5(w[6], w[5]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                        dest[dp + (dpL * 3)] = w[5];
                        dest[dp + (dpL * 3) + 1] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp5(w[4], w[5]);
                        dest[dp + (dpL * 3)] = interp5(w[8], w[4]);
                        dest[dp + (dpL * 3) + 1] = interp5(w[8], w[5]);
                    }
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[9]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 2] = interp1(w[5], w[9]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[9]);
                    break;
                case 191:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = interp3(w[5], w[8]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp3(w[5], w[8]);
                    dest[dp + (dpL * 3)] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 1] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 2] = interp8(w[5], w[8]);
                    dest[dp + (dpL * 3) + 3] = interp8(w[5], w[8]);
                    break;
                case 223:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                        dest[dp + 1] = w[5];
                        dest[dp + dpL] = w[5];
                    } else {
                        dest[dp] = interp5(w[2], w[4]);
                        dest[dp + 1] = interp5(w[2], w[5]);
                        dest[dp + dpL] = interp5(w[4], w[5]);
                    }
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp1(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[7]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                        dest[dp + (dpL * 3) + 2] = w[5];
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = interp5(w[6], w[5]);
                        dest[dp + (dpL * 3) + 2] = interp5(w[8], w[5]);
                        dest[dp + (dpL * 3) + 3] = interp5(w[8], w[6]);
                    }
                    dest[dp + (dpL * 3)] = interp8(w[5], w[7]);
                    dest[dp + (dpL * 3) + 1] = interp1(w[5], w[7]);
                    break;
                case 247:
                    dest[dp] = interp8(w[5], w[4]);
                    dest[dp + 1] = interp3(w[5], w[4]);
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = interp8(w[5], w[4]);
                    dest[dp + dpL + 1] = interp3(w[5], w[4]);
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = interp8(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    dest[dp + (dpL * 3)] = interp8(w[5], w[4]);
                    dest[dp + (dpL * 3) + 1] = interp3(w[5], w[4]);
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
                case 255:
                    if (diffColor(w[4], w[2])) {
                        dest[dp] = w[5];
                    } else {
                        dest[dp] = interp2(w[5], w[2], w[4]);
                    }
                    dest[dp + 1] = w[5];
                    dest[dp + 2] = w[5];
                    if (diffColor(w[2], w[6])) {
                        dest[dp + 3] = w[5];
                    } else {
                        dest[dp + 3] = interp2(w[5], w[2], w[6]);
                    }
                    dest[dp + dpL] = w[5];
                    dest[dp + dpL + 1] = w[5];
                    dest[dp + dpL + 2] = w[5];
                    dest[dp + dpL + 3] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/)] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 1] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 2] = w[5];
                    dest[dp + (dpL << 1 /*==dpL * 2*/) + 3] = w[5];
                    if (diffColor(w[8], w[4])) {
                        dest[dp + (dpL * 3)] = w[5];
                    } else {
                        dest[dp + (dpL * 3)] = interp2(w[5], w[8], w[4]);
                    }
                    dest[dp + (dpL * 3) + 1] = w[5];
                    dest[dp + (dpL * 3) + 2] = w[5];
                    if (diffColor(w[6], w[8])) {
                        dest[dp + (dpL * 3) + 3] = w[5];
                    } else {
                        dest[dp + (dpL * 3) + 3] = interp2(w[5], w[8], w[6]);
                    }
                    break;
            }
            sp++;
            dp += 4;
        }
        dp += (dpL * 3);
    }

    return dest;
};
