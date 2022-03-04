import {$, forEachChild, setTimedClass} from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, fastRoll, isClosedRoll, openRoll} from "../modules/show-hide";


const html = `
<div id="back-button" class="title-container clickable low-opacity">
    <linkButton href="/me-quests">
        <span class="text-big-x"><arrow class="arrow left"></arrow>Мои квесты</span>
    </linkButton>
</div>

<div id="data-edit-form" class="form">
    <div class="info-container">
        <div class="text-max">Изменить квест</div>
    </div>
            
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
            <input id="published-input" type="checkbox" class="switch">
                <div class="info text-small">
                    Если не опубликован - это черновик. Никто кроме тебя не сможет просматривать квест<br>
                    Перед публикацией квест будет проверен модераторами
                </div>
        </div>
    </div>

    <div class="submit-container">
        <input id="save-button" type="submit" value="Сохранить">
    </div>
    
    <div class="submit-container">
        <input id="delete-button" type="submit" value="Удалить квест">
    </div>
</div>
`;


const branchTemplate = Handlebars.compile(`
<!--li-->
    <div class="button rounded {{#if exists}}closed{{/if}}"><span class="cross"></span></div>
    <input type="text" placeholder="Название ветки" value="{{ title }}">
    <div class="text-middle button rounded {{#unless exists}}closed{{/unless}}">
        <span class="mobile-hide">Перейти</span> <span class="arrow right"></span>
    </div>
<!--/li-->`);

const permissionTemplate = Handlebars.compile(`
<!--li-->
    <div class="button rounded"><span class="cross"></span></div>
    <input type="text" placeholder="Логин пользователя" value="{{ name }}">
    <div class="text-middle radio">
        <input label="Белый" type="radio" name="{{ uid }}" value="false" {{#unless isinblacklist}}checked{{/unless}}>
        <input label="Черный" type="radio" name="{{ uid }}" value="true" {{#if isinblacklist}}checked{{/if}}>
    </div>
<!--/li-->`);

export async function handler(element, app) {
    element.innerHTML = html;
    const searchParams = new URL(window.location.href).searchParams;
    const questId = searchParams.get('questId');

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
    const deleteButton = $("delete-button");

    form.oninput = () => window.onbeforeunload = () => true;
    app.actions.ongoto = () => window.onbeforeunload = () => null;


    let response = await app.apiGet(`/quest?questId=${questId}`);
    let questData = await response.json();

    titleInput.value = questData.title;
    descriptionInput.value = questData.description;
    publishedInput.checked = questData.ispublished;

    // --- get existing branches
    response = await app.apiGet(`/branch?questId=${questId}`);
    const branchesData = await response.json();
    branchesList.innerHTML = "";
    branchesData.forEach((branch) => {
        const branchFields = document.createElement('li');
        branch.exists = true;
        branchFields.innerHTML = branchTemplate(branch);
        branchFields.setAttribute('data-branch-id', branch.id);
        branchesList.append(branchFields);

        const gotoButton = branchFields.lastElementChild;

        gotoButton.addEventListener('click', async () => {
            const branchId = branchFields.getAttribute('data-branch-id');
            await app.goto(`/branch-edit?branchId=${branchId}&questId=${questId}&questName=${titleInput.value}`);
        });
    });
    openRoll(branchesList);

    // --- get existing permissions
    response = await app.apiGet(`/quest/privacy?questId=${questId}`);
    const permissionsData = await response.json();
    let permsCounter = 0;
    permList.innerHTML = "";
    permissionsData.forEach((perm) => {
        const permFields = document.createElement('li');
        perm.uid = permsCounter++;
        permFields.innerHTML = permissionTemplate(perm);
        permFields.setAttribute('data-permission-id', perm.id);
        permList.append(permFields);

        const deleteButton = permFields.firstElementChild;

        deleteButton.addEventListener('click', async () => {
            const permId = permFields.getAttribute('data-permission-id');
            if (! await app.modal.confirm('Точно удаляем запись доступа?'))
                return;
            app.apiDelete('/quest/privacy', {id: permId});
            permFields.remove();
            fastRoll(permList);
        });
    });
    openRoll(permList);


    // click on "new branch"
    newBranchButton.addEventListener("click", () => {
        const branchFields = document.createElement('li');
        branchFields.innerHTML = branchTemplate({title: ''});
        branchesList.append(branchFields);

        const gotoButton = branchFields.lastElementChild;

        gotoButton.addEventListener('click', async () => {
            const branchId = branchFields.getAttribute('data-branch-id');
            await app.goto(`/branch-edit?branchId=${branchId}&questId=${questId}&questName=${titleInput.value}`);
        });
        openRoll(branchesList);
    });

    // click on "new permission"
    newPermButton.addEventListener("click", () => {
        const permFields = document.createElement('li');
        permFields.innerHTML = permissionTemplate({uid: permsCounter++});
        permList.append(permFields);

        const deleteButton = permFields.firstElementChild;

        deleteButton.addEventListener('click', async () => {
            const permId = permFields.getAttribute('data-permission-id');
            if (permId !== null) {
                if (await app.modal.confirm('Точно удаляем запись доступа?'))
                    app.apiDelete('/quest/privacy', {id: permId});
                else
                    return;
            }
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

        const response = await app.apiPut("/quest", {id: questId, title, description, isPublished})
        const resp = await response.json();
        switch (response.status) {
            case 200:
                setTimedClass([titleFields, descriptionFields, publishedFields], "success");
                break;
            case 401:
                setTimedClass([titleFields, descriptionFields, publishedFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
                break;
        }

        forEachChild(branchesList, async (el) => {
            const id = el.getAttribute('data-branch-id');
            const title = el.querySelector('input').value.trim()
            const gotoButton = el.lastElementChild;
            const deleteButton = el.firstElementChild;

            let response, resp;
            if (id !== null) {
                response = await app.apiPut('/branch', {id, title});
                resp = await response.json();
            } else {
                response = await app.apiPost('/branch', {questId, title, description: ""});
                resp = await response.json();
                if (response.ok) {
                    el.setAttribute('data-branch-id', resp['id']);
                    gotoButton.classList.remove('closed');
                    deleteButton.classList.add('closed');
                }
            }

            if (!response.ok) {
                setTimedClass([el], "error");
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
            } else {
                setTimedClass([el], "success");
            }
        });

        forEachChild(permList, async (el) => {
            const id = el.getAttribute('data-permission-id');
            const name = el.querySelector('input[type=text]').value.trim()
            const isInBlackList = el.querySelector('input[type="radio"]:checked').value;

            let response, resp;
            if (id !== null) {
                response = await app.apiPut('/quest/privacy', {id, questId, name, isInBlackList});
                resp = await response.json();
            } else {
                response = await app.apiPost('/quest/privacy', {questId, name, isInBlackList});
                resp = await response.json();
                if (response.ok)
                    el.setAttribute('data-permission-id', resp['id']);
            }

            switch (response.status) {
                case 200:
                    setTimedClass([el], "success");
                    break;
                case 404:
                    setTimedClass([el], "error");
                    break;
                case 409:
                    setTimedClass([el], "error");
                    break;
                default:
                    app.messages.error(`Ошибка ${response.status}!`, resp.info);
                    break;
            }
        });

        window.onbeforeunload = () => null;
    });


    deleteButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (await app.modal.confirm("Точно хочешь удалить квест?", "Все ветки и задания в нём будут удалены!")) {
            await app.apiDelete('/quest', {id: questId});
            await app.goto('/me-quests');
        }
    })
}
