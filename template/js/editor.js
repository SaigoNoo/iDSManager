const search_results = document.getElementById("search_results");
const tagname_i = document.getElementById("tagname");
const title_i = document.getElementById("title");
const title_original_i = document.getElementById("title_original");
const description_i = document.getElementById("description");
const description_original_i = document.getElementById("description_original");
const release = document.getElementById("release");
const cover_url = document.getElementById("cover_url");
const cover_preview = document.getElementById("image_preview");
const game_name = document.getElementById("game_name");
const buttons_action = document.getElementById("buttons_actions");
const delete_button = document.getElementById("delete_button");
const search_game_i = document.getElementById("search_game");

async function create_index() {
    const res = await fetch(`${api_url}/api/search/game`, {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        }
    )

    const data = await res.json();

    search_results.innerHTML = `
        <div onclick="empty_inputs()" class="game_results" style="background-image: url('https://indieground.net/wp-content/uploads/2024/09/indieblog-nintendologo-cover.jpg')">
        <img src="https://i.pinimg.com/736x/d9/f0/ad/d9f0ad94a6b16e52861ba30705ad05c3.jpg">
        <label>Créer une entrée</label>
        </div>
    `;

    search_results.innerHTML += data.map(x => `
        <div id="${x.tag_name}" onclick="preload_game('${x.tag_name}')" class="game_results" 
             style="background-image: url('${x.cover_url}')">
            <img src="${x.cover_url}">
            <label>${x.title.fr}</label>
        </div>
    `).join("");
}

async function search_game(text) {
    const res = await fetch(
        `${api_url}/api/search/game?by=title&search=${text}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    )

    const data = await res.json();

    let content = data.map(x => `
        <div id="${x.tag_name}" onclick="preload_game('${x.tag_name}')" class="game_results" 
             style="background-image: url('${x.cover_url}')">
            <img src="${x.cover_url}">
            <label>${x.title.fr}</label>
        </div>
    `).join("");


    if (text.length === 0) {
        search_results.innerHTML = `
        <div onclick="empty_inputs()" class="game_results" style="background-image: url('https://indieground.net/wp-content/uploads/2024/09/indieblog-nintendologo-cover.jpg')">
        <img src="https://i.pinimg.com/736x/d9/f0/ad/d9f0ad94a6b16e52861ba30705ad05c3.jpg">
        <label>Créer une entrée</label>
        </div>${content}
        `;
    } else {
        search_results.innerHTML = content;
    }
}

async function preload_game(tagname) {
    const res = await fetch(`${api_url}/api/game/data?tagname=${tagname}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    });

    const data = await res.json();

    cover_preview.src = data.cover_url;
    tagname_i.value = data.tag_name;
    title_i.value = data.title.fr;
    game_name.innerText = data.title.fr;
    title_original_i.value = data.title.en;
    description_i.value = data.description.fr;
    description_original_i.value = data.description.en;
    release.value = data.release;
    cover_url.value = data.cover_url;
    delete_button.onclick = () => {
        delete_game(tagname);
    }
    for (let button of buttons_action.children) {
        button.disabled = false;
    }
}

async function update_preview(input) {
    cover_preview.src = input.value;
}

async function empty_inputs() {
    cover_preview.src = "https://i.redd.it/ppol67krri8f1.png";
    tagname_i.value = "";
    title_i.value = "";
    game_name.innerText = "";
    title_original_i.value = "";
    description_i.value = "";
    description_original_i.value = "";
    release.value = "";
    cover_url.value = "";
    buttons_action.children[0].disabled = true;
    buttons_action.children[1].disabled = true;
    buttons_action.children[2].disabled = true;
}

async function has_change_for_save() {
    if (
        tagname_i.value.length > 0 ||
        title_i.value.length > 0 ||
        title_original_i.value.length > 0 ||
        description_i.value.length > 0 ||
        description_original_i.value.length > 0 ||
        release.value.length > 0 ||
        cover_url.value.length > 0
    ) {
        buttons_action.children[0].disabled = false;
    } else {
        buttons_action.children[0].disabled = true;
    }
}

function check_validity() {
    if (!tagname_i.checkValidity()) {
        tagname_i.reportValidity();
        return false;
    }
    if (!title_i.checkValidity()) {
        title_i.reportValidity();
        return false;
    }
    if (!title_original_i.checkValidity()) {
        title_original_i.reportValidity();
        return false;
    }
    if (!release.checkValidity()) {
        release.reportValidity();
        return false;
    }
    if (!description_i.checkValidity()) {
        description_i.reportValidity();
        return false;
    }
    if (!description_original_i.checkValidity()) {
        description_original_i.reportValidity();
        return false;
    }
    if (!cover_url.checkValidity()) {
        cover_url.reportValidity();
        return false;
    }
    return true;
}

async function save_data() {
    if (check_validity()) {
        await fetch(`${api_url}/api/game/add_edit`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                "tag_name": tagname_i.value,
                "title_fr": title_i.value,
                "title_en": title_original_i.value,
                "desc_fr": description_i.value,
                "desc_en": description_original_i.value,
                "release": release.value,
                "cover_url": cover_url.value
            })
        });
        empty_inputs();
        create_index();
        search_game_i.value = "";
    }
}

async function delete_game(tag_name) {
    await fetch(`${api_url}/api/game/delete?tagname=${tag_name}`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"}
    })
    create_index();
    search_game_i.value = "";
    empty_inputs();
}