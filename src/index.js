import './styles/navbar.styl';
import './styles/footer.styl';
import './styles/forms.styl';
import './styles/buttons.styl';
import './styles/listings.styl';

import './styles/global.styl';
import './styles/pages.styl';
import './styles/show-hide.styl';
import './styles/switches.styl';
import './styles/elements.styl';
import './styles/markdown-redactor.styl';
import './styles/scrollbars.styl';

import { registerSW } from './modules/sw-installer.js';
import App from './app';

// const API_BASE_URL = 'https://your-site/api';
const API_BASE_URL = 'http://squest-api.herokuapp.com/api';
const APP_TITLE = 'SQuest';

const headContentHTML = '<link rel="icon" href="/images/favicon.ico" type="image/x-icon">';
const baseContentHTML = `
<div id="navbar" class="navbar absolute-wrapper">
    <div id="progress" class="center lighting-text progress">0</div>
    <div id="progressbar" class="bottom progressbar" style="--progress: 1"></div>
    <linkButton class="left  side-item opacity-in delayedBig" href="/quests" >Квесты</linkButton>
    <linkButton class="right side-item opacity-in delayedBig" href="/me">
        <span id="username">Войти</span><img id="avatar" class="image-small" src="images/default_avatar.png" alt="">
    </linkButton>
</div>

<div id="app">
    <div style="opacity: 0">
        squest - сайт для создания или прохождения чужих онлайн-квестов <br>
        Делайте свои или проходите уже созданные и проверенные другими людьми квесты <br>
        Здесь ты сможешь найти онлайн-квест по душе, созданный нашими профессионалами. <br>
        Всё бесплатно пока что) <br>
        1. регистрируешься <br>
        2. выбираешь квест и ветку <br>
        3. чем больше проходишь - тем выше ты в рейтинге <br>
        Если ты это читаешь на сайте, значит произошла какая-то ошибка на сервере. Попробуй обновить страницу через некоторое время. Этот текст был только для поисковика)
    </div>
</div>
`;

/**
 * Main function (entry point) of a frontend
 *
 */
async function main() {
    document.head.innerHTML += headContentHTML;
    document.body.innerHTML = baseContentHTML + document.body.innerHTML;
    document.body.classList.add('scrollable');

    // await registerSW();

    const { hostname, origin, pathname, search } = window.location;
    let apiUrl = API_BASE_URL;
    // if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    //     apiUrl = `${origin}/api`;
    // }
    const app = new App(APP_TITLE, apiUrl, 'app');
    app.setUserElements('username', 'avatar');
    await app.getLoginedUser();

    app.goto(pathname + search);
}

await main();
