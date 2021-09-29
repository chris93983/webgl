export const createImageFromFile = async (file: Blob | string, callback: (resolve: (value?: unknown) => void) => any = (resolve) => resolve()): Promise<HTMLImageElement> => {
    const image = new Image();
    await new Promise(resolve => {
        image.onload = () => callback(resolve);
        image.src = file instanceof Blob ? URL.createObjectURL(file) : file;
    });
    
    return image;
};
