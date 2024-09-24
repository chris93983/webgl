precision highp float;
uniform vec2 v_TexSize;
uniform vec3 v_Color;

void main() {
    gl_FragColor = vec4(v_Color.r, v_Color.g, v_Color.b, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
