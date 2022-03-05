import {$, setTimedClass} from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars';
import {closeRoll, isClosedRoll, openRoll} from "../modules/show-hide";

const html = `
<div class="quests-page">
    <div id="choose-quest-block">
        <div class="title-container bg">
            <div>
                <div class="text-big-x lighting-text">Твои квесты</div>
                <div class="text">Тут можно отредактировать созданные тобой квесты</div>
            </div>
        </div>
        <ul id="quests-listing" class="listing">
            <!--Quests will be there-->
        </ul>
    </div>
    
    <linkButton class="float-button text-middle" href="/quest-create">
        <div class="hover-text">Создать квест</div>
        <svg pointer-events="none" xmlns="http://www.w3.org/2000/svg"><path transform="scale(2.2) translate(-1,-1)" d="M10 3.25c.41 0 .75.34.75.75v5.25H16a.75.75 0 010 1.5h-5.25V16a.75.75 0 01-1.5 0v-5.25H4a.75.75 0 010-1.5h5.25V4c0-.41.34-.75.75-.75z"></path></svg>
    </linkButton>
</div>
`;


const questTemplate = Handlebars.compile(`
<li data-quest-id="{{ id }}" data-quest-button class="text-big">{{ title }}
    <span class="text choose">ИЗМЕНИТЬ<arrow class="arrow right"></arrow></span>
    <div class="text info">{{ description }}</div>
</li>
`);


export async function handler(element, app) {
    element.innerHTML = html;

    const listing = $("quests-listing");

    const response = await app.apiGet(`/quest?userId=${app.storage.userId}`)
    const res = await response.json()

    listing.innerHTML = "";
    res.forEach(quest => {
        listing.innerHTML += questTemplate(quest);
    });

    // click on quest => see details
    listing.querySelectorAll("*[data-quest-button]").forEach((button) => {
        button.addEventListener("click", async () => {
            const questId = button.getAttribute("data-quest-id");
            app.goto(`/quest-edit?questId=${questId}`)
        });
    });
}
