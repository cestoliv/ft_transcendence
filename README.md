# Developing

Create an `.env` file at the base of the project (next to the `docker-compose.dev.yml`)

Generate the secrets with `openssl rand -hex 16`.

```env
DB_NAME=transcendence
DB_USER=transcendence
DB_PASS=transcendence

API42_CLIENT_ID=<your 42 app client ID>
API42_CLIENT_SECRET=<your 42 app client SECRET>
API42_REDIRECT_URI=http://api.transcendence.local/api/v1/auth/42oauth

JWT_SECRET=<a random string>
TOTP_SECRET=<a random string>
COOKIE_SECRET=<a random string>

COOKIE_DOMAIN=.transcendence.local
FRONTEND_URL=http://transcendence.local
API_URL=http://api.transcendence.local/api/v1
SOCKET_URL=http://api.transcendence.local

NGINX_SERVER_NAME_BACK=api.transcendence.local
NGINX_SERVER_NAME_FRONT=transcendence.local

CORS_ORIGIN=http://transcendence.local
```

Edit the `/etc/hosts` file on your system to include:

```
127.0.0.1    api.transcendence.local
127.0.0.1    transcendence.local
```

Then, you dan start the docker containers in developing mode (all changes made to local files will take direct effect):

```bash
docker-compose -f docker-compose.dev.yml up --build
```

You will be able to access the webapp by visiting `http://transcendence.local`

# Creating an account without 42

The fonctionnality isn't actually implemented in the interface.

**Create the account**
```bash
curl -X POST http://api.transcendence.local/api/v1/auth/register -d '{"username": "ocartier5"}' -H "Content-Type: application/json" | jq
# return (if there is no problem)
# {
#   "user": {
#     "id42": null,
#     "username": "im_not_a_42_student",
#     "otp": null,
#     "id": 21
#   },
#   "secret": "CEPQ4XANMBZQ2QBA",
#   "url": "otpauth://totp/Transcendence:?secret=CEPQ4XANMBZQ2QBA&period=30&digits=6&algorithm=SHA1&issuer=Transcendence"
# }
```
Store the TOTP `secret` in your password manager or use it in https://totp.app/ (for example).

**Connect to your new account**

Go to `http://api.transcendence.local/api/v1/auth/login?username=im_not_a_42_student`. *replace with you new username*

That should redirect you to a page were you will be able to input your TOTP and enter the app.
