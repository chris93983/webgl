attribute vec4 a_Position;

void main() {
    gl_Position = a_Position;
    // gl_Position = vec4(-1.0, -1.0, 1.0, 1.0);
    gl_PointSize = 10.0;
}
