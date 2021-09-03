precision highp float;
varying vec2 v_TexCoord;
uniform sampler2D u_Sampler;
uniform float u_Gamma;

void main() {
    vec4 texColor = texture2D(u_Sampler, v_TexCoord);
    gl_FragColor = vec4(texColor.r * u_Gamma, texColor.g * u_Gamma, texColor.b * u_Gamma, texColor.a);
}
