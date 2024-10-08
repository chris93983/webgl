import { RGBA } from '../models/rgba.js';
export const getPixel = (data, index) => {
    const [i, rgba] = [(typeof index === 'number' ? index : index.x >= 0 && index.y >= 0 ? index.y * data.width + index.x : 0) * 4, new RGBA()];
    if (i >= 0) {
        [rgba.red, rgba.green, rgba.blue, rgba.alpha] = [data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3]];
    }
    return rgba;
};
export const getSurroundingPixels = (data, index, kernelSize = 3) => {
    const [pixels, indexMinus] = [[], (kernelSize - 1) / 2];
    if (typeof index === 'number') {
        index = { x: index % data.height, y: Math.floor(index / data.width) };
    }
    for (let x = index.x - indexMinus; x <= index.x + indexMinus; x++) {
        for (let y = index.y - indexMinus; y <= index.y + indexMinus; y++) {
            pixels.push(getPixel(data, { x, y }));
        }
    }
    return pixels;
};
