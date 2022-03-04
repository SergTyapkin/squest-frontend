import {$, setTimedClass} from '../modules/utils';

const html = `
<form id="login-form" class="form centered-horizontal">
    <div class="info-container">
        <div class="text-max">Вход</div>
        <div class="text">Ну давай, вспомни пароль, войди в меня</div>
    </div>
    
    <div class="fields-container">
        <div id="name-fields">
            <label class="text-big">ЛОГИН <span id="name-error"></span></label>
            <input id="name-input" type="text">
        </div>
        <div id="password-fields">
            <label class="text-big">ПАРОЛЬ <span id="password-error"></span></label>
            <input id="password-input" type="password">
            <div class="info text-small"><linkButton href="/about">Забыл пароль?</linkButton> - пей таблетки</div>
        </div>
    </div>
    
    <div class="submit-container">
        <input type="submit" value="Погнали">
        <div class="text info">Нужен аккаунт? <linkButton href="/register">Создать</linkButton></div>
    </div>
</form>
`;

export function handler(element, app) {
    element.innerHTML = html;
    const form = $("login-form");
    const nameFields = $("name-fields");
    const passwordFields = $("password-fields");
    const nameInput = $("name-input");
    const passwordInput = $("password-input");
    const nameError = $("name-error");
    const passwordError = $("password-error");

    nameInput.focus();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = nameInput.value.trim();
        const password = passwordInput.value;

        const response = await app.apiPost("/user/auth", {username, password})
        const res = await response.json()

        switch (response.status) {
            case 200:
                app.setUser(res);
                await app.goto("/me");
                break;
            case 401:
                setTimedClass([nameFields, passwordFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, res.info);
        }
    });
}
