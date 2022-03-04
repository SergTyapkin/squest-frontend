import Handlebars from 'handlebars/dist/cjs/handlebars';

import '../styles/modal.styl';

const modalHTML = `
<span class="close-btn modal-close">
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z"/></svg>
</span>

<div id="modal-form" class="form centered-horizontal">
    <span class="close-btn modal-close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z"/></svg>
    </span>

    <div class="info-container">
        <div class="text-big-x">{{ title }}</div>
        <div class="text-middle">{{ description }}</div>
    </div>
    
    {{#if prompt }}
    <div class="fields-container">
        <div id="prompt-fields">
            <input id="modal-prompt-input" type="text">
        </div>
    </div>
    {{/if}}
       
    <div class="submit-container">
        {{#if prompt }}
            <input id="modal-submit-button" type="submit" value="Ок">
        {{else}}
            <span id="modal-submit-button" class="button rounded">Да</span>
            <span class="button rounded modal-close">Нет</span>
        {{/if}}
    </div>
</div>
`;

export default class Modal {
    constructor() {
        this.modalTemplate = Handlebars.compile(modalHTML);
    }

    async __createModal(title, description = "", prompt = false) {
        return new Promise((resolve) => {
            const background = document.createElement('div');
            background.classList.add('modal-background');
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.innerHTML = this.modalTemplate({title, description, prompt});
            background.appendChild(modal);

            const input = modal.querySelector('#modal-prompt-input');

            const submitBtn = modal.querySelector('#modal-submit-button');
            const submitClick = () => {
                background.remove();
                resolve((input) ? input.value : true);
                submitBtn.removeEventListener('click', submitClick);
            };
            submitBtn.addEventListener('click', submitClick);

            const closeBtns = modal.querySelectorAll('.modal-close');
            const closeClick = (ev) => {
                background.remove();
                resolve(false);
                ev.target.removeEventListener('click', closeClick);
            };
            for (const btn of closeBtns) {
                btn.addEventListener('click', closeClick);
            }

            document.body.prepend(background);
        });
    }

    async prompt(title, description) {
        return this.__createModal(title, description, true);
    }

    async confirm(title, description) {
        return this.__createModal(title, description, false);
    }
}
