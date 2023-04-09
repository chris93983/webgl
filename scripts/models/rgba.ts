export class RGBA {
    get hexRGB(): string {
        return `${hex(this.red)}${hex(this.green)}${hex(this.blue)}`;
    }

    get hexRGBA(): string {
        return `${this.hexRGB}${hex(this.alpha)}`;
    }

    get valueRGB(): number {
        return Number.parseInt(this.hexRGB, 16);
    }

    get valueRGBA(): number {
        return Number.parseInt(this.hexRGBA, 16);
    }

    constructor(
        public red = 0,
        public green = 0,
        public blue = 0,
        public alpha = 255,
    ) {}
}

const hex = (input: number): string => input.toString(16).padStart(2, '0');
