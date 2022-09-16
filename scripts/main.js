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
    const myCanvas = document.querySelector('#myCanvas');
    const inputFile = document.querySelector('#inputFile');
    const gammaInput = document.querySelector('#gamma');
    const gl = myCanvas.getContext('webgl');
    const program = gl.createProgram();
    const textureImage = new Image();
    let [vShaderAttached, fShaderAttached] = [false, false];
    inputFile.addEventListener('change', e => drawImage(inputFile.files[0]));
    // gammaInput.addEventListener('change', e => drawImage(inputFile.files[0]));
    const useShader = async (url, vertex = false) => {
        if ((vertex && !vShaderAttached) || !fShaderAttached) {
            const shaderSource = await (await fetch(url)).text();
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
    };
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
        if (typeof data === 'number') {
            gl.uniform1f(position, data);
        }
        else {
            switch (data.length) {
                case 1:
                    gl.uniform1fv(position, data);
                    break;
                case 2:
                    gl.uniform2fv(position, data);
                    break;
                case 3:
                    gl.uniform3fv(position, data);
                    break;
                case 4:
                    gl.uniform4fv(position, data);
                    break;
            }
        }
    };
    const loadTexture = (source, textureNumber = gl.TEXTURE0) => {
        gl.useProgram(program);
        const texture = gl.createTexture();
        const uSampler = gl.getUniformLocation(program, 'u_Sampler');
        const addTexture = (sourceData) => {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(textureNumber);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // shrinking method.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // enlarging method.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sourceData);
            gl.uniform1i(uSampler, 0);
        };
        if (source instanceof ImageData) {
            addTexture(source);
        }
        else {
            return new Promise(resolve => {
                textureImage.onload = () => {
                    addTexture(textureImage);
                    resolve();
                };
                textureImage.src = source;
            });
        }
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
    const drawPoints = async () => {
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 4;
        setBuffer('a_Position', aPositionPoints, size); // Size 4 means every 4 items in aPositionPoints converts to a gl variable.
        gl.drawArrays(gl.POINTS, 0, aPositionPoints.length / size);
    };
    const drawColor = async () => {
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw();
    };
    const drawTriangle = async () => {
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw(new Float32Array([1.0, -1.0, 1.0, 1.0, -1.0, -1.0]));
    };
    const drawImage = async (blob, size = 3) => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const imageData = await getImageData(url);
            myCanvas.width = imageData.width * size;
            myCanvas.height = imageData.height * size;
            await useShader('shaders/fragment/image.glsl');
            await loadTexture(url);
            setUniform('v_TexSize', new Float32Array([myCanvas.width, myCanvas.height]));
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
