import { $ } from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, isClosedRoll, openRoll, openRollList} from "../modules/show-hide";
import {BASE_URL_PART} from "../constants";

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
        <ul id="listing" class="listing branches-listing roll-active closed">
            <!--Branches will be there-->
        </ul>
    </div>
</div>
`;

const branchTemplate = Handlebars.compile(`
<li data-branch-id="{{ id }}" data-branch-button class="text-big">
    {{#unless ispublished}}
        <img src="${BASE_URL_PART}/images/invisible.svg" alt="unpublished" class="quest-modifier">
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
    openRollList(listing);

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
