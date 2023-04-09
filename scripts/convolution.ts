
import { getImageData } from './utils/get-image-data.js';
import { createImageFromFile } from './utils/create-image-from-file.js';
import { getSurroundingPixels } from './utils/get-pixel.js';
import { RGBA } from './models/rgba.js';

const kernels = [
    [1.0, 0.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, -1.0], // left
    [-1.0, 0.0, 1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0], // right
    [1.0, 1.0, 1.0, 0.0, 0.0, 0.0, -1.0, -1.0, -1.0], // top
    [-1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0], // bottom
];

(async () => {
    const kernelSelection = document.querySelector<HTMLSelectElement>('#kernels');
    const myCanvas = document.querySelector<HTMLCanvasElement>('#myCanvas');
    const context = myCanvas.getContext('2d');
    const kernelInputs = document.querySelectorAll<HTMLInputElement>('.kernel > input');
    const inputAll = document.querySelector<HTMLInputElement>('#inputAll');
    const btnChangeAll = document.querySelector<HTMLButtonElement>('#btnChangeAll');
    const btnRun = document.querySelector<HTMLButtonElement>('#btnRun');
    const clear = () => context.clearRect(0, 0, myCanvas.width, myCanvas.height);
    const onKernelSelectionChange = () => {
        currentKernel = JSON.parse(kernelSelection.value);
        currentKernel.forEach((kernelValue, i) => kernelInputs[i].value = kernelValue.toString());
    };
    const getKernelFromInput = () => kernelInputs.forEach((input, i) => currentKernel[i] = Number(input.value));
    const blob = await (await fetch('images/cell1.jpg')).blob();
    // const blob = await (await fetch('images/lena.jpeg')).blob();
    // const blob = await (await fetch('images/test.png')).blob();
    // const blob = await (await fetch('images/1.jpg')).blob();
    let currentKernel: number[];

    btnChangeAll.addEventListener('click', () => kernelInputs.forEach(input => input.value = inputAll.value));
    btnRun.addEventListener('click', async () => await convolution(blob));
    kernelSelection.addEventListener('change', () => onKernelSelectionChange());
    onKernelSelectionChange();

    const drawImage = async (blob: Blob, size = 3): Promise<void> => {
        if (blob) {
            clear();
            const image = await createImageFromFile(blob);
            myCanvas.width = image.width * size;
            myCanvas.height = image.height * size;
            context.drawImage(image, 0, 0);
        }
    };

    const convolutionPixels = (pixels: RGBA[], kernel = currentKernel): RGBA => {
        const sampled = pixels.map((pixel, i) => new RGBA(pixel.red * kernel[i], pixel.green * kernel[i], pixel.blue * kernel[i], pixel.alpha * kernel[i]));
        const conv = (numberArray: number[]) => numberArray.reduce((a, b) => a + b) / pixels.length;
        const [red, green, blue, alpha] = [conv(sampled.map(pixel => pixel.red)), conv(sampled.map(pixel => pixel.green)), conv(sampled.map(pixel => pixel.blue)), conv(sampled.map(pixel => pixel.alpha))];

        return new RGBA(red, green, blue, alpha);
    };

    const convolution = async (blob: Blob) => {
        clear();
        getKernelFromInput();
        const dataSource = await getImageData(URL.createObjectURL(blob));
        const dataDist = context.createImageData(dataSource.width - 2, dataSource.height - 2);

        for (let x = 1; x <= dataSource.width - 1; x++) {
            for (let y = 1; y <= dataSource.height - 1; y++) {
                const pixels = getSurroundingPixels(dataSource, { x, y });
                const result = convolutionPixels(pixels);
                // const [top, bottom, left, right] = [convolutionPixels(pixels, kernels[0]), convolutionPixels(pixels, kernels[1]), convolutionPixels(pixels, kernels[3]), convolutionPixels(pixels, kernels[3])];
                // const result = new RGBA(Math.max(top.red, bottom.red, left.red, right.red), Math.max(top.green, bottom.green, left.green, right.green), Math.max(top.blue, bottom.blue, left.blue, right.blue));
                const distI = ((y - 1) * dataDist.width + x - 1) * 4;
                [dataDist.data[distI], dataDist.data[distI + 1], dataDist.data[distI + 2], dataDist.data[distI + 3]] = [result.red, result.green, result.blue, 255];
            }
        }

        [myCanvas.width, myCanvas.height] = [dataDist.width, dataDist.height];
        context.putImageData(dataDist, 0, 0);
        console.log('dataDist', dataDist);
    };

    /**** calls ****/
    // await drawImage(blob);
    await convolution(blob);
})();
