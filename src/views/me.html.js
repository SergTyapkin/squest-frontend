import {$, setTimedClass} from '../modules/utils';
import {closeRoll, isClosedRoll, openRoll, show} from "../modules/show-hide.js";

const html = `
<div class="profile-page">
    <div class="title-container clickable text-big">
        <linkButton href="/play">
            <span class="arrow left"></span>В игру
        </linkButton>
        <linkButton href="/me-quests">
            Мои квесты
        </linkButton>
        <linkButton href="/rating">
            Рейтинг<span class="arrow right"></span>
        </linkButton>
    </div>
    
    <div class="form centered-horizontal">
        <form id="form-profile" class="">
            <div class="info-container">
                <div class="text-max">Твой профиль</div>
                <div class="text">Интересно, да?</div>
            </div>
            
            <div class="fields-container">
                <div id="error" class="error-info text-middle"></div>
                <div id="name-fields">
                    <label class="text-big">ТВОЙ ЛОГИН <span id="name-error"></span></label>
                    <input id="name-input" type="text" autocomplete="off">
                </div>
                <div id="email-fields">
                    <label class="text-big">ТВОЙ E-mail <span id="email-error"></span></label>
                    <input id="email-input" type="email" autocomplete="off">
                    <div class="info text-small">Подтверждать придётся и со старой почты, и с новой (но это не точно)</div>
                </div>
            </div>
            
            <div class="submit-container">
                <div id="result-info" class="info text-small"></div>
                <input type="submit" value="Изменить данные">
            </div>
        </form>
        
        <form id="form-password">
            <div id="form-password-fields" class="fields-container roll-active closed">
                <div id="password-error" class="error-info text-middle"></div>
                <div id="old-password-fields">
                    <div class="info text-small" id="old-password-result-info"></div>
                    <input id="old-password-input" type="password" placeholder="Старый пароль" autocomplete="off">
                </div>
                <div id="new-password-fields">
                    <div class="info text-small" id="new-password-result-info"></div>
                    <input id="new-password-input" type="password" placeholder="Новый пароль" autocomplete="off">
                </div>
            </div>
            
            <div id="" class="submit-container">
                 <input type="submit" value="Сменить пароль">
            </div>
        </form>
        
        <linkButton id="logout-button" class="text-middle button bg outline rounded fullwidth" href="/">Выйти</linkButton>
    </div>

    <linkButton id="admin-button" class="text-big-x button rounded outline centered-horizontal hidden" href="/admin">На админскую</linkButton>
</div>
`;


export function handler(element, app) {
    element.innerHTML = html;

    const form = $("form-profile");
    const nameInput = $("name-input");
    const emailInput = $("email-input");
    const nameFields = $("name-fields");
    const emailFields = $("email-fields");

    const formPassword = $("form-password");
    const formPasswordFields = $("form-password-fields")
    const oldPasswordInput = $("old-password-input")
    const newPasswordInput = $("new-password-input")

    const error = $("error");
    const passwordError = $("password-error");

    const logoutButton = $("logout-button");
    const adminButton = $("admin-button");

    nameInput.value = app.storage.username;
    emailInput.value = app.storage.email;
    if (app.storage.isAdmin)
        show(adminButton);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = nameInput.value.trim();
        const email = emailInput.value.trim();
        // const avatarUrl ="?";

        const response = await app.apiPut("/user", {username, email})
        const res = await response.json();

        switch (response.status) {
            case 200:
                app.setUser(res);
                setTimedClass([nameFields, emailFields], "success");
                break;
            case 401:
            case 409:
                error.innerText = res.info;
                setTimedClass([error, nameFields, emailFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, res.info);
        }
    });

    formPassword.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isClosedRoll(formPasswordFields)) {
            openRoll(formPasswordFields);
            return;
        }

        const oldPassword = oldPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();

        const response = await app.apiPut("/user/password", {oldPassword, newPassword});
        const res = await response.json();
        switch (response.status) {
            case 200:
                setTimedClass([formPasswordFields], "success");
                break;
            case 401:
                passwordError.innerText = res.info;
                openRoll(formPasswordFields);
                setTimedClass([passwordError, formPasswordFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, res.info);
        }
    });

    logoutButton.addEventListener('click', async () => {
        await app.apiDelete('/user/session');
        app.clearUser();
    });
}
