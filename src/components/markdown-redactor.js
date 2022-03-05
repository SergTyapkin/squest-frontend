import { getImageAsDataURL } from '@korolion/get-image-as-dataurl';

/**
 * Ensace text in message-input between fragments of text
 *
 * @param element - input element to work with
 * @param leftText - text to add on left side
 * @param rightText - text to add on left side
 */
function encaseInputText(element, leftText, rightText = '') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    if (start === end) {
        return;
    }
    const selected = leftText + element.value.substr(start, end - start) + rightText;
    element.value = element.value.substr(0, start) + selected + element.value.substr(end);
    element.dispatchEvent(new Event('input')); // trigger resize event-listener
    element.focus();
}

/**
 * Ensace text lines in message-input between fragments of text
 *
 * @param element - input element to work with
 * @param leftText - text to add on begin of line
 * @param rightText - text to add on end of line
 */
function encaseInputLines(element, leftText, rightText = '') {
    let start = element.selectionStart;
    let end = element.selectionEnd;
    start = element.value.substr(0, start).lastIndexOf('\n') + 1;
    if (start === -1) {
        start = 0;
    }
    const addToEndLength = element.value.substr(end).indexOf('\n');
    if (addToEndLength === -1) {
        end = element.value.length;
    } else {
        end += addToEndLength;
    }
    const selected = leftText + element.value.substring(start, end).replaceAll(/\n/g, rightText + '\n' + leftText) + rightText;
    element.value = element.value.substr(0, start) + selected + element.value.substr(end);
    element.dispatchEvent(new Event('input')); // trigger resize event-listener
    element.focus();
}


export default function MarkdownRedactor(redactorElement, inputElement, app) {
    const element = inputElement;
    const
        boldButton = redactorElement.querySelector('._bold'),
        italicButton = redactorElement.querySelector('._italic'),
        strikethroughButton = redactorElement.querySelector('._strikethrough'),
        codeButton = redactorElement.querySelector('._code'),
        h1Button = redactorElement.querySelector('._header-1'),
        h2Button = redactorElement.querySelector('._header-2'),
        h3Button = redactorElement.querySelector('._header-3'),
        blockquoteButton = redactorElement.querySelector('._blockquote'),
        listButton = redactorElement.querySelector('._list'),
        linkButton = redactorElement.querySelector('._link'),
        photoButton = redactorElement.querySelector('._photo')

    // Markdown buttons
    boldButton.addEventListener('mousedown', (event) => {
        encaseInputText(element, '**', '**');
    });
    italicButton.addEventListener('mousedown', (event) => {
        encaseInputText(element, ' _', '_ ');
    });
    strikethroughButton.addEventListener('mousedown', (event) => {
        encaseInputText(element, ' ~~', '~~ ');
    });
    codeButton.addEventListener('mousedown', (event) => {
        encaseInputText(element, '`', '`');
    });
    h1Button.addEventListener('mousedown', (event) => {
        encaseInputLines(element, '# ');
    });
    h2Button.addEventListener('mousedown', (event) => {
        encaseInputLines(element, '## ');
    });
    h3Button.addEventListener('mousedown', (event) => {
        encaseInputLines(element, '### ');
    });
    blockquoteButton.addEventListener('mousedown', (event) => {
        encaseInputLines(element, '> ');
    });
    listButton.addEventListener('mousedown', (event) => {
        encaseInputLines(element, '- ');
    });
    linkButton.addEventListener('mousedown', async (event) => {
        const link = await app.modal.prompt('Введите адрес ссылки');
        if (!link) {
            return;
        }
        const end = element.selectionEnd ? element.selectionEnd : 0;
        const name = await app.modal.prompt('Теперь придумайте ей замещающий текст (необязательно)');
        if (!name) {
            element.value = element.value.substr(0, end) + ' ' + link + ' ' + element.value.substr(end);
            return;
        }
        element.value = element.value.substr(0, end) + `[${name}](${link})` + element.value.substr(end);
        element.dispatchEvent(new Event('input')); // trigger oninput event-listener
    });

    const attachedImages = [];
    photoButton.addEventListener('mousedown', async (event) => {
        const dataURL = await getImageAsDataURL(0);
        if (attachedImages.includes(dataURL)) {
            return;
        }
        attachedImages.push(dataURL);

        const end = element.selectionEnd ? element.selectionEnd : 0;

        const response = await app.apiPost('/image', { dataUrl: dataURL });
        const responseData = await response.json();
        if (!response.ok) {
            app.messages.error(`Ошибка ${response.status}!`, `Не удалось загрузить картинку на сервер: ${responseData.message}`);
            return;
        }
        app.messages.success('Загружено', 'Картинка загружена');

        element.value = element.value.substr(0, end) + '![image](' + app.apiUrl + '/image/' + responseData.id + ')' + element.value.substr(end);
        element.dispatchEvent(new Event('input')); // trigger resize event-listener
    });
}
