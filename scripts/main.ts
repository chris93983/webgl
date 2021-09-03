
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

(async () => {
    const myCanvas = document.querySelector<HTMLCanvasElement>('#myCanvas');
    const inputFile = document.querySelector<HTMLInputElement>('#inputFile');
    const gammaInput = document.querySelector<HTMLInputElement>('#gamma');
    const gl = myCanvas.getContext('webgl');
    const program = gl.createProgram();
    const textureImage = new Image();
    let [vShaderAttached, fShaderAttached] = [false, false];

    inputFile.addEventListener('change', e => drawImage(inputFile.files[0]));
    // gammaInput.addEventListener('change', e => drawImage(inputFile.files[0]));

    const useShader = async (url: string, vertex = false): Promise<void> => {
        if ((vertex && !vShaderAttached) || !fShaderAttached) {
            const shaderSource = await (await fetch(url)).text();
            const shader = gl.createShader(vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
            gl.shaderSource(shader, shaderSource);
            gl.compileShader(shader);
            gl.attachShader(program, shader);
            gl.linkProgram(program);

            if (vertex) {
                vShaderAttached = true;
            } else {
                fShaderAttached = true;
            }
        }
    };

    const clear = (): void => {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    const setBuffer = (attribute: string, data: Float32Array, size = 1, stride = 0, offset = 0): void => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        const position = gl.getAttribLocation(program, attribute);
        gl.vertexAttribPointer(position, size, gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(position);
    };

    const setUniform = (uniform: string, data: number): void => {
        const position = gl.getUniformLocation(program, uniform);
        gl.uniform1f(position, data);
    };

    const loadTexture = (url: string, textureNumber = gl.TEXTURE0): Promise<void> => {
        gl.useProgram(program);
        const texture = gl.createTexture();
        const uSampler = gl.getUniformLocation(program, 'u_Sampler');

        return new Promise(resolve => {
            textureImage.onload = (): void => {
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

    const draw = (positions = aPosition, useProgram = true): void => {
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 2;
        setBuffer('a_Position', positions, size);
        setBuffer('a_TexCoord', aTexCoord, size);
        setUniform('u_Gamma', 1 / Number(gammaInput.value));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, positions.length / size);
    };

    /******** runable function ********/

    const drawPoints = async (): Promise<void> => {
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 4;
        setBuffer('a_Position', aPositionPoints, size); // Size 4 means every 4 items in aPositionPoints converts to a gl variable.
        gl.drawArrays(gl.POINTS, 0, aPositionPoints.length / size);
    };

    const drawColor = async (): Promise<void> => {
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw();
    };

    const drawTriangle = async (): Promise<void> => {
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw(new Float32Array([
            1.0, -1.0,
            1.0, 1.0,
            -1.0, -1.0,
        ]));
    };

    const drawImage = async (blob: Blob, size = 3): Promise<void> => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const imageData = await getImageData(url);
            myCanvas.width = imageData.width * size;
            myCanvas.height = imageData.height * size;
            await useShader('shaders/fragment/image.glsl');
            await loadTexture(url);
            draw();
        }
    };

    /**** calls ****/

    await useShader('shaders/vertex/common.glsl', true);
    // await drawPoints();
    // await drawColor();
    // await drawTriangle();
    const blob = await (await fetch('images/IfmPH.png')).blob();
    // const blob = await (await fetch('images/1.jpg')).blob();
    await drawImage(blob);
    gammaInput.addEventListener('input', e => drawImage(blob));
})();
