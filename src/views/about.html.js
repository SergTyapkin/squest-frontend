const html = `
<div class="about-page flex-filler">
    <div class="side-item left" >
        <div class="text-max">КУДА ТЫ ПОПАЛ?</div>
        <div class="text"><span class="text-big">Здесь</span> ты сможешь найти <span class="text-big">онлайн-квест</span> по душе, созданный нашими професси<i>онал</i>ами.</div>
    </div>
    <div class="side-item right">
        <div class="text-max">ЭТО ХОТЬ БЕСПЛАТНО?</div>
        <div class="text">Всё <span class="text-big">бесплатно</span> <s>пока что</s>.</div>
    </div>
    <div class="side-item left">
        <div class="text-max">КАК ПОЛЬЗОВАТЬСЯ?</div>
        <div class="text-big">Смотри, всё просто:
            <ul>
                <li class="text">регистрируешься</li>
                <li class="text">выбираешь квест и ветку</li> 
                <li class="text">чем больше проходишь - тем выше ты в рейтинге</li>
            </ul>
        </div>
    </div>
    <div class="side-item right">
        <div class="text-max">У МЕНЯ ОСТАЛИСЬ ВОПРОСЫ</div>
        <div class="text">Там снизу есть <span class="text-big">контакты</span> - пиши, не стестняйся.</div>
    </div>
    
    <linkButton class="text-big-x button highlight rounded centered-horizontal" href="/register">Зарегистрироваться</linkButton>
</div>

<footer id="footer">
    <li>
        <div class="title">За подсказками:</div>
        <div class="description"><a href="https://vk.com/squest_studio" target="_blank">vk.com/squest_studio</a></div>
    </li>
    <li>
        <div class="title">E-mail:</div>
        <div class="description">Tyapkin2002@mail.ru</div>
    </li>
    <li>
        <div class="title">VK: <small>(лучше сюда)</small> </div>
        <div class="description"><a href="https://vk.com/0pointer" target="_blank">vk.com/0pointer</a></div>
    </li>
    <li>
        <div class="title">Telegram:</div>
        <div class="description"><a href="https://t.me/tyapkin_s" target="_blank">t.me/tyapkin_s</a></div>
    </li>
</footer>
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
