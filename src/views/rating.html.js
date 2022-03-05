import { $ } from "../modules/utils.ts";
import Handlebars from 'handlebars/dist/cjs/handlebars.js';

const html = `
<div class="rating-page">
    <div id="back-button" class="title-container clickable low-opacity">
        <linkButton href="/me">
            <arrow class="arrow left"></arrow>
            <span class="text-big-x lighting-text">В профиль</span>
        </linkButton>
    </div>
    
    <ul id="rating-listing" class="listing">
        <!--Users will be there-->
    </ul>
</div>

<div class="float-button text-middle">
    <div class="hover-text">Трахнуть кого-нибудь</div>
    <svg pointer-events="none" xmlns="http://www.w3.org/2000/svg"><path transform="scale(2.2) translate(-1,-1)" d="M10 3.25c.41 0 .75.34.75.75v5.25H16a.75.75 0 010 1.5h-5.25V16a.75.75 0 01-1.5 0v-5.25H4a.75.75 0 010-1.5h5.25V4c0-.41.34-.75.75-.75z"></path></svg>
</div>
`;


const userTemplate = Handlebars.compile(`
<li data-user-id="{{ id }}" class="text-big">
    {{ name }}
    <span class="text info">{{ rating }}</span>
    <span class="text choose">Профиль<arrow class="arrow right"></arrow></span>
</li>
`)


export async function handler(element, app) {
    element.innerHTML = html;

    const listing = $("rating-listing");

    const response = await app.apiGet("/rating")
    const res = await response.json()

    listing.innerHTML = "";
    res.forEach(user => {
        listing.innerHTML += userTemplate(user);
    });
}
