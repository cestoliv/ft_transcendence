# REST API

Every routes, except `/login` and `/42oauth` requires to user to be logged in. You need to provide an Bearer token in the request headers.

```
authorization: Bearer <token>
```

## Login

```
GET /api/v1/auth/login
GET /api/v1/auth/login?username={}
```
If a username is provided: Login with this username
If no username is provided: Redirect user to 42 intra login page

## Register

```
POST /api/v1/auth/register
{
	username: string
}
```

Register a user that doesn't have a 42 account. (to create a user with a 42 account, go to `/api/v1/auth/login`, the account will be creatde if it doesn't exist)

## 42 Oauth Callback

```
GET /api/v1/auth/42oauth?code={}
```

Users are redirect here by 42 intra login with a code.
We retrieve a bearer and give it has cookie to the client. Then the client is redirected to the frontend.

If the user has enabled TOTP, the bearer can only be used to validate the TOTP at `/totp/:totp` ([Validate TOTP](#validate-totp))

## Enable TOTP

```
POST /api/v1/auth/totp/enable
```

### Return
```javascript
{
	secret: string, // the TOTP secret that the user must store
	url: string, // the url that can be used to create a QRCode for authentificator apps
}
```

## Validate TOTP

```
POST /api/v1/auth/totp/{totp}
```

If the given TOTP is correct, return a new bearer token that can be used in the whole app.

### Return
-	```javascript
	{
		bearer: string, // a bearer token that can be used in the whole app
	}
	```
-	```javascript
	{
		statusCode: 401,
		message: 'Unauthorized',
		error: 'Invalid token'
				| 'Invalid TOTP',
	}
	```

## Get my profile

```
GET /api/v1/users/me
```

### Return
- The user profile ([User](#user))
- **401** error because the user is not signed in, or haven't provided it's TOTP
	```javascript
	{
		statusCode: 401,
		message: 'Unauthorized',
		error: string
				| 'TOTP not validated, go to /api/v1/auth/totp',
	}
	```

# Websocket API

Every websocket requests can return an Unauthorized error if the user is not logged in.

```javascript
{
	code: 401,
	message: 'Unauthorized',
	error: string,
}
```

## Example

```javascript
socket.emit('channels_create', {
	name: 'My new Channel',
	visibility: 'public',
}, (data) => {
	console.log(data); // The new channel object
});
```

## Channels

### **Create channel**

#### Input
```javascript
message: `channels_create`
payload: {
	name: string,
	visibility: 'pubic' | 'private' | 'password-protected'
	password: string // Optionnal
}
```

#### Return
- The created channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```

### **List channels**

#### Input
```javascript
message: `channels_findAll`
payload: empty
```

#### Return
- An channel array ([Channel[]](#channel))

### **Get channel**

#### Input
```javascript
message: `channels_findOne`
payload: {
	id: number, // the id of the channel
}
```

#### Return
- A channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
	}
	```

### **Set channel visibility**

#### Input
```javascript
message: `channels_setVisibility`
payload: {
	id: number, // the id of the channel,
	visibility: 'public' | 'private' | 'password-protected',
	password: string // optionnal, mandatory when choosing password-protected visibility
}
```

#### Return
- The updated channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['You are not the owner of the channel']
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
	}
	```

### **Join channel**

#### Input
```javascript
message: `channels_join`
payload: {
	code: string,
	password: string, // Optionnal
}
```

#### Return
- The joined channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['Channel is private']
				| ['Wrong password']
				| ['You are banned from this channel until <ISO date>']
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
	}
	```

### **List joined channel**

#### Input
```javascript
message: `channels_list`
payload: empty
```

#### Return
- An array of channel object ([Channel[]](#channel))

### **Leave channel**

#### Input
```javascript
message: `channels_leave`
payload: {
	id: number, // the channel id
}
```

#### Return
- The leaved channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
				| ['You are not in the channel']
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
	}
	```

### **Add channel administrator**

#### Input
```javascript
message: `channels_addAdmin`
payload: {
	id: number, // the channel id
	user_id: number,
}
```

#### Return
- The channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
				| ['User is not in the channel']
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['You are not the owner of the channel'],
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
				| ['User not found']
	}
	```

### **Remove channel administrator**

#### Input
```javascript
message: `channels_removeAdmin`
payload: {
	id: number, // the channel id
	user_id: number,
}
```

#### Return
- The channel object ([Channel](#channel))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
				| ['User is not an admin of the channel']
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['You are not the owner of the channel'],
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
				| ['User not found']
	}
	```

### **Ban user from channel**

To unban a user, simply ban the user again with a past date.

#### Input
```javascript
message: `channels_banUser`
payload: {
	id: number, // the channel id
	user_id: number,
	until: string, // ISO date of de-ban
}
```

#### Return
- A ChannelBannedUser object ([ChannelBannedUser](#channelbanneduser))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['You are not an admin of the channel'],
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
				| ['User not found']
	}
	```

### **Mute user from channel**

To unmute a user, simply mute the user again with a past date.

#### Input
```javascript
message: `channels_muteUser`
payload: {
	id: number, // the channel id
	user_id: number,
	until: string, // ISO date of de-ban
}
```

#### Return
- A ChannelMutedUser object ([ChannelMutedUser](#channelmuteduser))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['You are not an admin of the channel'],
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
				| ['User not found']
	}
	```

### **Invite user in channel**

#### Input
```javascript
message: `channels_inviteUser`
payload: {
	id: number, // the channel id
	user_id: number,
}
```

#### Return
- A ChannelInvitedUser object ([ChannelInvitedUser](#channelinviteduser))
- ```javascript
	{
		code: 400,
		message: 'Bad request',
		errors: string[] // describing malformed payload
	}
	```
- ```javascript
	{
		code: 403,
		message: 'Forbidden',
		errors: ['You are not an admin of the channel'],
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
				| ['User not found']
	}
	```

# Websocket Events

Comming soon...

# Objects

## User

```javascript
{
	id: number,
	id42: number, // -1 for non-42 users
	username: string,
}
```

## Channel

```javascript
{
	id: number,
	code: string,
	owner: User,
	name: string,
	visibility: 'public' | 'private' | 'password-protected',
	admins: User[],
	members: User[],
	banned: User[],
	muted: User[],
	invited: User[],
}
```

## ChannelBannedUser
```javascript
{
	userId: number,
	user: User,

	channelId: number,
	channel: Channel,

	until: Date,
}
```

## ChannelMutedUser
```javascript
{
	userId: number,
	user: User,

	channelId: number,
	channel: Channel,

	until: Date,
}
```

## ChannelInvitedUser
```javascript
{
	userId: number,
	user: User,

	inviterId: number,
	inviter: User,

	channelId: number,
	channel: Channel,

	invited_at: Date,
}
```
