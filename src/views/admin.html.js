import {$, forEachChild, setTimedClass} from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars.js';
import {fastRoll, openRoll} from "../modules/show-hide";
import {marked} from "marked/marked.min.js"
import MarkdownRedactor from "../components/markdown-redactor";

const html = `
<div class="title-container clickable low-opacity">
    <linkButton href="/me">
        <arrow class="arrow left"></arrow>
        <span>
            <div class="text-big-x lighting-text">В профиль</div>
            <div class="text">Это когда всё разрулил и можно отдохнуть</div>
        </span>
    </linkButton>
</div>

<div id="data-edit-form" class="form">
    <div class="info-container">
        <div class="text-max">Админская страничка</div>
    </div>
    
    <div class="fields-container">
        <div id="sql-fields">
            <label class="text-big">Выполнить SQL</label>
            <div class="info text-small">Вот сейчас спокойно, дыши, без DROP, DELETE и TRUNCATE, пожалуйста</div>
            <textarea id="sql-input" rows=8 class="text scrollable"></textarea>
            <label class="text-big">Результат</label>
            <textarea id="sql-result-input" rows=4 class="text scrollable"></textarea>
            <input id="sql-execute-button" type="submit" value="Выполнить">
        </div>
    </div>
</div>
`;


export async function handler(element, app) {
    element.innerHTML = html;
    const sqlFields = $("sql-fields");

    const sqlInput = $("sql-input");
    const sqlResultInput = $("sql-result-input");

    const sqlExecuteButton = $("sql-execute-button");


    sqlExecuteButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const sql = sqlInput.value;

        const response = await app.apiPost("/admin/sql", {sql})
        const resp = await response.json();
        console.log(resp);
        switch (response.status) {
            case 200:
                app.messages.success(response.status, resp.info);
                setTimedClass([sqlFields], "success");

                sqlResultInput.value = '[';
                resp.forEach(res => {
                    sqlResultInput.value += '\n\t{';
                    for (const key in res) {
                        sqlResultInput.value += `\n\t\t${key}: ${res[key]}`;
                    }
                    sqlResultInput.value += '\n\t},';
                });
                sqlResultInput.value += '\n]';
                break;
            case 500:
                app.messages.error(`Ошибка ${response.status}!`, resp.info, 10000);
                setTimedClass([sqlFields], "error");
                break;
            default:
                app.messages.error(`Ошибка ${response.status}!`, resp.info, 10000);
                break;
        }
    });
}
