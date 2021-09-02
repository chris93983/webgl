var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const getImageData = (url) => {
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
(() => __awaiter(this, void 0, void 0, function* () {
    const myCanvas = document.querySelector('#myCanvas');
    const gl = myCanvas.getContext('webgl');
    const program = gl.createProgram();
    const aPosition = new Float32Array([
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);
    const aPositionPoints = new Float32Array([
        1.0, 1.0, 1.0, 1.0,
        1.0, -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.5, 0.5, 1.0, 1.0,
    ]);
    const useShader = (url, vertex = false) => __awaiter(this, void 0, void 0, function* () {
        const shaderSource = yield (yield fetch(url)).text();
        const shader = gl.createShader(vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        gl.linkProgram(program);
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
    const draw = (positions = aPosition) => {
        gl.useProgram(program);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 2;
        setBuffer('a_Position', positions, size);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, positions.length / size);
    };
    /******** runable function ********/
    const drawPoints = () => __awaiter(this, void 0, void 0, function* () {
        clear();
        yield useShader('shaders/fragment/color.glsl');
        gl.useProgram(program);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height);
        const size = 4;
        setBuffer('a_Position', aPositionPoints, size); // Size 4 means every 4 items in aPositionPoints converts to a gl variable.
        gl.drawArrays(gl.POINTS, 0, aPositionPoints.length / size);
    });
    const drawColor = () => __awaiter(this, void 0, void 0, function* () {
        clear();
        yield useShader('shaders/fragment/color.glsl');
        draw();
    });
    const drawTriangle = () => __awaiter(this, void 0, void 0, function* () {
        clear();
        yield useShader('shaders/fragment/color.glsl');
        draw(new Float32Array([
            1.0, -1.0,
            1.0, 1.0,
            -1.0, -1.0,
        ]));
    });
    const drawImage = () => __awaiter(this, void 0, void 0, function* () {
        clear();
        const blob = yield (yield fetch('images/1.jpg')).blob();
        const imageData = yield getImageData(URL.createObjectURL(blob));
        yield useShader('shaders/fragment/image.glsl');
        myCanvas.width = imageData.width;
        myCanvas.height = imageData.height;
        draw();
    });
    /****  ****/
    yield useShader('shaders/vertex/common.glsl', true);
    // await drawPoints();
    // await drawColor();
    yield drawTriangle();
    // await drawImage();
}))();
