import {$, forEachChild, setTimedClass} from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, fastRoll, isClosedRoll, openRoll} from "../modules/show-hide";


const html = `
<div id="back-button" class="title-container clickable low-opacity">
    <div>
        <arrow class="arrow left"></arrow>
        <span>
            <div class="text-big-x lighting-text">К квесту</div>
            <div id="quest-name" class="text"></div>
        </span>
    </div>
</div>

<div id="data-edit-form" class="form">
    <div class="info-container">
        <div class="text-max">Изменить ветку</div>
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
        <div id="tasks-fields">
            <label class="text-big">Задания <span id="tasks-error"></span></label>
            <div class="info text-small">Последнее задание в ветке выводится игроку без вопроса - это страница с поздравлением </div>
            <ul id="tasks-list" class="addable-list roll-closed">
                <!-- tasks will be there -->
            </ul>
            <input id="tasks-button-new" type="button" value="Добавить задание">
        </div>
        <div id="published-fields">
            <label class="text-big">Опубликована <span id="published-error"></span></label>
            <input id="published-input" type="checkbox" class="switch">
            <div class="info text-small">Если ветка не опубликована - это черновик. Она не будет показываться остальным в списке веток квеста</div>
        </div>
    </div>

    <div class="submit-container">
        <input id="save-button" type="submit" value="Сохранить">
    </div>
    
    <div class="submit-container">
        <input id="delete-button" type="submit" value="Удалить ветку">
    </div>
</div>
`;


const taskTemplate = Handlebars.compile(`
<!--li-->
    <span class="text-big-x orderid">{{ orderid }}</span>
    <div class="{{#unless exists}}closed{{/unless}} move-buttons">
        <div class="button half-height rounded">˄</div>
        <div class="button half-height rounded">˅</div>
    </div>
    <div class="button rounded delete-button"><span class="cross"></span></div>
    <input type="text" placeholder="Название задания" value="{{ title }}">
    <div class="text-middle button rounded {{#unless exists}}closed{{/unless}} goto-button">
        <span class="mobile-hide">Перейти</span> <span class="arrow right"></span>
    </div>
<!--/li-->`);


