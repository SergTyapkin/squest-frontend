import {$, setTimedClass} from "../modules/utils.ts";
import {hide, show} from "../modules/show-hide.js";
import {marked} from "marked/marked.min.js"
import {HtmlSanitizer} from "@jitbit/htmlsanitizer";

const html = `
<div id="back-button" class="title-container bg">
    <div>
        <div class="text">Квест: <span id="quest-title"></span></div>
        <div class="text">Ветка: <span id="branch-title"></span></div>
        <div id="task-title" class="text-big-x"></div>
    </div>
</div>

<div id="task-description" class="text flex-filler"></div>

<form id="form-answer" class="form centered-horizontal">
    <div class="info-container">
        <div id="task-question" class="text-big"></div>
    </div>
    
    <div class="fields-container">
        <div id="form-answer-fields">
            <div class="info" id="answer-error"></div>
            <input id="answer-input" type="text" placeholder="Ответ" autocomplete="off">
            <div class="info text-small">Регистр не важен</div>
        </div>
    </div>
    
    <div class="submit-container">
        <input type="submit" value="Ответить">
    </div>
</form>

<div id="end-buttons" class="centered-horizontal text-max fullwidth hidden">
    Вы прошли ветку!
    <div class="title-container clickable">
        <div id="restart-button">
            <div>
                <div class="text-big-x">Начать заново</div>
                <div class="text">Прогресс сохранится</div>
            </div>
        </div>
        <linkButton href="/quests">
            <div>
                <div class="text-big-x">Завершить квест</div>
            </div>
        </linkButton>
    </div>
</div>


<footer class="underbar-contacts" id="underbar-contacts">
    <li>
        <span class="title">За подсказками:</span>
        <a href="https://vk.com/squest_studio" class="description" target="_blank">vk.com/squest_studio</a>
    </li>
</footer>
`;

export async function handler(element, app) {
    element.innerHTML = html;

    const form =  $('form-answer');
    const formAnswerFields =  $('form-answer-fields');
    const questTitle = $("quest-title");
    const branchTitle = $("branch-title");
    const progressNumber = $("progress");
    const progressbar = $("progressbar");

    const taskTitle = $("task-title");
    const taskDescription = $("task-description");
    const taskQuestion = $("task-question");

    const answerInput = $("answer-input");
    const endButtons = $("end-buttons");
    const restartButton = $("restart-button");

    let response = await app.apiGet("/task/play");
    let res = await response.json();

    switch (response.status) {
        case 200:
            questTitle.innerHTML = res.questtitle;
            branchTitle.innerHTML = res.branchtitle;
            progressNumber.innerText = res.progress;
            progressbar.style.setProperty('--progress', res.progress / (res.length - 1));

            taskTitle.innerHTML = res.title;
            HtmlSanitizer.AllowedTags['AUDIO'] = true;
            taskDescription.innerHTML = HtmlSanitizer.SanitizeHtml(marked.parse(res.description, {breaks: true}));
            taskQuestion.innerHTML = res.question;

            if (res.question === undefined) {
                hide(form);
                show(endButtons);
            }
            break;
        case 400:
            app.goto('/quests');
            return;
        default:
            app.messages.error(`Ошибка ${response.status}!`, res.info);
            break;
    }


    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const answer = answerInput.value.trim();

        response = await app.apiPost("/task/play", {answer})
        res = await response.json()

        switch (response.status) {
            case 200:
                app.goto("/play");
                break;
            case 418:
                setTimedClass([formAnswerFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, res.info);
                break;
        }
    });

    restartButton.addEventListener('click', async () => {
        if (await app.modal.confirm("Точно начинаем заново?", "Рейтинг останется")) {
            await app.apiPut('/branch/progress/reset', {branchId: app.storage.branchId});
            app.goto('/play');
        }
    });
}
