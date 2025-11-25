// ======= Cookies ======= //
function have_token() {
    const cookie = document.cookie.split(";").find(c => c.trim().startsWith("auth_token="));
    return cookie ? cookie.split("=")[1] : false;
}

function deleteCookie(name) {
    document.cookie = `${name}=; max-age=0; path=/;`;
}

function set_token(token) {
    document.cookie = `auth_token=${token}; path=/; max-age=86400`; // 1 jour
}

// ======= Authentification ======= //
async function authentification(form, event) {
    event.preventDefault();
    const error_message = document.getElementById('login_error');

    try {
        const res = await fetch(`${api_url}/api/user/authentification`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username_mail: form.username.value,
                password: form.password.value
            })
        });

        const response = await res.json();

        if (res.ok) {
            set_token(response.token);
            await updateUI();
        } else {
            error_message.innerHTML = response.detail || "Erreur de connexion.";
        }
    } catch (err) {
        console.error(err);
        error_message.innerHTML = "Impossible de contacter le serveur.";
    }
}

// ======= Vérification token ======= //
async function is_token_valid() {
    const token = have_token();
    if (!token) return false;

    try {
        const res = await fetch(`${api_url}/api/user/authentification_token`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token})
        });

        if (res.ok) {
            await updateUI();
            return true;
        } else {
            deleteCookie('auth_token');
            return false;
        }
    } catch (err) {
        console.error(err);
        return false;
    }
}

// ======= Mettre à jour l'UI ======= //
async function updateUI() {
    const menu = document.getElementById('connection');
    const login = document.getElementById('login');
    const info = document.getElementById('infos');
    const name_info = document.getElementById('name_info');
    const up_act = document.getElementById('upload_move');
    const token = have_token();

    if (!token) return;

    try {
        const res = await fetch(`${api_url}/api/user/data`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token})
        });
        if (!res.ok) return;

        const data = await res.json();

        if (up_act) {
            up_act.classList.remove('locked');
            up_act.onclick = () => move_page("game_editor");
        }

        if (login) {
            login.style.visibility = "hidden";
            login.style.display = "none";
        }

        if (info) {
            info.style.visibility = "visible";
            info.style.display = "block";
        }

        if (menu) {
            menu.innerText = 'Mon compte';
            menu.href = 'profil_editor.html';
        }

        if (name_info) {
            name_info.innerText = `${data.name} ${data.first_name[0]}.`;
        }

    } catch (err) {
        console.error("Erreur lors de la mise à jour de l'UI :", err);
    }
}

// ======= Déconnexion ======= //
function disconnect() {
    deleteCookie('auth_token');
    location.reload();
}

// ======= Initialisation ======= //
window.addEventListener('DOMContentLoaded', async () => {
    await is_token_valid();
});
