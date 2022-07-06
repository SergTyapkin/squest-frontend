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
        <div class="text hide hidden" id="quest-info">Вы - соавтор квеста, а не создатель, потому некоторые возможности вам недоступны</div>
    </div>
            
    <div class="fields-container">
        <div id="title-fields">
            <label class="text-big">Название <span id="title-error"></span></label>
            <input id="title-input" type="text">
        </div>
        <div id="description-fields">
            <label class="text-big">Описание <span id="description-error"></span></label>
            <textarea id="description-input" class="text scrollable"></textarea>
        </div>
        <div id="branches-fields">
            <label class="text-big">Ветки <span id="branches-error"></span></label>
            <div class="info text-small">При просмотре квестов для игры вы будете видеть даже неопубликованные ветки, чтобы можно было поиграть и проверить ветку до её публикации</div>
            <ul id="branches-list" class="addable-list roll-closed">
                <!-- Branches will be there -->
            </ul>
            <input id="branches-button-new" type="button" value="Добавить ветку">
        </div>
        <div id="permissions-fields">
            <label class="text-big">Права доступа <span id="permissions-error"></span></label>
            <div class="info text-small">Белый список - те, кому разрешен просмотр квеста. Черный - кому запрещён. Черный не имеет значения, если есть белый</div>
            <ul id="permissions-list" class="addable-list roll-closed">
                <!-- Permissions will be there -->
            </ul>
            <input id="permissions-button-new" type="button" value="Добавить пользователя">
        </div>
        <div id="helpers-fields">
            <label class="text-big">Соавторы <span id="helpers-error"></span></label>
            <div class="info text-small">Хотите делать квест вместе? Просто добавьте никнеймы соавторов ниже и они получат доступ к редактированию квеста</div>
            <ul id="helpers-list" class="addable-list roll-closed">
                <!-- Helpers will be there -->
            </ul>
            <input id="helpers-button-new" type="button" value="Добавить соавтора">
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
    <span class="text-big-x orderid">{{ orderid }}</span>
    <div class="button rounded {{#if exists}}closed{{/if}} delete-button"><span class="cross"></span></div>
    <div class="{{#unless exists}}closed{{/unless}} move-buttons">
        <div class="button half-height rounded">˄</div>
        <div class="button half-height rounded">˅</div>
    </div>
    <input type="text" placeholder="Название ветки" value="{{ title }}" autocomplete="off">
    <div class="text-middle button rounded {{#unless exists}}closed{{/unless}} goto-button">
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

const helperTemplate = Handlebars.compile(`
<!--li-->
    <div class="button rounded"><span class="cross"></span></div>
    <input type="text" placeholder="Логин пользователя" value="{{ name }}">
<!--/li-->`);

