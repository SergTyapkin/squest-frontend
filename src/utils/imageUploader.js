import {loadImageInBase64} from '@sergtyapkin/image-uploader';

export default class ImageUploader {
    popups = null;
    cropToSquare = null;
    compressSize = null;
    apiUpload = (dataURL) => {};

    constructor(popups, apiUpload, cropToSquare=false, compressSize=null) {
        this.popups = popups
        this.apiUpload = apiUpload;
        this.cropToSquare = cropToSquare;
        this.compressSize = compressSize;
    }

    async getUserImage() {
        let dataURL;
        try {
            dataURL = await loadImageInBase64(this.cropToSquare, this.compressSize, Infinity);
        } catch (err) {
            this.popups.error("Ошибка загрузки изображения", err.toString());
            throw err;
        }
        return dataURL;
    }

    async upload(dataURL) {
        if (dataURL === undefined)
            try {
                dataURL = await this.getUserImage();
            } catch {
                return;
            }

        const response = await this.apiUpload(dataURL);
        if (!response.ok_) {
            this.popups.error(`Ошибка ${response.status_}!`, `Не удалось загрузить картинку на сервер: ${response.info}`);
            return;
        }
        this.popups.success('Загружено', 'Картинка загружена');
        const id = response.id;

        return id;
    }
}
