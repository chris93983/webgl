precision highp float;
varying vec2 v_TexCoord;
uniform vec2 v_TexSize;
uniform sampler2D u_Sampler;
uniform float u_Gamma;

void main() {
    vec4 texColor = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y));
    // float distance = 0.005;
    // vec4 leftTop = texture2D(u_Sampler, vec2(v_TexCoord.x - distance / 2.0, v_TexCoord.y + distance / 2.0));
    // vec4 rightTop = texture2D(u_Sampler, vec2(v_TexCoord.x + distance / 2.0, v_TexCoord.y + distance / 2.0));
    // vec4 leftBottom = texture2D(u_Sampler, vec2(v_TexCoord.x - distance / 2.0, v_TexCoord.y - distance / 2.0));
    // vec4 rightBottom = texture2D(u_Sampler, vec2(v_TexCoord.x + distance / 2.0, v_TexCoord.y - distance / 2.0));
    // vec4 left = texture2D(u_Sampler, vec2(v_TexCoord.x - distance, v_TexCoord.y));
    // vec4 right = texture2D(u_Sampler, vec2(v_TexCoord.x + distance, v_TexCoord.y));
    // vec4 top = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y + distance));
    // vec4 bottom = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y - distance));
    // vec4 combinedColor = (leftTop + rightTop + leftBottom + rightBottom + left + right + top + bottom);
    // vec4 finalColor = vec4(combinedColor.r / 8.0, combinedColor.g / 8.0, combinedColor.b / 8.0, texColor.a);
    // gl_FragColor = vec4(finalColor.r * u_Gamma, finalColor.g * u_Gamma, finalColor.b * u_Gamma, finalColor.a);
    // gl_FragColor = vec4(texColor.r * u_Gamma, texColor.g * u_Gamma, texColor.b * u_Gamma, texColor.a);

    gl_FragColor = vec4(pow(texColor.rgb, vec3(u_Gamma)), texColor.a);
}
