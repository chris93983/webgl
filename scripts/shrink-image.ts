import { createImageFromFile } from "./utils/create-image-from-file.js";
import { getImageData } from "./utils/get-image-data.js";

const input = document.querySelector<HTMLInputElement>('#input');
const targetWidth = document.querySelector<HTMLInputElement>('#targetWidth');
const targetHeight = document.querySelector<HTMLInputElement>('#targetHeight');
const btnShrink = document.querySelector<HTMLInputElement>('#btnShrink');
const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
const context = canvas.getContext('2d');

input.addEventListener('change', async (e) => {
    if (input.files.length) {
        const file = input.files[0];
        const url = URL.createObjectURL(file);
        const data = await getImageData(url);
        targetWidth.value = data.width.toString();
        targetHeight.value = data.height.toString();
    }
});

btnShrink.addEventListener('click', async (e) => {
    if (input.files.length) {
        canvas.width = Number(targetWidth.value);
        canvas.height = Number(targetHeight.value);
        canvas.setAttribute('download', input.files[0].name);

        const file = input.files[0];
        const image = await createImageFromFile(file);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
});
