import {$, setTimedClass} from "../modules/utils.ts";
import {closeRoll, hide, hidefast, openRoll, show} from "../modules/show-hide.js";
import {marked} from "marked/marked.min.js";
import {HtmlSanitizer} from "@jitbit/htmlsanitizer";
import QrScanner from "qr-scanner";

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

<form id="qr-answer" class="form centered-horizontal hidden">
    <video id="qr-code-scanner" class="roll-active closed"></video>
    <div id="qr-code-fields">
        <div class="text-middle">Отсканировано: <span id="qr-code-text"></span></div>
        <div class="info text-small">
            Как только ты отсканируешь правильный QR-код, ты пройдёшь это задание           
        </div>
    </div>
    <div class="flex-string">
        <input id="qr-scan-button" type="button" value="Сканировать">
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
    const qrForm =  $('qr-answer');
    const formAnswerFields =  $('form-answer-fields');
    const questTitle = $("quest-title");
    const branchTitle = $("branch-title");
    const progressNumber = $("progress");
    const progressbar = $("progressbar");

    const qrCodeFields = $("qr-code-fields");
    const qrScanButton = $("qr-scan-button");
    const qrCodeText = $("qr-code-text");
    const qrCodeScanner = $("qr-code-scanner")

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
            progressbar.style.setProperty('--progress', String(res.progress / res.length));

            taskTitle.innerHTML = res.title;
            HtmlSanitizer.AllowedTags['AUDIO'] = true;
            HtmlSanitizer.AllowedTags['S'] = true;
            taskDescription.innerHTML = HtmlSanitizer.SanitizeHtml(marked.parse(res.description, {breaks: true}));
            taskQuestion.innerHTML = res.question;

            if (res.question === undefined) {
                hide(form);
                show(endButtons);
            }
            if (res.isqranswer) {
                hidefast(form);
                show(qrForm);
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

        await checkAnswer(answer);
    });

    async function checkAnswer(answer, callbackSuccess = () => {}, callbackError = () => {}) {
      response = await app.apiPost("/task/play", {answer})
      res = await response.json()

      switch (response.status) {
        case 200:
          await callbackSuccess();
          app.goto("/play");
          break;
        case 418:
          await callbackError(418);
          setTimedClass([formAnswerFields], "error");
          break;
        default:
          await callbackError(null);
          app.messages.error(`Ошибка ${response.status}!`, res.info);
          break;
      }
    }

    restartButton.addEventListener('click', async () => {
        if (await app.modal.confirm("Точно начинаем заново?", "Рейтинг останется")) {
            await app.apiPut('/branch/progress/reset', {branchId: app.storage.branchId});
            app.goto('/play');
        }
    });

  // scan existing qr
  let answerLink;
  const qrScanner = new QrScanner(qrCodeScanner, async (result) => {
    const newRes = result.data;
    if (newRes === answerLink) {
      return;
    }
    answerLink = newRes;
    qrCodeText.innerText = answerLink;

    await checkAnswer(answerLink, () => {
      app.messages.success('Правильно', 'QR отсканирован');
      qrScanner.destroy();
    }, (errCode) => {
      if (errCode === 418)
        app.messages.error('Неверно', 'QR не тот');
      else
        app.messages.error('Ошибка', 'Неизвестная ошибка');
    });
  }, {highlightScanRegion: true});
  let isScan = false;
  qrScanButton.addEventListener('click', () => {
    if (!isScan) {
      qrScanner.start().then(
        () => {},
        (error) => {
          app.modal.alert("Не предоставлены права доступа к камере", "Настройте доступ к камере для этого сайта в браузере");
        }
      );
      openRoll(qrCodeScanner);
      qrScanButton.value = "Пока хватит";
      isScan = true;
      return;
    }
    qrScanner.stop();
    closeRoll(qrCodeScanner);
    qrScanButton.value = "Сканировать дальше";
    isScan = false;
  });
}
