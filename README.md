# Important things to do
- Remove the OTP secret return from every api return (user, channels, games, ...)

# Developing

Create an `.env` file at the base of the project (next to the `docker-compose.dev.yml`)

```env
DB_NAME=transcendence
DB_USER=transcendence
DB_PASS=transcendence

API42_CLIENT_ID=<your 42 app client ID>
API42_CLIENT_SECRET=<your 42 app client SECRET>
API42_REDIRECT_URI=http://api.transcendence.local/api/v1/auth/42oauth

JWT_SECRET=<a random string>
COOKIE_DOMAIN=.transcendence.local

FRONTEND_REDIRECT_URL=http://transcendence.local
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
