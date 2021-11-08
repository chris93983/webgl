const [MASK_1, MASK_2, MASK_13] = [0xFF000000, 0x00FF00, 0xFF00FF];

export const interp1 = (c1: number, c2: number): number => {
    let result: number;
    //*pc = (c1*3+c2) >> 2;
    if (c1 === c2) {
        return c1;
    }
    console.log('interp1', c1, c2);
    result = ((((c1 & MASK_2) * 3 + (c2 & MASK_2)) >> 2) & MASK_2) + ((((c1 & MASK_13) * 3 + (c2 & MASK_13)) >> 2) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp2 = (c1: number, c2: number, c3: number): number => {
    let result: number;
    // console.log('interp2', c1, c2, c3);
    //*pc = (c1*2+c2+c3) >> 2;
    result = (((((c1 & MASK_2) << 1) + (c2 & MASK_2) + (c3 & MASK_2)) >> 2) & MASK_2) + (((((c1 & MASK_13) << 1) + (c2 & MASK_13) + (c3 & MASK_13)) >> 2) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp3 = (c1: number, c2: number): number => {
    let result: number;
    //*pc = (c1*7+c2)/8;
    if (c1 === c2) {
        return c1;
    }
    result = ((((c1 & MASK_2) * 7 + (c2 & MASK_2)) >> 3) & MASK_2) + ((((c1 & MASK_13) * 7 + (c2 & MASK_13)) >> 3) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp4 = (c1: number, c2: number, c3: number): number => {
    let result: number;
    //*pc = (c1*2+(c2+c3)*7)/16;
    result = (((((c1 & MASK_2) << 1) + (c2 & MASK_2) * 7 + (c3 & MASK_2) * 7) >> 4) & MASK_2) +
        (((((c1 & MASK_13) << 1) + (c2 & MASK_13) * 7 + (c3 & MASK_13) * 7) >> 4) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp5 = (c1: number, c2: number): number => {
    let result: number;
    //*pc = (c1+c2) >> 1;
    if (c1 === c2) {
        return c1;
    }
    result = ((((c1 & MASK_2) + (c2 & MASK_2)) >> 1) & MASK_2) + ((((c1 & MASK_13) + (c2 & MASK_13)) >> 1) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp6 = (c1: number, c2: number, c3: number): number => {
    let result: number;
    //*pc = (c1*5+c2*2+c3)/8;
    result = ((((c1 & MASK_2) * 5 + ((c2 & MASK_2) << 1) + (c3 & MASK_2)) >> 3) & MASK_2) + ((((c1 & MASK_13) * 5 + ((c2 & MASK_13) << 1) + (c3 & MASK_13)) >> 3) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp7 = (c1: number, c2: number, c3: number): number => {
    let result: number;
    //*pc = (c1*6+c2+c3)/8;
    result = ((((c1 & MASK_2) * 6 + (c2 & MASK_2) + (c3 & MASK_2)) >> 3) & MASK_2) + ((((c1 & MASK_13) * 6 + (c2 & MASK_13) + (c3 & MASK_13)) >> 3) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp8 = (c1: number, c2: number): number => {
    let result: number;
    //*pc = (c1*5+c2*3)/8;
    if (c1 === c2) {
        return c1;
    }
    result = ((((c1 & MASK_2) * 5 + (c2 & MASK_2) * 3) >> 3) & MASK_2) + ((((c1 & MASK_13) * 5 + (c2 & MASK_13) * 3) >> 3) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp9 = (c1: number, c2: number, c3: number): number => {
    let result: number;
    //*pc = (c1*2+(c2+c3)*3)/8;
    result = (((((c1 & MASK_2) << 1) + (c2 & MASK_2) * 3 + (c3 & MASK_2) * 3) >> 3) & MASK_2) +
        (((((c1 & MASK_13) << 1) + (c2 & MASK_13) * 3 + (c3 & MASK_13) * 3) >> 3) & MASK_13);
    return result |= (c1 & MASK_1);
};

export const interp10 = (c1: number, c2: number, c3: number): number => {
    let result: number;
    //*pc = (c1*14+c2+c3)/16;
    result = ((((c1 & MASK_2) * 14 + (c2 & MASK_2) + (c3 & MASK_2)) >> 4) & MASK_2) +
        ((((c1 & MASK_13) * 14 + (c2 & MASK_13) + (c3 & MASK_13)) >> 4) & MASK_13);
    return result |= (c1 & MASK_1);
};
