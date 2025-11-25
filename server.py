from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from json import load, dumps
from pydantic import BaseModel
from os import walk
from os.path import exists


# ==========================
#  DATA HANDLER
# ==========================

class Data:
    def __init__(self):
        self.file = "datas.json"
        self.data = self.__load_config()

    def __load_config(self):
        if not exists(self.file):
            with open(self.file, "w", encoding="utf-8") as f:
                f.write("{}")
        with open(self.file, "r", encoding="utf-8") as conf:
            return load(conf)

    def __write_config(self):
        with open(self.file, "w", encoding="utf-8") as conf:
            conf.write(dumps(self.data, indent=4))

    def set_data(self, tagname: str, title_fr: str, title_en: str,
                 desc_fr: str, desc_en: str, release: int, cover_url: str):
        its_edit = tagname in self.data

        self.data[tagname] = {
            "tag_name": tagname,
            "title": {
                "fr": title_fr,
                "en": title_en
            },
            "description": {
                "fr": desc_fr,
                "en": desc_en
            },
            "release": release,
            "cover_url": cover_url
        }

        self.__write_config()

        return JSONResponse(
            {"message": "Modification effectuée" if its_edit else "Nouvelle entrée ajoutée"},
            status_code=200
        )

    def delete_game(self, tagname: str):
        if tagname in self.data:
            del self.data[tagname]
            self.__write_config()
            return JSONResponse(
                {
                    "message": "Le jeu a bien été supprimé !"
                }
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Le jeu demandé n'a pas été trouvé !"
            )


# ==========================
#  USER HANDLER
# ==========================

class Users:
    def __init__(self):
        self.users_file = "users.json"
        self.tokens_file = "tokens.json"

        self.users = self.__read_json(self.users_file)
        self.token = self.__read_json(self.tokens_file)

    @staticmethod
    def __read_json(path):
        if not exists(path):
            with open(path, "w", encoding="utf-8") as f:
                f.write("{}")
        with open(path, "r", encoding="utf-8") as f:
            return load(f)

    def __save_json(self, path, content):
        with open(path, "w", encoding="utf-8") as f:
            f.write(dumps(content, indent=4))

    def __save_tokens(self):
        self.__save_json(self.tokens_file, self.token)

    def __user_exist(self, username):
        return username in self.users

    @staticmethod
    def is_email(identifier):
        return "@" in identifier and "." in identifier.split("@")[1]

    def get_username_from_email(self, email: str):
        for username, data in self.users.items():
            if data.get("email") == email:
                return username
        raise HTTPException(404, "Aucun utilisateur avec cet email.")

    def declare_token(self, username: str):
        token = str(uuid4())
        self.token[username] = token
        self.__save_tokens()
        return token

    def get_username_from_token(self, token: str):
        for username, user_token in self.token.items():
            if token == user_token:
                return username
        return None

    def is_login_valid(self, username_or_email, password):
        if self.is_email(username_or_email):
            username = self.get_username_from_email(username_or_email)
        else:
            if not self.__user_exist(username_or_email):
                raise HTTPException(404, "Utilisateur inconnu.")
            username = username_or_email

        if password == self.users[username]["password"]:
            return {
                "message": "Connecté",
                "token": self.declare_token(username)
            }

        raise HTTPException(401, "Mot de passe incorrect.")

    def login_via_token(self, token):
        if self.get_username_from_token(token) is None:
            raise HTTPException(401, "Token invalide.")
        return {"message": "Token valide"}

    def get_user_data(self, username):
        return self.users.get(username)


# ==========================
#  API LOGIC
# ==========================

class API:
    def __init__(self, app_instance: FastAPI, data_instance: Data):
        self.app = app_instance
        self.data = data_instance

    def search_game(self, by=None, search=None):
        search = search.lower() if search else None
        results = []

        for game in self.data.data.values():

            if not search:  # return all
                results.append(game)
                continue

            if by == "title":
                if any(search in game["title"][lang].lower() for lang in game["title"]):
                    results.append(game)

            elif by == "type":
                if search in game["tag_name"].lower():
                    results.append(game)

        return results

    def load_game_data(self, tag_name):
        if tag_name not in self.data.data:
            raise HTTPException(404, "Tag introuvable.")
        return self.data.data[tag_name]

    @staticmethod
    def upload_picture_profil(username: str, file: UploadFile = File(...)):
        ext = file.filename.split(".")[-1]
        with open(f"images/profil_pictures/{username}.{ext}", "wb") as buffer:
            buffer.write(file.file.read())
        return JSONResponse(
            {
                "message": "Image uploadée !"
            }
        )

    @staticmethod
    def load_profile_picture(username: str):
        def get_ext():
            for root, dir, files in walk("images/profil_pictures/"):
                for file in files:
                    if username == ".".join(file.split(".")[:-1]):
                        return file.split(".")[-1]
            return None

        ext = get_ext()
        return FileResponse(f"images/profil_pictures/{username}.{ext}")


# ==========================
#  FASTAPI SETUP
# ==========================

data = Data()
user = Users()

app = FastAPI(title="iDSManager", debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # autorise tout pour dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = API(app, data)


# ==========================
#  MODELS
# ==========================

class Authentification(BaseModel):
    username_mail: str
    password: str


class AuthentificationViaToken(BaseModel):
    token: str


class AddEditGame(BaseModel):
    tag_name: str
    title_fr: str
    title_en: str
    desc_fr: str
    desc_en: str
    release: int
    cover_url: str


# ==========================
#  ROUTES
# ==========================

@app.get("/api/search/game")
async def search_games(by: str = None, search: str = None):
    return api.search_game(by=by, search=search)


@app.post("/api/user/authentification")
async def auth(auth: Authentification):
    return user.is_login_valid(auth.username_mail, auth.password)


@app.post("/api/user/authentification_token")
async def auth_token(auth: AuthentificationViaToken):
    return user.login_via_token(auth.token)


@app.post("/api/user/data")
async def data_user(auth: AuthentificationViaToken):
    username = user.get_username_from_token(auth.token)
    if username is None:
        raise HTTPException(401, "Token invalide.")
    return user.get_user_data(username)


@app.get("/api/game/data")
async def load_game(tagname: str):
    return api.load_game_data(tagname)


@app.post("/api/game/add_edit")
async def add_edit(game_data: AddEditGame):
    return data.set_data(
        tagname=game_data.tag_name,
        title_fr=game_data.title_fr,
        title_en=game_data.title_en,
        desc_fr=game_data.desc_fr,
        desc_en=game_data.desc_en,
        release=game_data.release,
        cover_url=game_data.cover_url
    )


@app.delete("/api/game/delete")
async def delete(tagname: str):
    return data.delete_game(tagname=tagname)


@app.post("/api/user/upload_picture")
async def upload_picture(token: str, file: UploadFile = File(...)):
    print(file)
    username = user.get_username_from_token(token)
    api.upload_picture_profil(
        username=username,
        file=file
    )


@app.get("/api/user/load_profile_picture")
async def load_profile_picture(token: str):
    username = user.get_username_from_token(token)
    return api.load_profile_picture(username=username)