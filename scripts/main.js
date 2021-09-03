var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getImageData } from './utils/get-image-data.js';
const aPositionPoints = new Float32Array([
    1.0, 1.0, 1.0, 1.0,
    1.0, -1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.5, 0.5, 1.0, 1.0,
]);
const aPosition = new Float32Array([
    1.0, -1.0,
    1.0, 1.0,
    -1.0, 1.0,
    -1.0, -1.0,
]);
const aTexCoord = new Float32Array([
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
]);
(() => __awaiter(void 0, void 0, void 0, function* () {
    const myCanvas = document.querySelector('#myCanvas');
    const inputFile = document.querySelector('#inputFile');
    const gammaInput = document.querySelector('#gamma');
    const gl = myCanvas.getContext('webgl');
    const program = gl.createProgram();
    const textureImage = new Image();
    let [vShaderAttached, fShaderAttached] = [false, false];
    inputFile.addEventListener('change', e => drawImage(inputFile.files[0]));
    // gammaInput.addEventListener('change', e => drawImage(inputFile.files[0]));
    const useShader = (url, vertex = false) => __awaiter(void 0, void 0, void 0, function* () {
        if ((vertex && !vShaderAttached) || !fShaderAttached) {
            const shaderSource = yield (yield fetch(url)).text();
            const shader = gl.createShader(vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
            gl.shaderSource(shader, shaderSource);
            gl.compileShader(shader);
            gl.attachShader(program, shader);
            gl.linkProgram(program);
            if (vertex) {
                vShaderAttached = true;
            }
            else {
                fShaderAttached = true;
            }
        }
    });
    const clear = () => {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };
    const setBuffer = (attribute, data, size = 1, stride = 0, offset = 0) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, attribute);
        gl.vertexAttribPointer(position, size, gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(position);
    };
    const setUniform = (uniform, data) => {
        const position = gl.getUniformLocation(program, uniform);
        gl.uniform1f(position, data);
    };
    const loadTexture = (url, textureNumber = gl.TEXTURE0) => {
        gl.useProgram(program);
        const texture = gl.createTexture();
        const uSampler = gl.getUniformLocation(program, 'u_Sampler');
        return new Promise(resolve => {
            textureImage.onload = () => {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                gl.activeTexture(textureNumber);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // shrinking method.
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // enlarging method.
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);
                gl.uniform1i(uSampler, 0);
                resolve();
            };
            textureImage.src = url;
        });
    };
    const draw = (positions = aPosition, useProgram = true) => {
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 2;
        setBuffer('a_Position', positions, size);
        setBuffer('a_TexCoord', aTexCoord, size);
        setUniform('u_Gamma', 1 / Number(gammaInput.value));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, positions.length / size);
    };
    /******** runable function ********/
    const drawPoints = () => __awaiter(void 0, void 0, void 0, function* () {
        yield useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 4;
        setBuffer('a_Position', aPositionPoints, size); // Size 4 means every 4 items in aPositionPoints converts to a gl variable.
        gl.drawArrays(gl.POINTS, 0, aPositionPoints.length / size);
    });
    const drawColor = () => __awaiter(void 0, void 0, void 0, function* () {
        yield useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw();
    });
    const drawTriangle = () => __awaiter(void 0, void 0, void 0, function* () {
        yield useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw(new Float32Array([
            1.0, -1.0,
            1.0, 1.0,
            -1.0, -1.0,
        ]));
    });
    const drawImage = (blob, size = 3) => __awaiter(void 0, void 0, void 0, function* () {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const imageData = yield getImageData(url);
            myCanvas.width = imageData.width * size;
            myCanvas.height = imageData.height * size;
            yield useShader('shaders/fragment/image.glsl');
            yield loadTexture(url);
            draw();
        }
    });
    /**** calls ****/
    yield useShader('shaders/vertex/common.glsl', true);
    // await drawPoints();
    // await drawColor();
    // await drawTriangle();
    const blob = yield (yield fetch('images/IfmPH.png')).blob();
    // const blob = await (await fetch('images/1.jpg')).blob();
    yield drawImage(blob);
    gammaInput.addEventListener('input', e => drawImage(blob));
}))();
