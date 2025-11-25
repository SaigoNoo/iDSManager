const api_url = "http://127.0.0.1:8000";
const api = document.getElementById('api');
const body = document.querySelector('body');
const iframe = document.createElement("iframe");

/* Plugin: SPOTIFY */
function globalInit() {
    iframe.id = "spotify_player";
    iframe.src = "https://open.spotify.com/embed/track/0xsACxtkQkj3tCkmg0ZPUX?utm_source=generator";
    iframe.loading = "lazy";

    body.prepend(iframe);
    api.href = `${api_url}/docs`;
}

function move(id_name) {
    document.getElementById(id_name).scrollIntoView({behavior: 'smooth'});
}

function move_page(page) {
    return location.href = `${page}.html`
}


globalInit();