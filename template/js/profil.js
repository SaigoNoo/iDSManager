async function upload_profile(balise) {
    const formData = new FormData();
    const pfp_preview = document.getElementById('pfp_preview');

    formData.append("file", balise.files[0]);
    pfp_preview.src = URL.createObjectURL(balise.files[0]);


    /*
    const res = await fetch(`${api_url}/api/user/load_profile_picture`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    });
     */
}

async function load_picture() {
    const pfp_preview = document.getElementById('pfp_preview');
    const res = await fetch(`${api_url}/api/user/load_profile_picture?token=${have_token()}`, {
        method: "GET",
        headers: {"Content-Type": "image/jpg"}
    });

    const blob = await res.blob();

    pfp_preview.src = URL.createObjectURL(blob);
}

async function preload_data() {
    const name = document.getElementById('name');
    const fname = document.getElementById('fname');
    const email = document.getElementById('email');

    const res = await fetch(`${api_url}/api/user/data`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            token: have_token()
        })
    })

    const response = await res.json();

    name.value = response.name;
    fname.value = response.first_name;
    email.value = response.email;
}

function triggerFileInput() {
    document.getElementById("pfp_input").click();
}

function previewPfp(input) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById("pfp_preview");
    preview.src = URL.createObjectURL(file);

    // uploadProfilePicture(file); // si tu veux uploader directement
}

// Clique sur l'image pour ouvrir le file picker
document.querySelector('.pfp-container').addEventListener('click', triggerFileInput);
