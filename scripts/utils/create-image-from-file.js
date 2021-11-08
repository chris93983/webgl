export const createImageFromFile = async (file, callback = (resolve) => resolve()) => {
    const image = new Image();
    await new Promise(resolve => {
        image.onload = () => callback(resolve);
        image.src = file instanceof Blob ? URL.createObjectURL(file) : file;
    });
    return image;
};
