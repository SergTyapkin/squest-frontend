import * as renderer from './modules/renderer';

import { request } from './modules/requests';
import PopupMessages from './modules/popupMessages';
import Modal from './modules/modal';

import * as me from './views/me.html.js';
import * as login from './views/login.html.js';
import * as register from './views/register.html.js';
import * as about from './views/about.html.js';
import * as view404 from './views/404.html.js';
import * as quests from './views/quests.html';
import * as play from './views/play.html.js';
import * as rating from './views/rating.html.js';
import * as admin from './views/admin.html.js';
import * as questCreate from './views/questCreate.html.js';
import * as questEdit from './views/questEdit.html.js';
import * as myQuests from './views/myQuests.html.js';

const DEFAULT_AVATAR_URL = '/images/default_avatar.png';
const DEFAULT_BACKGROUND = undefined; //'linear-gradient(30deg, #110612 5%, #153131 15%, #2e143c 60%, #5d4e25 100%)';

export default class App {
     constructor(name, apiUrl, elId) {
        this.storage = {
            username: null,
            userId: null,
            avatarUrl: DEFAULT_AVATAR_URL.concat(),
            isAdmin: false,
            email: null,
            questId: null,
            branchId: null,
            branchLength: null
        };

        this.actions = {
            ongoto: null,
        }

        this.name = name;
        this.apiUrl = apiUrl;
        this.element = elId;

        this.messages = new PopupMessages();
        this.modal = new Modal();

        // tip: [A-Za-z0-9_]+ to any word
        this.routes = [
            {
                urlRegex: /^\/?$/,
                title: `${this.name} | О нас`,
                handler: about.handler,
                authRequired: false
            },
            {
                urlRegex: /^\/login$/,
                title: `${this.name} | Авторизация`,
                handler: login.handler,
                authRequired: false
            },
            {
                urlRegex: /^\/register$/,
                title: `${this.name} | Регистрация`,
                handler: register.handler,
                authRequired: false
            },
            {
                urlRegex: /^\/me$/,
                title: `${this.name} | Профиль`,
                handler: me.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/quests$/,
                title: `${this.name} | Квесты`,
                handler: quests.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/play$/,
                title: `${this.name} | Квест`,
                handler: play.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/rating$/,
                title: `${this.name} | Рейтинг`,
                handler: rating.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/quest-create$/,
                title: `${this.name} | Создать квест`,
                handler: questCreate.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/quest-edit\?questId=[0-9]*$/,
                title: `${this.name} | Изменить квест`,
                handler: questEdit.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/me-quests$/,
                title: `${this.name} | Мои квесты`,
                handler: myQuests.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/admin$/,
                title: `${this.name} | Админ`,
                handler: admin.handler,
                authRequired: true
            },
            {
                urlRegex: /^\/.*$/,
                title: `${this.name} | Страница потеряна`,
                handler: view404.handler,
                authRequired: false
            }
        ];

        window.addEventListener('popstate', async () => {
            await this.goto(location.pathname, false);
        });

        document.body.addEventListener('click', this.__bodyClick.bind(this));
    }

    async __bodyClick(event) {
        const targetElem = event.target;
        if (targetElem.tagName === 'LINKBUTTON') {
            event.preventDefault();
            const href = event.target.getAttribute('href');
            if (href) {
                 await this.goto(href);
            }
        }
    }

    apiRequest(method, path, data = {}) { return request(method, `${this.apiUrl}${path}`, data); }
    apiGet(path, data = {}) { return this.apiRequest('GET', path, data); }
    apiPost(path, data = {}) { return this.apiRequest('POST', path, data); }
    apiPut(path, data = {}) { return this.apiRequest('PUT', path, data); }
    apiDelete(path, data = {}) { return this.apiRequest('DELETE', path, data); }

    __getHandler(path) {
        for (const route of this.routes) {
            if (path.match(route.urlRegex)) {
                return route;
            }
        }
        return {};
    }

    async goto(path, pushState = true) {
        if (this.actions.ongoto) {
            this.actions.ongoto();
            this.actions.ongoto = null;
        }

        if (pushState) {
            history.pushState(null, null, path);
        }

        let { handler = view404.handler, authRequired = false, background = DEFAULT_BACKGROUND, title = 'Страница не найдена' } = this.__getHandler(path);

        if (authRequired && !this.storage.username) { // if not logined
            // const response = await this.apiGet("/user") // tries to get by cookie
            // const res = await response.json()
            // if (response.ok) {
            //     this.setUser(res.name, res.avatarurl, res.isadmin, res.email); // we are logined
            // } else {
                title = `${this.name} | Авторизация`; // not logined -> go to login
                history.pushState(null, null, '/login');
                handler = login.handler;
            // }
        }
        // console.log(authRequired, background, title, this.storage);
        await renderer.render(this.element, handler, background, title, this);
    }

    setUserElements(usernameElId, avatarElId) {
        this.usernameElement = document.getElementById(usernameElId);
        this.avatarElement = document.getElementById(avatarElId);
    }
    setUser({name, id, avatarurl, isadmin, email, chosenquestid, chosenbranchid}) {
        this.storage.username = name;
        this.storage.userId = id;
        if (!avatarurl || avatarurl === "null")
            avatarurl = DEFAULT_AVATAR_URL;
        this.storage.avatarUrl = avatarurl;
        this.storage.isAdmin = isadmin;
        this.storage.email = email;
        this.storage.questId = chosenquestid;
        this.storage.branchId = chosenbranchid;

        if (!name)
            this.usernameElement.innerText = "Войти";
        else
            this.usernameElement.innerText = name;
        this.avatarElement.setAttribute('src', avatarurl);
    }
    clearUser() {
        this.setUser({
            name: null,
            id: null,
            avatarurl: null,
            isadmin: false,
            email: null,
            chosenquestid: null,
            chosenbranchid: null
        });
        this.storage.branchLength = null;
    }

    async getLoginedUser() {
        const response = await this.apiGet("/user") // tries to get user by cookie
        const res = await response.json()
        if (response.ok) {
            this.setUser(res);
        }
    }
}
