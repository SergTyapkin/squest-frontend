import { $ } from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, isClosedRoll, openRoll} from "../modules/show-hide";

const html = `
<div class="quests-page">
    <div id="choose-quest-block">
        <div class="title-container bg">
            <div>
                <div class="text-big-x lighting-text">Выбор квеста</div>
                <div class="text">Выбирай первый понравившийся и погнали!</div>
            </div>
        </div>
        <ul id="quests-listing" class="listing">
            <!--Quests will be there-->
        </ul>
    </div>
    
    <div id="details-block" class="closed">
        <div id="back-button" class="title-container clickable low-opacity">
            <div>
                <span class="text-big-x"><arrow class="arrow left"></arrow>Назад</span>
            </div>
        </div>
        <div class="info-plate">
            <div class="text-big">Квест:
                <div class="text-max" id="details-quest-title"></div>
            </div>
            <div class="text-big">Ветка:
                <div class="text-max" id="details-branch-title"></div>
            </div>
            <div class="text-big-x">О квесте:
                <div class="text-middle">
                <div class="text-middle">
                    Вы прошли <span id="details-progress"></span> из <span id="details-length"></span>                
                </div>
                <br>
                <div class="text-middle">Описание:</div>
                <div id="details-quest-description" class="text"></div>
            </div>
        </div>
        <linkButton id="confirm-button" class="text-big-x button rounded outline centered" href="/play">Играть</linkButton>
    </div>
    
    <linkButton class="float-button text-middle" href="/quest-create">
        <div class="hover-text">Создать квест</div>
        <svg pointer-events="none" xmlns="http://www.w3.org/2000/svg"><path transform="scale(2.2) translate(-1,-1)" d="M10 3.25c.41 0 .75.34.75.75v5.25H16a.75.75 0 010 1.5h-5.25V16a.75.75 0 01-1.5 0v-5.25H4a.75.75 0 010-1.5h5.25V4c0-.41.34-.75.75-.75z"></path></svg>
    </linkButton>
</div>
`;


const questTemplate = Handlebars.compile(`
<li data-quest-id="{{ id }}" data-quest-button class="text-big">
    {{#unless ispublished}}
        <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet"><path d="M25.19,20.4A6.78,6.78,0,0,0,25.62,18a6.86,6.86,0,0,0-6.86-6.86,6.79,6.79,0,0,0-2.37.43L18,13.23a4.78,4.78,0,0,1,.74-.06A4.87,4.87,0,0,1,23.62,18a4.79,4.79,0,0,1-.06.74Z" class="clr-i-outline clr-i-outline-path-1" /><path d="M34.29,17.53c-3.37-6.23-9.28-10-15.82-10a16.82,16.82,0,0,0-5.24.85L14.84,10a14.78,14.78,0,0,1,3.63-.47c5.63,0,10.75,3.14,13.8,8.43a17.75,17.75,0,0,1-4.37,5.1l1.42,1.42a19.93,19.93,0,0,0,5-6l.26-.48Z" class="clr-i-outline clr-i-outline-path-2"/><path d="M4.87,5.78l4.46,4.46a19.52,19.52,0,0,0-6.69,7.29L2.38,18l.26.48c3.37,6.23,9.28,10,15.82,10a16.93,16.93,0,0,0,7.37-1.69l5,5,1.75-1.5-26-26Zm9.75,9.75,6.65,6.65a4.81,4.81,0,0,1-2.5.72A4.87,4.87,0,0,1,13.9,18,4.81,4.81,0,0,1,14.62,15.53Zm-1.45-1.45a6.85,6.85,0,0,0,9.55,9.55l1.6,1.6a14.91,14.91,0,0,1-5.86,1.2c-5.63,0-10.75-3.14-13.8-8.43a17.29,17.29,0,0,1,6.12-6.3Z" class="clr-i-outline clr-i-outline-path-3"/></svg>
    {{/unless}}
    <span class="main-info">
        <span class="title">{{ title }}</span>
        <div class="text info">{{ description }}</div>
    </span>
    <span class="text choose">ВЫБРАТЬ<arrow class="arrow right"></arrow></span>
</li>
<ul class="roll-closed listing branches-listing">
    <!--Branches will be there-->
</ul>
`);

