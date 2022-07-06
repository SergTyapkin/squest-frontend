import {$, forEachChild, setTimedClass} from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars.js';
import {fastRoll, openRoll} from "../modules/show-hide";
import {marked} from "marked/marked.min.js"
import MarkdownRedactor from "../components/markdown-redactor";

const html = `
<div id="back-button" class="title-container clickable low-opacity">
    <div>
        <arrow class="arrow left"></arrow>
        <span>
            <div class="text-big-x lighting-text">К ветке</div>
            <div id="branch-name" class="text"></div>
        </span>
    </div>
</div>

<div id="data-edit-form" class="form">
    <div class="info-container">
        <div class="text-max">Изменить задание</div>
    </div>
    
    <div class="fields-container">
        <div id="title-fields">
            <label class="text-big">Название <span id="title-error"></span></label>
            <input id="title-input" type="text">
        </div>
        <div id="description-fields">
            <label class="text-big">Описание <span id="description-error"></span></label>
            <div class="info text-small">Можно использовать Markdown-оформление, вставлять ссылки и загружать фото</div>
            <div class="absolute-wrapper">
                <textarea id="description-input" class="text markdowned scrollable"></textarea>
                <div id="markdown-panel">
                    <div class="_bold">B</div>
                    <div class="_italic">I</div>
                    <div class="_strikethrough">S</div>
                    <div class="_code">\`c\`</div>
                    <div class="_header-1">H1</div>
                    <div class="_header-2">H2</div>
                    <div class="_header-3">H3</div>
                    <div class="_blockquote">>|</div>
                    <div class="_list"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="12px"><g transform="scale(0.25) translate(8, 2)"><path d="M57.124,51.893H16.92c-1.657,0-3-1.343-3-3s1.343-3,3-3h40.203c1.657,0,3,1.343,3,3S58.781,51.893,57.124,51.893z"/><path d="M57.124,33.062H16.92c-1.657,0-3-1.343-3-3s1.343-3,3-3h40.203c1.657,0,3,1.343,3,3   C60.124,31.719,58.781,33.062,57.124,33.062z"/><path d="M57.124,14.231H16.92c-1.657,0-3-1.343-3-3s1.343-3,3-3h40.203c1.657,0,3,1.343,3,3S58.781,14.231,57.124,14.231z"/><circle cx="4.029" cy="11.463" r="4.029"/><circle cx="4.029" cy="30.062" r="4.029"/><circle cx="4.029" cy="48.661" r="4.029"/></g></svg></div>
                    <div class="_link"><svg xmlns="http://www.w3.org/2000/svg" width="18px" height="15px"><g transform="scale(0.028) translate(70, 40)"><path d="M211.26,389.24l-60.331,60.331c-25.012,25.012-65.517,25.012-90.508,0.005c-24.996-24.996-24.996-65.505-0.005-90.496     l120.683-120.683c24.991-24.992,65.5-24.992,90.491,0c8.331,8.331,21.839,8.331,30.17,0c8.331-8.331,8.331-21.839,0-30.17     c-41.654-41.654-109.177-41.654-150.831,0L30.247,328.909c-41.654,41.654-41.654,109.177,0,150.831     c41.649,41.676,109.177,41.676,150.853,0l60.331-60.331c8.331-8.331,8.331-21.839,0-30.17S219.591,380.909,211.26,389.24z"/><path d="M479.751,30.24c-41.654-41.654-109.199-41.654-150.853,0l-72.384,72.384c-8.331,8.331-8.331,21.839,0,30.17     c8.331,8.331,21.839,8.331,30.17,0l72.384-72.384c24.991-24.992,65.521-24.992,90.513,0c24.991,24.991,24.991,65.5,0,90.491     L316.845,283.638c-24.992,24.992-65.5,24.992-90.491,0c-8.331-8.331-21.839-8.331-30.17,0s-8.331,21.839,0,30.17     c41.654,41.654,109.177,41.654,150.831,0l132.736-132.736C521.405,139.418,521.405,71.894,479.751,30.24z"/></g></svg></div>
                    <div class="_photo"><svg class="_photo" xmlns="http://www.w3.org/2000/svg" width="19px" height="15px"><g transform="scale(0.8) translate(0, -2)"><path d="m14.134 3.65c.853 0 1.46.278 1.988.899.017.019.494.61.66.815.228.281.674.536.945.536h.41c2.419 0 3.863 1.563 3.863 4.05v5.85c0 2.241-2 4.2-4.273 4.2h-11.454c-2.267 0-4.223-1.953-4.223-4.2v-5.85c0-2.496 1.4-4.05 3.814-4.05h.409c.271 0 .717-.255.945-.536.166-.204.643-.796.66-.815.528-.621 1.135-.899 1.988-.899z"/><circle cx="12" cy="12" r="3.85"/></g></svg></div>
                </div>
            </div>
            <label class="text-big">Превью <span id="description-preview-error"></span></label>
            <div id="description-preview" class="text input-area"></div>
        </div>
        <div id="question-fields">
            <label class="text-big">Вопрос <span id="question-error"></span></label>
            <div class="info text-small">Последнее задание в ветке выводится игроку без вопроса - это страница с поздравлением </div>
            <textarea id="question-input" class="text"></textarea>
        </div>
        <div id="answers-fields">
            <label class="text-big">Правильные ответы <span id="answers-error"></span></label>
            <div class="info text-small">
                РегИсТр ответов не играет роли. Все ответы игроков перед проверкой переводятся в нижний регистр <br>
                Чтобы любой ответ, введенный игроком, считался правильным, добавьте ответ "*"
            </div>
            <ul id="answers-list" class="addable-list roll-closed">
                <!-- answers will be there -->
            </ul>
            <input id="answers-button-new" type="button" value="Добавить ответ">
        </div>
    </div>

    <div class="submit-container">
        <input id="save-button" type="submit" value="Сохранить">
    </div>
</div>
`;


