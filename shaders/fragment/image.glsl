precision highp float;
varying vec2 v_TexCoord;
uniform vec2 v_TexSize;
uniform sampler2D u_Sampler;
uniform float u_Gamma;

void main() {
    vec4 texColor = texture2D(u_Sampler, v_TexCoord);
    gl_FragColor = vec4(pow(texColor.rgb, vec3(u_Gamma)), texColor.a);
    // float distanceX = 1.0 / v_TexSize.x;
    // float distanceY = 1.0 / v_TexSize.y;
    // vec4 leftTop = texture2D(u_Sampler, vec2(v_TexCoord.x - distanceX, v_TexCoord.y + distanceY));
    // vec4 rightTop = texture2D(u_Sampler, vec2(v_TexCoord.x + distanceX, v_TexCoord.y + distanceY));
    // vec4 leftBottom = texture2D(u_Sampler, vec2(v_TexCoord.x - distanceX, v_TexCoord.y - distanceY));
    // vec4 rightBottom = texture2D(u_Sampler, vec2(v_TexCoord.x + distanceX, v_TexCoord.y - distanceY));
    // vec4 left = texture2D(u_Sampler, vec2(v_TexCoord.x - distanceX, v_TexCoord.y));
    // vec4 right = texture2D(u_Sampler, vec2(v_TexCoord.x + distanceX, v_TexCoord.y));
    // vec4 top = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y + distanceY));
    // vec4 bottom = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y - distanceY));
    // vec4 combinedColor = (leftTop + rightTop + leftBottom + rightBottom + left + right + top + bottom + texColor);
    // vec4 finalColor = vec4(combinedColor.r / 9.0, combinedColor.g / 9.0, combinedColor.b / 9.0, texColor.a);
    // gl_FragColor = vec4(finalColor.r * u_Gamma, finalColor.g * u_Gamma, finalColor.b * u_Gamma, finalColor.a);
}
