export class RGBA {
    constructor(red = 0, green = 0, blue = 0, alpha = 255) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }
    get hexRGB() {
        return `${hex(this.red)}${hex(this.green)}${hex(this.blue)}`;
    }
    get hexRGBA() {
        return `${this.hexRGB}${hex(this.alpha)}`;
    }
    get valueRGB() {
        return Number.parseInt(this.hexRGB, 16);
    }
    get valueRGBA() {
        return Number.parseInt(this.hexRGBA, 16);
    }
}
const hex = (input) => input.toString(16).padStart(2, '0');
