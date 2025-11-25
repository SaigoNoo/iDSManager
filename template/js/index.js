const grid = document.getElementById("game_grid");


async function construct_table() {
    const res = await fetch(`${api_url}/api/search/game`, {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        }
    )

    const response = await res.json();

    console.log("Jeux reçus :", response);

    grid.innerHTML = response.map(el => `
        <img src="${el.cover_url}" alt="${el.tag_name}" title="${el.title.fr}">
    `).join('');
}

construct_table();