import { $ } from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, isClosedRoll, openRoll} from "../modules/show-hide";

const html = `
<div class="quests-page">
    <div id="details-block">
        <div id="back-button" class="title-container clickable low-opacity">
            <div>
                <span class="text-big-x"><arrow class="arrow left"></arrow>К списку квестов</span>
            </div>
        </div>
        <div class="info-plate">
            <div class="text-big">Квест:
                <div class="text-max" id="details-quest-title"></div>
            </div>
            <div class="text-big-x">О квесте:
                <div class="text-middle">Описание:</div>
                <div id="details-quest-description" class="text"></div>
            </div>
            <div class="text-big">Ветки:
            </div>
        </div>
        <ul id="listing" class="roll-closed listing branches-listing">
            <!--Branches will be there-->
        </ul>
    </div>
</div>
`;

const branchTemplate = Handlebars.compile(`
<li data-branch-id="{{ id }}" data-branch-button class="text-big">
    {{#unless ispublished}}
        <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet"><path d="M25.19,20.4A6.78,6.78,0,0,0,25.62,18a6.86,6.86,0,0,0-6.86-6.86,6.79,6.79,0,0,0-2.37.43L18,13.23a4.78,4.78,0,0,1,.74-.06A4.87,4.87,0,0,1,23.62,18a4.79,4.79,0,0,1-.06.74Z" class="clr-i-outline clr-i-outline-path-1" /><path d="M34.29,17.53c-3.37-6.23-9.28-10-15.82-10a16.82,16.82,0,0,0-5.24.85L14.84,10a14.78,14.78,0,0,1,3.63-.47c5.63,0,10.75,3.14,13.8,8.43a17.75,17.75,0,0,1-4.37,5.1l1.42,1.42a19.93,19.93,0,0,0,5-6l.26-.48Z" class="clr-i-outline clr-i-outline-path-2"/><path d="M4.87,5.78l4.46,4.46a19.52,19.52,0,0,0-6.69,7.29L2.38,18l.26.48c3.37,6.23,9.28,10,15.82,10a16.93,16.93,0,0,0,7.37-1.69l5,5,1.75-1.5-26-26Zm9.75,9.75,6.65,6.65a4.81,4.81,0,0,1-2.5.72A4.87,4.87,0,0,1,13.9,18,4.81,4.81,0,0,1,14.62,15.53Zm-1.45-1.45a6.85,6.85,0,0,0,9.55,9.55l1.6,1.6a14.91,14.91,0,0,1-5.86,1.2c-5.63,0-10.75-3.14-13.8-8.43a17.29,17.29,0,0,1,6.12-6.3Z" class="clr-i-outline clr-i-outline-path-3"/></svg>
    {{/unless}}
    <span class="main-info">
        <div>
            <span class="title">{{ title }}</span>
            <div class="text info">{{ description }}</div>
        </div>
        <div class="text info">
            <span class="text-small">Вы прошли {{ progress }} из {{ length }}</span>
        </div>
    </span>
    <span class="text choose">Играть<span class="arrow right"></span></span>
</li>`)


export async function handler(element, app) {
    element.innerHTML = html;
    const searchParams = new URL(window.location.href).searchParams;
    const questUid = searchParams.get('uid');
    let questId;

    const listing = $("listing");
    const detailsQuestTitle = $("details-quest-title");
    const detailsQuestDescription = $("details-quest-description");

    // get quest info
    let response = await app.apiGet(`/quest?questUid=${questUid}`);
    let res = await response.json()
    questId = res.id;
    detailsQuestTitle.innerText = res.title;
    detailsQuestDescription.innerText = res.description;
    app.storage.questTitle = res.title;
    app.storage.branchTitle = res.description;

    // get branches
    response = await app.apiGet(`/branch?questId=${questId}`);
    res = await response.json();
    listing.innerHTML = "";
    for (const branch of res) {
        const response = await app.apiGet(`/branch?branchId=${branch.id}`)
        const res = await response.json()

        listing.innerHTML += branchTemplate(res);
    }
    openRoll(listing);

    listing.querySelectorAll("*[data-branch-button]").forEach((branchButton) => {
        branchButton.addEventListener("click", async (event) => {
            event.stopPropagation();

            const branchId = branchButton.getAttribute("data-branch-id");

            const questTitle = detailsQuestTitle.innerText.trim();
            const branchTitle = branchButton.querySelector('.title').innerText.trim();

            app.storage.questTitle = questTitle;
            app.storage.branchTitle = branchTitle;

            const res = await app.modal.confirm("Точно выбираем ветку?", branchTitle);
            if (res) {
                await app.apiPost('/quest/choose', {questId: questId, branchId: branchId})
                app.goto('/play');
            }
        });
    });

    $("back-button").addEventListener("click", (event) => {
        app.goto('/quests');
    });
}
