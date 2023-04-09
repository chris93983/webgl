precision highp float;
varying vec2 v_TexCoord;
uniform vec2 v_TexSize;
uniform sampler2D u_Sampler;
uniform float u_Gamma;

struct surround {
    vec4 leftTop;
    vec4 top;
    vec4 rightTop;
    vec4 left;
    vec4 center;
    vec4 right;
    vec4 leftBottom;
    vec4 bottom;
    vec4 rightBottom;
} x1;

mat3 kernel1 = mat3(1.0, 0.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, -1.0);
mat3 kernel2 = mat3(-1.0, 0.0, 1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0);

mat3 kernel3 = mat3(1.0, 1.0, 1.0, 0.0, 0.0, 0.0, -1.0, -1.0, -1.0);
mat3 kernel4 = mat3(-1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0);

mat3 kernel5 = mat3(0.0, -1.0, 0.0, -1.0, 5.0, -1.0, 0.0, -1.0, 0.0);
float distanceX = 1.0 / v_TexSize.x;
float distanceY = 1.0 / v_TexSize.y;
vec4 texColor;

surround getSurround() {
    x1.leftTop = texture2D(u_Sampler, vec2(v_TexCoord.x - distanceX, v_TexCoord.y + distanceY));
    x1.rightTop = texture2D(u_Sampler, vec2(v_TexCoord.x + distanceX, v_TexCoord.y + distanceY));
    x1.leftBottom = texture2D(u_Sampler, vec2(v_TexCoord.x - distanceX, v_TexCoord.y - distanceY));
    x1.rightBottom = texture2D(u_Sampler, vec2(v_TexCoord.x + distanceX, v_TexCoord.y - distanceY));
    x1.left = texture2D(u_Sampler, vec2(v_TexCoord.x - distanceX, v_TexCoord.y));
    x1.right = texture2D(u_Sampler, vec2(v_TexCoord.x + distanceX, v_TexCoord.y));
    x1.top = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y + distanceY));
    x1.bottom = texture2D(u_Sampler, vec2(v_TexCoord.x, v_TexCoord.y - distanceY));
    x1.center = texColor;

    return x1;
}

float average(mat3 m3) {
    return (m3[0][0] + m3[0][1] + m3[0][2] + m3[1][0] + m3[1][1] + m3[1][2] + m3[2][0] + m3[2][1] + m3[2][2]) / 9.0;
}

vec4 convolution(mat3 kernel) {
    mat3 combinedR = mat3(x1.leftTop.r, x1.top.r, x1.rightTop.r, x1.left.r, x1.center.r, x1.right.r, x1.leftBottom.r, x1.bottom.r, x1.rightBottom.r);
    mat3 combinedG = mat3(x1.leftTop.g, x1.top.g, x1.rightTop.g, x1.left.g, x1.center.g, x1.right.g, x1.leftBottom.g, x1.bottom.g, x1.rightBottom.g);
    mat3 combinedB = mat3(x1.leftTop.b, x1.top.b, x1.rightTop.b, x1.left.b, x1.center.b, x1.right.b, x1.leftBottom.b, x1.bottom.b, x1.rightBottom.b);
    mat3 convR = combinedR * kernel;
    mat3 convG = combinedG * kernel;
    mat3 convB = combinedB * kernel;
    float r = average(convR);
    float g = average(convG);
    float b = average(convB);

    // return vec4(r, r, r, 1.0);
    // return vec4(g, g, g, 1.0);
    // return vec4(b, b, b, 1.0);
    return vec4(r, g, b, 1.0);
}

vec4 blur() {
    vec4 combinedColor = x1.leftTop + x1.rightTop + x1.leftBottom + x1.rightBottom + x1.left + x1.right + x1.top + x1.bottom + x1.center;
    vec4 finalColor = vec4(combinedColor.r / 9.0, combinedColor.g / 9.0, combinedColor.b / 9.0, texColor.a);

    return vec4(finalColor.r * u_Gamma, finalColor.g * u_Gamma, finalColor.b * u_Gamma, finalColor.a);
}

vec4 gamma() {
    return vec4(pow(texColor.rgb, vec3(u_Gamma)), texColor.a);;
}

void main() {
    texColor = texture2D(u_Sampler, v_TexCoord);
    getSurround();
    // gl_FragColor = gamma();
    gl_FragColor = convolution(kernel1);
    // gl_FragColor = texColor;
    // gl_FragColor = blur();
}