const branchTemplate = Handlebars.compile(`
<li data-branch-id="{{ id }}" data-branch-button class="text-big">
    {{#unless ispublished}}
        <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet"><path d="M25.19,20.4A6.78,6.78,0,0,0,25.62,18a6.86,6.86,0,0,0-6.86-6.86,6.79,6.79,0,0,0-2.37.43L18,13.23a4.78,4.78,0,0,1,.74-.06A4.87,4.87,0,0,1,23.62,18a4.79,4.79,0,0,1-.06.74Z" class="clr-i-outline clr-i-outline-path-1" /><path d="M34.29,17.53c-3.37-6.23-9.28-10-15.82-10a16.82,16.82,0,0,0-5.24.85L14.84,10a14.78,14.78,0,0,1,3.63-.47c5.63,0,10.75,3.14,13.8,8.43a17.75,17.75,0,0,1-4.37,5.1l1.42,1.42a19.93,19.93,0,0,0,5-6l.26-.48Z" class="clr-i-outline clr-i-outline-path-2"/><path d="M4.87,5.78l4.46,4.46a19.52,19.52,0,0,0-6.69,7.29L2.38,18l.26.48c3.37,6.23,9.28,10,15.82,10a16.93,16.93,0,0,0,7.37-1.69l5,5,1.75-1.5-26-26Zm9.75,9.75,6.65,6.65a4.81,4.81,0,0,1-2.5.72A4.87,4.87,0,0,1,13.9,18,4.81,4.81,0,0,1,14.62,15.53Zm-1.45-1.45a6.85,6.85,0,0,0,9.55,9.55l1.6,1.6a14.91,14.91,0,0,1-5.86,1.2c-5.63,0-10.75-3.14-13.8-8.43a17.29,17.29,0,0,1,6.12-6.3Z" class="clr-i-outline clr-i-outline-path-3"/></svg>
    {{/unless}}
    <span class="main-info">
        <span class="title">{{ title }}</span>
        <div class="text info">{{ description }}</div>
    </span>
    <span class="text choose">ВЫБРАТЬ<span class="arrow right"></span></span>
</li>`)


export async function handler(element, app) {
    element.innerHTML = html;

    const listing = $("quests-listing");
    const chooseQuestBlock = $("choose-quest-block");
    const detailsBlock = $("details-block");
    const detailsQuestTitle = $("details-quest-title");
    const detailsQuestDescription = $("details-quest-description");
    const detailsBranchTitle = $("details-branch-title");
    const detailsProgress = $("details-progress");
    const detailsLength = $("details-length");


    const response = await app.apiGet("/quest")
    const res = await response.json()

    let chosenBranchId, chosenQuestId;

    listing.innerHTML = "";
    res.forEach(quest => {
        listing.innerHTML += questTemplate(quest);
    });

    // click on quest
    listing.querySelectorAll("*[data-quest-button]").forEach((button) => {
        button.addEventListener("click", async () => {
            const branchesBlock = button.nextElementSibling;
            if (!isClosedRoll(branchesBlock)) { // opened now
                button.classList.remove("checked");
                closeRoll(branchesBlock);
                return;
            }
            // closed now
            button.classList.add("checked");

            if (button.getAttribute("data-gotten")) {  // branches gotten already
                openRoll(branchesBlock);
                return;
            }

            const questId = button.getAttribute("data-quest-id");
            const response = await app.apiGet(`/branch?questId=${questId}`);
            const res = await response.json()

            branchesBlock.innerHTML = "";
            res.forEach(branch => {
                branchesBlock.innerHTML += branchTemplate(branch);
            })

            button.setAttribute("data-gotten", "yes");
            openRoll(branchesBlock);

            branchesBlock.querySelectorAll("*[data-branch-button]").forEach((branchButton) => {
                branchButton.addEventListener("click", async (event) => {
                    event.stopPropagation();

                    const branchId = branchButton.getAttribute("data-branch-id");

                    chooseQuestBlock.classList.add("closed");
                    detailsBlock.classList.remove("closed");

                    chosenBranchId = branchId;
                    chosenQuestId = questId;

                    const questTitle = button.querySelector('.title').innerText.trim();
                    const questDescription = button.querySelector('.info').innerText;
                    const branchTitle = branchButton.querySelector('.title').innerText.trim();
                    detailsQuestTitle.innerText = questTitle;
                    detailsQuestDescription.innerText = questDescription;
                    detailsBranchTitle.innerText = branchTitle;
                    app.storage.questTitle = questTitle;
                    app.storage.branchTitle = branchTitle;

                    const response = await app.apiGet(`/branch?branchId=${branchId}`)
                    const res = await response.json()

                    detailsProgress.innerText = res.progress;
                    detailsLength.innerText = res.length;
                });
            });
        });
    });

    $("back-button").addEventListener("click", (event) => {
        chooseQuestBlock.classList.remove("closed");
        detailsBlock.classList.add("closed");
    });

    $("confirm-button").addEventListener("click", async () => {
        await app.apiPost('/quest/choose', {questId: chosenQuestId, branchId: chosenBranchId})
    });
}