export async function handler(element, app) {
    element.innerHTML = html;
    const searchParams = new URL(window.location.href).searchParams;
    const questId = searchParams.get('questId');

    const form = $("data-edit-form");
    const questInfo = $("quest-info");
    const titleFields = $("title-fields");
    const descriptionFields = $("description-fields");
    const branchesFields = $("branches-fields");
    const permissionsFields = $("permissions-fields");
    const helpersFields = $("helpers-fields");
    const publishedFields = $("published-fields");

    const titleInput = $("title-input");
    const descriptionInput = $("description-input");
    const publishedInput = $("published-input");

    const titleError = $("title-error");
    const descriptionError = $("description-error");

    const branchesList = $("branches-list");
    const newBranchButton = $("branches-button-new");
    const permList = $("permissions-list");
    const helpersList = $("helpers-list");
    const newPermButton = $("permissions-button-new");
    const newHelperButton = $("helpers-button-new");
    const saveButton = $("save-button");
    const deleteButton = $("delete-button");

    form.oninput = () => window.onbeforeunload = () => true;
    app.actions.ongoto = () => window.onbeforeunload = () => null;


    let response = await app.apiGet(`/quest?questId=${questId}`);
    const questData = await response.json();
    let helperMode = false;
    if (questData.helper) {
        helperMode = true;
        helpersFields.classList.add('hidden');
        deleteButton.classList.add('hidden');
        questInfo.classList.remove('hide', 'hidden');
    }
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

        const gotoButton = branchFields.querySelector('.goto-button');
        const moveButtons = branchFields.querySelector('.move-buttons');
        const orderid = branchFields.querySelector('.orderid');
        const toTopButton = moveButtons.firstElementChild;
        const toBottomButton = moveButtons.lastElementChild;

        gotoButton.addEventListener('click', async () => {
            const branchId = branchFields.getAttribute('data-branch-id');
            app.goto(`/branch-edit?branchId=${branchId}`);
        });

        toTopButton.addEventListener('click', () => {
            const prevEl = branchFields.previousElementSibling;
            if (!prevEl)
                return;
            const curOrderid = orderid.innerText;
            const prevOrderidEl = prevEl.querySelector('.orderid');
            orderid.innerText = prevOrderidEl.innerText;
            prevOrderidEl.innerText = curOrderid;
            branchesList.insertBefore(branchFields, branchFields.previousSibling);
        });
        toBottomButton.addEventListener('click', () => {
            const nextEl = branchFields.nextElementSibling;
            if (!nextEl?.getAttribute('data-branch-id'))
                return;
            const curOrderid = orderid.innerText;
            const nextOrderidEl = nextEl.querySelector('.orderid');
            orderid.innerText = nextOrderidEl.innerText;
            nextOrderidEl.innerText = curOrderid;
            branchesList.insertBefore(branchFields.nextSibling, branchFields);
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

    // --- get existing helpers
    if (!helperMode) {
    response = await app.apiGet(`/quest/helpers?questId=${questId}`);
    const helpersData = await response.json();
    helpersList.innerHTML = "";
    helpersData.forEach((helper) => {
        const helpersFields = document.createElement('li');
        helpersFields.innerHTML = helperTemplate(helper);
        helpersFields.setAttribute('data-helper-id', helper.id);
        helpersList.append(helpersFields);

        const deleteButton = helpersFields.firstElementChild;

        deleteButton.addEventListener('click', async () => {
            const helperId = helpersFields.getAttribute('data-helper-id');
            if (!await app.modal.confirm('Точно удаляем запись доступа?'))
                return;
            app.apiDelete('/quest/helpers', {id: helperId});
            helpersFields.remove();
            fastRoll(helpersList);
        });
    });
    openRoll(helpersList);
    }


    // click on "new branch"
    newBranchButton.addEventListener("click", () => {
        let lastOrderid = 0;
        if (branchesList.lastElementChild)
            lastOrderid = Number(branchesList.lastElementChild.querySelector('.orderid').innerText);

        const branchFields = document.createElement('li');
        branchFields.innerHTML = branchTemplate({title: '', orderid: lastOrderid + 1});
        branchesList.append(branchFields);

        const gotoButton = branchFields.querySelector('.goto-button');
        const deleteButton = branchFields.querySelector('.delete-button');
        const moveButtons = branchFields.querySelector('.move-buttons');
        const orderid = branchFields.querySelector('.orderid');
        const toTopButton = moveButtons.firstElementChild;
        const toBottomButton = moveButtons.lastElementChild;

        gotoButton.addEventListener('click', async () => {
            const branchId = branchFields.getAttribute('data-branch-id');
            app.goto(`/branch-edit?branchId=${branchId}`);
        });
        deleteButton.addEventListener('click', async () => {
            const branchId = branchFields.getAttribute('data-permission-id');
            if (branchId == null) {
                branchFields.remove();
                fastRoll(branchesList);
            }
        });
        toTopButton.addEventListener('click', () => {
            const prevEl = branchFields.previousElementSibling;
            if (!prevEl)
                return;
            const curOrderid = orderid.innerText;
            const prevOrderidEl = prevEl.querySelector('.orderid');
            orderid.innerText = prevOrderidEl.innerText;
            prevOrderidEl.innerText = curOrderid;
            branchesList.insertBefore(branchFields, branchFields.previousSibling);
        });
        toBottomButton.addEventListener('click', () => {
            const nextEl = branchFields.nextElementSibling;
            if (!nextEl?.getAttribute('data-branch-id'))
                return;
            const curOrderid = orderid.innerText;
            const nextOrderidEl = nextEl.querySelector('.orderid');
            orderid.innerText = nextOrderidEl.innerText;
            nextOrderidEl.innerText = curOrderid;
            branchesList.insertBefore(branchFields.nextSibling, branchFields);
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

    // click on "new helper"
    if (!helperMode) {
    newHelperButton.addEventListener("click", () => {
        const helpersFields = document.createElement('li');
        helpersFields.innerHTML = helperTemplate();
        helpersList.append(helpersFields);

        const deleteButton = helpersFields.firstElementChild;

        deleteButton.addEventListener('click', async () => {
            const helperId = helpersFields.getAttribute('data-permission-id');
            if (helperId !== null) {
                if (await app.modal.confirm('Точно удаляем соавтора?'))
                    app.apiDelete('/quest/privacy', {id: helperId});
                else
                    return;
            }
            helpersFields.remove();
            fastRoll(helpersList);
        });
        openRoll(helpersList);
    });
    }

    // save quest
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

        const branchesToCreate = [];
        const branchesToCreateElements = [];
        forEachChild(branchesList, async (el) => {
            const id = el.getAttribute('data-branch-id');
            const orderId = el.querySelector('.orderid');
            const title = el.querySelector('input').value.trim()
            const gotoButton = el.querySelector('.goto-button');
            const deleteButton = el.querySelector('.delete-button');
            const moveButtons = el.querySelector('.move-buttons');

            if (id !== null) { // branch already exists
                const response = await app.apiPut('/branch', {id, title, orderId: orderId.innerText});
                const resp = await response.json();

                if (!response.ok) {
                    setTimedClass([el], "error");
                    app.messages.error(`Ошибка ${response.status}!`, resp.info);
                } else {
                    setTimedClass([el], "success");
                }
            } else { // need to create new branch
                branchesToCreate.push({questId, title, description: ""});
                branchesToCreateElements.push({el, orderId, gotoButton, deleteButton, moveButtons});
            }
        });
        if (branchesToCreate.length !== 0) {
            const response = await app.apiPost('/branch/many', {questId: questId, branches: branchesToCreate});
            const resp = await response.json();
            if (response.ok) {
                branchesToCreateElements.forEach((element, idx) => {
                    const {el, orderId, gotoButton, deleteButton, moveButtons} = element;
                    el.setAttribute('data-branch-id', resp[idx].id);
                    orderId.innerText = resp[idx].orderid;
                    gotoButton.classList.remove('closed');
                    deleteButton.classList.add('closed');
                    moveButtons.classList.remove('closed');
                    setTimedClass([el], "success");
                });
            } else {
                setTimedClass([branchesList], "error");
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
            }
        }

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

        if (!helperMode) {
        forEachChild(helpersList, async (el) => {
            const id = el.getAttribute('data-helper-id');
            const name = el.querySelector('input[type=text]').value.trim()

            let response, resp;
            if (id !== null) {
                response = await app.apiPut('/quest/helpers', {id, questId, name});
                resp = await response.json();
            } else {
                response = await app.apiPost('/quest/helpers', {questId, name});
                resp = await response.json();
                if (response.ok)
                    el.setAttribute('data-helper-id', resp['id']);
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
        }

        window.onbeforeunload = () => null;
    });

    if (!helperMode) {
    deleteButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (await app.modal.confirm("Точно хочешь удалить квест?", "Все ветки и задания в нём будут удалены!")) {
            await app.apiDelete('/quest', {id: questId});
            app.goto('/me-quests');
        }
    })
    }
}