export async function handler(element, app) {
    element.innerHTML = html;
    const searchParams = new URL(window.location.href).searchParams;
    const branchId = searchParams.get('branchId');

    const form = $("data-edit-form");
    const titleFields = $("title-fields");
    const descriptionFields = $("description-fields");
    const tasksFields = $("tasks-fields");
    const publishedFields = $("published-fields");

    const titleInput = $("title-input");
    const descriptionInput = $("description-input");
    const publishedInput = $("published-input");

    const titleError = $("title-error");
    const descriptionError = $("description-error");

    const backButton = $("back-button");
    const tasksList = $("tasks-list");
    const newTaskButton = $("tasks-button-new");
    const saveButton = $("save-button");
    const deleteButton = $("delete-button");
    const questTitleEl = $("quest-name");

    form.oninput = () => window.onbeforeunload = () => true;
    app.actions.ongoto = () => window.onbeforeunload = () => null;

    let response = await app.apiGet(`/branch?branchId=${branchId}`);
    let res = await response.json();

    titleInput.value = res.title;
    descriptionInput.value = res.description;
    publishedInput.checked = res.ispublished;
    questTitleEl.innerText = '\"' + res.qtitle + '\"';
    backButton.addEventListener('click', async () => {
        app.goto(`/quest-edit?questId=${res.questid}`);
    });

    // --- get existing tasks
    response = await app.apiGet(`/task?branchId=${branchId}`);
    const tasksData = await response.json();
    tasksList.innerHTML = "";
    tasksData.forEach((task) => {
        const taskFields = document.createElement('li');
        task.exists = true;
        taskFields.innerHTML = taskTemplate(task);
        taskFields.setAttribute('data-task-id', task.id);
        tasksList.append(taskFields);

        const deleteButton = taskFields.querySelector('.delete-button');
        const gotoButton = taskFields.querySelector('.goto-button');
        const moveButtons = taskFields.querySelector('.move-buttons');
        const orderid = taskFields.querySelector('.orderid');
        const toTopButton = moveButtons.firstElementChild;
        const toBottomButton = moveButtons.lastElementChild;

        deleteButton.addEventListener('click', async () => {
            const taskId = taskFields.getAttribute('data-task-id');
            if (! await app.modal.confirm('Точно удаляем задание?', 'А не жалко?'))
                return;
            app.apiDelete('/task', {id: taskId});
            taskFields.remove();
            fastRoll(tasksList);
        });
        gotoButton.addEventListener('click', async () => {
            const taskId = taskFields.getAttribute('data-task-id');
            app.goto(`/task-edit?taskId=${taskId}`);
        });

        toTopButton.addEventListener('click', () => {
            const prevEl = taskFields.previousElementSibling;
            if (!prevEl)
                return;
            const curOrderid = orderid.innerText;
            const prevOrderidEl = prevEl.querySelector('.orderid');
            orderid.innerText = prevOrderidEl.innerText;
            prevOrderidEl.innerText = curOrderid;
            tasksList.insertBefore(taskFields, taskFields.previousSibling);
        });
        toBottomButton.addEventListener('click', () => {
            const nextEl = taskFields.nextElementSibling;
            if (!nextEl?.getAttribute('data-task-id'))
                return;
            const curOrderid = orderid.innerText;
            const nextOrderidEl = nextEl.querySelector('.orderid');
            orderid.innerText = nextOrderidEl.innerText;
            nextOrderidEl.innerText = curOrderid;
            tasksList.insertBefore(taskFields.nextSibling, taskFields);
        });
    });
    openRoll(tasksList);


    // click on "new task"
    newTaskButton.addEventListener("click", () => {
        let lastOrderid = 0;
        if (tasksList.lastElementChild)
            lastOrderid = Number(tasksList.lastElementChild.querySelector('.orderid').innerText);

        const taskFields = document.createElement('li');
        taskFields.innerHTML = taskTemplate({title: '', orderid: lastOrderid + 1});
        tasksList.append(taskFields);

        const deleteButton = taskFields.querySelector('.delete-button');
        const gotoButton = taskFields.querySelector('.goto-button');
        const moveButtons = taskFields.querySelector('.move-buttons');
        const orderid = taskFields.querySelector('.orderid');
        const toTopButton = moveButtons.firstElementChild;
        const toBottomButton = moveButtons.lastElementChild;

        deleteButton.addEventListener('click', async () => {
            const taskId = taskFields.getAttribute('data-task-id');
            if (taskId !== null) {
                if (await app.modal.confirm('Точно удаляем задание?', 'А не жалко?'))
                    app.apiDelete('/task', {id: taskId});
                else
                    return;
            }
            taskFields.remove();
            fastRoll(tasksList);
        });
        gotoButton.addEventListener('click', async () => {
            const taskId = taskFields.getAttribute('data-task-id');
            app.goto(`/task-edit?taskId=${taskId}`);
        });

        toTopButton.addEventListener('click', () => {
            const prevEl = taskFields.previousElementSibling;
            if (!prevEl)
                return;
            const curOrderid = orderid.innerText;
            const prevOrderidEl = prevEl.querySelector('.orderid');
            orderid.innerText = prevOrderidEl.innerText;
            prevOrderidEl.innerText = curOrderid;
            tasksList.insertBefore(taskFields, taskFields.previousSibling);
        });
        toBottomButton.addEventListener('click', () => {
            const nextEl = taskFields.nextElementSibling;
            if (!nextEl?.getAttribute('data-task-id'))
                return;
            const curOrderid = orderid.innerText;
            const nextOrderidEl = nextEl.querySelector('.orderid');
            orderid.innerText = nextOrderidEl.innerText;
            nextOrderidEl.innerText = curOrderid;
            tasksList.insertBefore(taskFields.nextSibling, taskFields);
        });
        openRoll(tasksList);
    });


    // save branch
    saveButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const isPublished = publishedInput.checked;

        const response = await app.apiPut("/branch", {id: branchId, title, description, isPublished})
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

        const tasksToCreate = [];
        const tasksToCreateElements = [];
        forEachChild(tasksList, async (el) => {
            const id = el.getAttribute('data-task-id');
            const orderId = el.querySelector('.orderid');
            const title = el.querySelector('input').value.trim()
            const gotoButton = el.querySelector('.goto-button');
            const deleteButton = el.querySelector('.delete-button');
            const moveButtons = el.querySelector('.move-buttons');

            if (id !== null) { // branch already exists
                const response = await app.apiPut('/task', {id, title, orderId});
                const resp = await response.json();

                if (!response.ok) {
                    setTimedClass([el], "error");
                    app.messages.error(`Ошибка ${response.status}!`, resp.info);
                } else {
                    setTimedClass([el], "success");
                }
            } else { // need to create new branch
                tasksToCreate.push({branchId, title, description: "", question: "", answers: []});
                tasksToCreateElements.push({el, orderId, gotoButton, deleteButton, moveButtons});
            }
        });
        if (tasksToCreate.length !== 0) {
            const response = await app.apiPost('/task/many', {branchId: branchId, tasks: tasksToCreate});
            const resp = await response.json();
            if (response.ok) {
                tasksToCreateElements.forEach((element, idx) => {
                    const {el, orderId, gotoButton, deleteButton, moveButtons} = element;
                    el.setAttribute('data-task-id', resp[idx].id);
                    orderId.innerText = resp[idx].orderid;
                    gotoButton.classList.remove('closed');
                    moveButtons.classList.remove('closed');
                    setTimedClass([el], "success");
                });
            } else {
                setTimedClass([tasksList], "error");
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
            }
        }
        window.onbeforeunload = () => null;
    });

    deleteButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (await app.modal.confirm("Точно хочешь удалить ветку?", "Все задания в ней будут удалены!")) {
            await app.apiDelete('/branch', {id: branchId});
            backButton.dispatchEvent(new Event('click')); // go to branches
        }
    })
}
