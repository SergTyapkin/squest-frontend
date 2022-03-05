import {$, setTimedClass} from '../modules/utils';

const html = `
<form id="register-form" class="form centered-horizontal">
    <div class="info-container">
        <div class="text-max">Регистрация</div>
        <div class="text">Ну давай, покажи всю свою оригинальность</div>
    </div>
    
    <div class="fields-container">
        <div id="name-fields">
            <label class="text-big">ЛОГИН <span id="name-error"></span></label>
            <input id="name-input" type="text" autocomplete="on">
        </div>
        <div id="password-fields">
            <label class="text-big">ПАРОЛЬ <span id="password-error"></span></label>
            <input id="password-input" type="password" autocomplete="on">
            <div class="info text-small">Не забудь его только</div>
        </div>
        <div id="email-fields">
            <label class="text-big">E-mail <span id="email-error"></span></label>
            <input id="email-input" type="email" autocomplete="on">
            <div class="info text-small">Когда-нибудь пароль придётся восстанавливать</div>
        </div>
    </div>
       
    <div class="submit-container">
        <input type="submit" value="Погнали">
        <div class="text info">Уже есть аккаунт? <linkButton href="/login">Войти</linkButton></div>
    </div>
</form>
`;

export function handler(element, app) {
    element.innerHTML = html;
    const form = $("register-form");
    const nameFields = $("name-fields");
    const emailFields = $("email-fields");
    const passwordFields = $("password-fields");
    const nameInput = $("name-input");
    const emailInput = $("email-input");
    const passwordInput = $("password-input");
    const nameError = $("name-error");
    const passwordError = $("password-error");

    nameInput.focus();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const response = await app.apiPost("/user", {username, password, email})
        const res = await response.json()

        switch (response.status) {
            case 200:
                app.setUser(res);
                app.goto("/me");
                break;
            case 401:
                setTimedClass([nameFields, passwordFields, emailFields], "error");
                break;
            case 409:
                setTimedClass([nameFields, passwordFields, emailFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, res.info);
        }
    });
}