const answerTemplate = Handlebars.compile(`
<!--li-->
    <div class="button rounded"><span class="cross"></span></div>
    <input type="text" placeholder="Ответ" value="{{ answer }}" autocomplete="off" style="text-transform: lowercase">
<!--/li-->`);


export async function handler(element, app) {
    element.innerHTML = html;
    const searchParams = new URL(window.location.href).searchParams;
    const taskId = searchParams.get('taskId');

    const form = $("data-edit-form");
    const titleFields = $("title-fields");
    const descriptionFields = $("description-fields");
    const questionFields = $("question-fields");
    const answersFields = $("answers-fields");

    const titleInput = $("title-input");
    const descriptionInput = $("description-input");
    const questionInput = $("question-input");
    const descriptionPreview = $("description-preview");

    const titleError = $("title-error");
    const descriptionError = $("description-error");
    const questionError = $("question-error");
    const descriptionPreviewError = $("description-preview-error");

    const newAnswerButton = $("answers-button-new");
    const answersList = $("answers-list");

    const backButton = $("back-button");
    const saveButton = $("save-button");
    const branchTitleEl = $("branch-name");


    // initialize markdown redactor
    const markdownPanel = $("markdown-panel");
    MarkdownRedactor(markdownPanel, descriptionInput, app);

    form.oninput = () => window.onbeforeunload = () => true;
    app.actions.ongoto = () => window.onbeforeunload = () => null;

    let response = await app.apiGet(`/task?taskId=${taskId}`);
    let res = await response.json();

    titleInput.value = res.title;
    descriptionInput.value = res.description;
    descriptionInput.style.height = Math.min(descriptionInput.scrollHeight + 30, 1000) + "px";
    questionInput.value = res.question;
    branchTitleEl.innerText = '\"' + res.btitle + '\"';
    backButton.addEventListener('click', async () => {
        app.goto(`/branch-edit?branchId=${res.branchid}`);
    });
    // create existing answers
    res.answers.forEach((answer) => {
        const answerFields = document.createElement('li');
        answerFields.innerHTML = answerTemplate({answer});
        answersList.append(answerFields);

        const deleteButton = answerFields.firstElementChild;
        deleteButton.addEventListener('click', async () => {
            answerFields.remove();
            fastRoll(answersList);
        });
        openRoll(answersList);
    });

    // lifetime markdown-render
    HtmlSanitizer.AllowedTags['AUDIO'] = true;
    HtmlSanitizer.AllowedTags['S'] = true;
    function updateDescriptionRender() {
        descriptionPreview.innerHTML = HtmlSanitizer.SanitizeHtml(marked.parse(descriptionInput.value, {breaks: true}));
    }
    descriptionInput.addEventListener('input', updateDescriptionRender);
    updateDescriptionRender();

    // click on "new answer"
    newAnswerButton.addEventListener("click", () => {
        const answerFields = document.createElement('li');
        answerFields.innerHTML = answerTemplate({answer: ''});
        answersList.append(answerFields);

        const deleteButton = answerFields.firstElementChild;
        deleteButton.addEventListener('click', async () => {
            answerFields.remove();
            fastRoll(answersList);
        });
        openRoll(answersList);
    });

    // save task
    saveButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const title = titleInput.value.trim();
        const description = descriptionInput.value;
        const question = questionInput.value;
        const answers = [];
        forEachChild(answersList, (el) => {answers.push(el.lastElementChild.value)});

        const response = await app.apiPut("/task", {id: taskId, title, description, question, answers})
        const resp = await response.json();
        switch (response.status) {
            case 200:
                setTimedClass([titleFields, descriptionFields, questionFields, answersFields], "success");
                break;
            case 401:
                setTimedClass([titleFields, descriptionFields, questionFields, answersFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, resp.info);
                break;
        }

        window.onbeforeunload = () => null;
    });
}
