const html = `
<div class="form centered-horizontal">
    <div class="info-container">
        <div class="text-max">Ошибка 404</div>
        <div class="text-middle">Страница не найдена!</div>
    </div>
    <linkbutton href="/" class="button bg rounded fullwidth">На главную</linkbutton>
</div>
`;

/**
 * Renders page and "activating" it's js
 *
 * @param {object} element html element to be rendered in
 * @param {object} app object of a main App class
 */
export async function handler(element, app) {
    element.innerHTML = html;
}
