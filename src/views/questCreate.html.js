import {$, forEachChild, setTimedClass} from '../modules/utils';
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {fastRoll, openRoll} from "../modules/show-hide";

const html = `
<div class="title-container bg">
    <div>
        <div class="text-big-x lighting-text">Создание квеста</div>
        <div class="text">Давай сделаем что-нибудь эдакое</div>
    </div>
</div>

<div id="data-edit-form" class="form">
    <div class="fields-container">
        <div id="title-fields">
            <label class="text-big">Название <span id="title-error"></span></label>
            <input id="title-input" type="text">
        </div>
        <div id="description-fields">
            <label class="text-big">Описание <span id="description-error"></span></label>
            <textarea id="description-input" class="text"></textarea>
        </div>
        <div id="branches-fields">
            <label class="text-big">Ветки <span id="branches-error"></span></label>
            <ul id="branches-list" class="addable-list roll-closed">
                <!-- Branches will be there -->
            </ul>
            <input id="branches-button-new" type="button" value="Добавить ветку">
        </div>
        <div id="permissions-fields">
            <label class="text-big">Права доступа <span id="branches-error"></span></label>
            <div class="info text-small">Белый список - те, кому разрешен просмотр квеста. Черный - кому запрещён. Черный не имеет значения, если есть белый</div>
            <ul id="permissions-list" class="addable-list roll-closed">
                <!-- Permissions will be there -->
            </ul>
            <input id="permissions-button-new" type="button" value="Добавить пользователя">
        </div>
        <div id="published-fields">
            <label class="text-big">Опубликован <span id="published-error"></span></label>
            <input id="published-input" type="checkbox" class="switch" disabled>
            <div class="info text-small">
                Если не опубликован - это черновик. Никто кроме тебя не сможет просматривать квест<br>
                Опубликовать можно после создания и заполнения веток. Перед публикацией квест будет проверен модераторами
            </div>
        </div>
    </div>
       
    <div class="submit-container">
        <input id="save-button" type="submit" value="Сохранить">
    </div>
</div>
`;

const branchTemplate = Handlebars.compile(`
<!--li-->
    <div class="button rounded"><span class="cross"></span></div>
    <input data-branch-id="{{ id }}" type="text" placeholder="Название ветки" value="{{ title }}" autocomplete="off">
<!--/li-->`)

const permissionTemplate = Handlebars.compile(`
<!--li-->
    <div class="button rounded"><span class="cross"></span></div>
    <input type="text" placeholder="Логин пользователя" value="{{ name }}" autocomplete="off">
    <div class="text-middle radio">
        <input label="Белый" type="radio" name="{{ uid }}" value="false" checked>
        <input label="Черный" type="radio" name="{{ uid }}" value="true">
    </div>
<!--/li-->`)

export function handler(element, app) {
    element.innerHTML = html;
    const form = $("data-edit-form");
    const titleFields = $("title-fields");
    const descriptionFields = $("description-fields");
    const branchesFields = $("branches-fields");
    const permissionsFields = $("permissions-fields");
    const publishedFields = $("published-fields");

    const titleInput = $("title-input");
    const descriptionInput = $("description-input");
    const publishedInput = $("published-input");

    const titleError = $("title-error");
    const descriptionError = $("description-error");

    const branchesList = $("branches-list");
    const newBranchButton = $("branches-button-new");
    const permList = $("permissions-list");
    const newPermButton = $("permissions-button-new");
    const saveButton = $("save-button");

    titleInput.focus();

    form.oninput = () => window.onbeforeunload = () => true;
    app.actions.ongoto = () => window.onbeforeunload = () => null;

    // click on "new branch"
    newBranchButton.addEventListener("click", () => {
        const branchFields = document.createElement('li');
        branchFields.innerHTML = branchTemplate({id: '', title: ''});
        branchesList.append(branchFields);

        const deleteButton = branchFields.firstElementChild;
        deleteButton.addEventListener('click', () => {
            branchFields.remove();
            fastRoll(branchesList);
        });
        fastRoll(branchesList);
    });

    // click on "new permission"
    let permsCounter = 0;
    newPermButton.addEventListener("click", () => {
        const permFields = document.createElement('li');
        permFields.innerHTML = permissionTemplate({uid: permsCounter++});
        permList.append(permFields);

        const deleteButton = permFields.firstElementChild;
        deleteButton.addEventListener('click', async () => {
            permFields.remove();
            fastRoll(permList);
        });

        openRoll(permList);
    });


    // save quest => go to my quests
    saveButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const isPublished = publishedInput.checked;

        let questId;
        const response = await app.apiPost("/quest", {title, description, isPublished})
        const resp = await response.json();
        switch (response.status) {
            case 200:
                questId = resp.id;
                break;
            case 401:
                setTimedClass([titleFields, descriptionFields, publishedFields], "error");
                return;
            default:
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
                return;
        }

        forEachChild(branchesList, async (el) => {
            const title = el.querySelector('input').value.trim()

            const response = await app.apiPost('/branch', {questId, title, description: ""});
            const resp = await response.json();

            if (!response.ok) {
                setTimedClass([el], "error");
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
            } else {
                setTimedClass([el], "success");
            }
        });

        forEachChild(permList, async (el) => {
            const name = el.querySelector('input[type=text]').value.trim()
            const isInBlackList = el.querySelector('input[type="radio"]:checked').value;

            const response = await app.apiPost('/quest/privacy', {questId, name, isInBlackList});
            const resp = await response.json();

            if (!response.ok) {
                setTimedClass([el], "error");
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
            } else {
                setTimedClass([el], "success");
            }
        });

        if (questId !== undefined)
            app.goto(`/quest-edit?questId=${questId}`);
    });
}
