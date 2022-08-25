const html = `
<div id="details-block">
    <div id="back-button" class="title-container clickable low-opacity">
        <linkbutton href="/quests">
            <span class="text-big-x"><arrow class="arrow left"></arrow>К списку квестов</span>
        </linkbutton>
    </div>
    <div class="info-plate">
        <div class="text-big-x">Ты нашёл QR!
            <div class="text-middle">Но так низя(</div>
            <div id="details-quest-description" class="text">
                Кажется, этот QR является ответом на один из вопросов какого-то квеста. <br>
                Вот только чтобы он сработал, его нужно отсканировать не каким-то другим сканером, а сканером прямо со страницы с вопросом. <br>
                Что ж, удачи) А если ты нашёл этот QR случайно, то жми на кнопку ниже - там всё расскажут
            </div>
        </div>
        <linkButton id="confirm-button" class="text-big-x button rounded outline centered" href="/">На главную</linkButton>
    </div>
</div>
`;

export async function handler(element, app) {
    element.innerHTML = html;
}
