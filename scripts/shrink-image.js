var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createImageFromFile } from "./utils/create-image-from-file.js";
import { getImageData } from "./utils/get-image-data.js";
const input = document.querySelector('#input');
const targetWidth = document.querySelector('#targetWidth');
const targetHeight = document.querySelector('#targetHeight');
const btnShrink = document.querySelector('#btnShrink');
const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');
input.addEventListener('change', (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (input.files.length) {
        const file = input.files[0];
        const url = URL.createObjectURL(file);
        const data = yield getImageData(url);
        targetWidth.value = data.width.toString();
        targetHeight.value = data.height.toString();
    }
}));
btnShrink.addEventListener('click', (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (input.files.length) {
        canvas.width = Number(targetWidth.value);
        canvas.height = Number(targetHeight.value);
        canvas.setAttribute('download', input.files[0].name);
        const file = input.files[0];
        const image = yield createImageFromFile(file);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
}));
