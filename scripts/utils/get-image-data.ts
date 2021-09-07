export const getImageData = (url: string): Promise<ImageData> => {
    const image = new Image();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    image.src = url;

    return new Promise(resolve => image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
    });
};
