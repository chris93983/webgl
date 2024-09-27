import { getImageData } from './utils/get-image-data.js';

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
    const [myCanvas, fps, video] = [document.querySelector<HTMLCanvasElement>('#myCanvas'), document.querySelector<HTMLElement>('#fps'), document.querySelector<HTMLVideoElement>('#test_video')];
    const gl = myCanvas.getContext('webgl');
    const [program, textureImage] = [gl.createProgram(), new Image()];
    let [vShaderAttached, fShaderAttached, now] = [false, false, performance.now()];

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

    const setBuffer = (attribute: string, data: Float32Array, size = 1, stride = 0, offset = 0): void => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        const position = gl.getAttribLocation(program, attribute);
        gl.vertexAttribPointer(position, size, gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(position);
    };

    const setUniform = (uniform: string, data: number | Float32Array): void => {
        const position = gl.getUniformLocation(program, uniform);

        if (typeof data === 'number') {
            gl.uniform1f(position, data);
        } else {
            switch (data.length) {
                case 1: gl.uniform1fv(position, data); break;
                case 2: gl.uniform2fv(position, data); break;
                case 3: gl.uniform3fv(position, data); break;
                case 4: gl.uniform4fv(position, data); break;
            }
        }
    };

    const updateFps = () => {
        const pNow = performance.now();
        fps.innerText = `${(1000 / (pNow - now)).toFixed(1)}`;
        now = pNow;
    };

    const draw = (positions = aPosition): void => {
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 2;
        setBuffer('a_Position', positions, size);
        setBuffer('a_TexCoord', aTexCoord, size);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, positions.length / size);
        updateFps();
    };

    const loadTexture = (source: string | ImageData, textureNumber = gl.TEXTURE0): Promise<void> => {
        gl.useProgram(program);
        const texture = gl.createTexture();
        const uSampler = gl.getUniformLocation(program, 'u_Sampler');
        const addTexture = (sourceData: ImageData | HTMLImageElement): void => {
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
        } else {
            return new Promise(resolve => {
                textureImage.onload = (): void => {
                    addTexture(textureImage);
                    resolve();
                };
                textureImage.src = source;
            });
        }
    };

    const drawColorRandom = async () => {
        await useShader('shaders/fragment/color-random.glsl');
        gl.useProgram(program);
        setUniform('v_Color', new Float32Array([Math.random(), Math.random(), Math.random()]));
        setUniform('v_TexSize', new Float32Array([myCanvas.width, myCanvas.height]));
        draw();
        setTimeout(drawColorRandom);
    };

    const drawImage = async (blob: Blob, size = 3): Promise<void> => {
        const url = URL.createObjectURL(blob);
        const imageData = await getImageData(url);
        myCanvas.width = imageData.width * size;
        myCanvas.height = imageData.height * size;
        await useShader('shaders/fragment/image.glsl');
        await loadTexture(url);
        setUniform('v_TexSize', new Float32Array([myCanvas.width, myCanvas.height]));
        draw();
        setTimeout(() => drawImage(blob));
    };

    /**** calls ****/
    await useShader('shaders/vertex/common.glsl', true);
    // const blob = await (await fetch('images/IfmPH.png')).blob();
    // const blob = await (await fetch('images/4k.jpg')).blob();
    // const blob = await (await fetch('images/cell1.jpg')).blob();
    // await drawImage(blob);
    // drawColorRandom();

    let [decodedFrames, canplay] = [0, false];
    video.addEventListener('canplay', () => {
        if (!canplay) {
            setInterval(() => {
                canplay = true;
                const decoded = (video as any).webkitDecodedFrameCount;
                fps.innerText = `${decoded - decodedFrames}`;
                console.log(`${fps.innerText}fps`);
                decodedFrames = decoded;
            }, 1000);
        } });
})();
