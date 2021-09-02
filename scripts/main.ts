const getImageData = (url: string): Promise<ImageData> => {
    const image = new Image();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    image.src = url;

    return new Promise(resolve => image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
    });
};

(async () => {
    const myCanvas = document.querySelector<HTMLCanvasElement>('#myCanvas');
    const gl = myCanvas.getContext('webgl');
    const program = gl.createProgram();
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

    const useShader = async (url: string, vertex = false): Promise<void> => {
        const shaderSource = await (await fetch(url)).text();
        const shader = gl.createShader(vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        gl.linkProgram(program);
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

    const loadTexture = (url: string, textureNumber = gl.TEXTURE0): Promise<void> => {
        gl.useProgram(program);
        const texture = gl.createTexture();
        const image = new Image();
        const uSampler = gl.getUniformLocation(program, 'u_Sampler');

        return new Promise(resolve => {
            image.onload = (): void => {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                gl.activeTexture(textureNumber);
                gl.bindTexture(gl.TEXTURE_2D, texture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                gl.uniform1i(uSampler, 0);
                resolve();
            };
            image.src = url;
        });
    };

    const draw = (positions = aPosition, useProgram = true): void => {
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 2;
        setBuffer('a_Position', positions, size);
        setBuffer('a_TexCoord', aTexCoord, size);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, positions.length / size);
    };

    /******** runable function ********/

    const drawPoints = async (): Promise<void> => {
        clear();
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 4;
        setBuffer('a_Position', aPositionPoints, size); // Size 4 means every 4 items in aPositionPoints converts to a gl variable.
        gl.drawArrays(gl.POINTS, 0, aPositionPoints.length / size);
    };

    const drawColor = async (): Promise<void> => {
        clear();
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw();
    };

    const drawTriangle = async (): Promise<void> => {
        clear();
        await useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        draw(new Float32Array([
            1.0, -1.0,
            1.0, 1.0,
            -1.0, -1.0,
        ]));
    };

    const drawImage = async (): Promise<void> => {
        clear();
        const blob = await (await fetch('images/1.jpg')).blob();
        const url = URL.createObjectURL(blob);
        const imageData = await getImageData(url);
        myCanvas.width = imageData.width;
        myCanvas.height = imageData.height;
        await useShader('shaders/fragment/image.glsl');
        await loadTexture(url);
        draw();
    };

    /**** calls ****/

    await useShader('shaders/vertex/common.glsl', true);
    // await drawPoints();
    // await drawColor();
    // await drawTriangle();
    await drawImage();
})();
