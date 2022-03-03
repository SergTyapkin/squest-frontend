import {$, setTimedClass} from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, isClosedRoll, openRoll} from "../modules/show-hide";


const html = `
<div id="back-button" class="title-container clickable low-opacity">
    <linkButton href="/me-quests">
        <span class="text-big-x"><arrow class="arrow left"></arrow>Мои квесты</span>
    </linkButton>
</div>

<div id="quest-create-form" class="form">
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
            <div class="info text-small">Останутся только ветки с непустым именем. Чтобы изменить ветку, надо перейти в неё</div>
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
                    Опубликовать можно после создания и заполнения веток. Перед публикацией квест будет проверен модераторами
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
    <input type="text" placeholder="Название ветки" value="{{ title }}">
    <div class="text-middle button rounded {{#unless opened}}closed{{/unless}}">
        <span class="mobile-hide">Перейти</span> <span class="arrow right"></span>
    </div>
<!--/li-->`);

const permissionTemplate = Handlebars.compile(`
<!--li-->
    <input type="text" placeholder="Логин пользователя" value="{{ name }}">
    <div class="text-middle radio">
        <input label="Белый" type="radio" name="{{ orderid }}" value="false" {{#unless isinblacklist}}checked{{/unless}}>
        <input label="Черный" type="radio" name="{{ orderid }}" value="true" {{#if isinblacklist}}checked{{/if}}>
    </div>
<!--/li-->`);

export async function handler(element, app) {
    element.innerHTML = html;
    const searchParams = new URL(window.location.href).searchParams;
    const questId = searchParams.get('questId');

    const form = $("quest-create-form");
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

    let response = await app.apiGet(`/quest?questId=${questId}`);
    let questData = await response.json();

    titleInput.value = questData.title;
    descriptionInput.value = questData.description;
    publishedInput.checked = questData.ispublished;

    // --- get existing branches
    response = await app.apiGet(`/branch?questId=${questId}`);
    const branchesData = await response.json();
    branchesList.innerHTML = "";
    branchesData.forEach((branch, idx) => {
        const branchFields = document.createElement('li');
        branch.opened = true;
        branchFields.innerHTML = branchTemplate(branch);
        branchFields.setAttribute('data-branch-orderid', idx);
        branchesList.append(branchFields);
    });
    openRoll(branchesList);

    // --- get existing permissions
    response = await app.apiGet(`/quest/privacy?questId=${questId}`);
    const permissionsData = await response.json();
    let permsCounter = 0;
    permList.innerHTML = "";
    permissionsData.forEach(perm => {
        const permFields = document.createElement('li');
        perm.orderid = permsCounter++;
        permFields.innerHTML = permissionTemplate(perm);
        permList.append(permFields);
    });
    openRoll(permList);


    form.oninput = () => window.onbeforeunload = () => true;
    app.actions.ongoto = () => window.onbeforeunload = () => null;

    // click on "new branch"
    newBranchButton.addEventListener("click", () => {
        const branchFields = document.createElement('li');
        branchFields.innerHTML = branchTemplate({id: '', title: ''});
        branchesList.append(branchFields);

        const titleInput = branchFields.firstElementChild;
        const branchButton = branchFields.lastElementChild;
        // onEdit branch title
        titleInput.addEventListener('input', () => {
            if (titleInput.value !== "") {
                branchButton.classList.remove('closed');
                return;
            }
            branchButton.classList.add('closed');
        });
        // click on "edit branch"
        branchButton.addEventListener('click', async () => {
            saveButton.dispatchEvent(new Event('click')); // trigger save quest event-listener
            const branchId = branchFields.getAttribute('data-branch-id');
            await app.goto(`/branch-edit?branchId=${branchId}`);
        });
        openRoll(branchesList);
    });

    // click on "new permission"
    newPermButton.addEventListener("click", () => {
        const permFields = document.createElement('li');
        permFields.innerHTML = permissionTemplate({id: permsCounter++});
        permList.append(permFields);
        openRoll(permList);
    });

    // save quest
    saveButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        const branchesUpdate = [];
        const branchesCreate = [];
        let idx = 0;
        Array.from(branchesList.children).forEach((branchEl) => {
            const branchName = branchEl.firstElementChild.value.trim()
            const branchIdx = branchEl.getAttribute('data-branch-orderid');
            if (branchIdx !== null) {
                idx = branchIdx;
                branchesUpdate.push({title: branchName, orderId: branchIdx});
            } else if (branchName !== "") {
                branchEl.setAttribute('data-branch-orderid', idx++);
                branchesCreate.push(branchName);
            } else {
                branchEl.remove();
            }
        });

        const permissionsReset = [];
        Array.from(permList.children).forEach(permEl => {
            const username = permEl.firstElementChild.value.trim()
            const isInBlackList = permEl.querySelector('input[type="radio"]:checked').value;
            permissionsReset.push({name: username, isInBlackList});
        });

        const isPublished = publishedInput.checked;

        const response = await app.apiPut("/quest", {id: questId, title, description, branchesUpdate, branchesCreate, permissionsReset, isPublished})
        questData = await response.json();
        switch (response.status) {
            case 200:
                // set branches id to can goto /branch-edit?branchId=...
                Array.from(branchesList.children).forEach((branchEl, idx) => {
                    branchEl.setAttribute('data-branch-id', questData.branches[idx].id);
                });
                setTimedClass([titleFields, descriptionFields, branchesFields, permissionsFields, publishedFields], "success");
                break;
            case 401:
                setTimedClass([titleFields, descriptionFields, branchesFields, permissionsFields, publishedFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, 'Произошла непредвиденная ошибка!');
        }
    });

    deleteButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (await app.modal.confirm("Уверен, что хочешь удалить квест? Все ветки и задания в нём будут удалены!")) {
            await app.apiDelete('/quest', {id: questId});
            await app.goto('/me-quests');
        }
    })
}
