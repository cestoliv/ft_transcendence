# Table of content

- [Rest Api](#rest-api)
- [Websocket Api](#websocket-api)
- [Websocker Events](#websocket-events)
- [Objects](#objects)

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
	//console.log(data); // The new channel object
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```

### **List channels**

List every channel the user can see. That includes public channels, private channels in which the user is invited and every channels the user has joined.

#### Input
```javascript
message: `channels_list`
payload: empty
```

#### Return
- An channel array ([Channel[]](#channel))

### **Get channel**

#### Input
```javascript
message: `channels_get`
payload: {
	id: number, // the id of the channel
}
```

#### Return
- A channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['Channel not found']
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['You are not allowed to see this channel']
		}
		```

### **Update channel**

#### Input
```javascript
message: `channels_update`
payload: {
	id: number, // the id of the channel,
	name: string, // optionnal new name
	visibility: 'public' | 'private' | 'password-protected', // optionnal new visibility
	password: string // optionnal, mandatory when choosing password-protected visibility
}
```

#### Return
- The updated channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel owner can update channel']
		}
		```
	+ ```javascript
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['You are not invited to this channel']
					| ['Password is required']
					| ['Wrong password']
					| ['You are banned from this channel']
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['Channel not found']
		}
		```

### **List joined channel**

#### Input
```javascript
message: `channels_listJoined`
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
					| ['User is not a member of this channel']
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel owner can add admins'],
		}
		```
	+ ```javascript
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
					| ['User is not an admin of the channel']
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel owner can remove admins'],
		}
		```
	+ ```javascript
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel admins can ban users'],
		}
		```
	+ ```javascript
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel admins can mute users'],
		}
		```
	+ ```javascript
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
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel admins can invite users'],
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['Channel not found']
					| ['User not found']
		}
		```

### **Send message into channel**

#### Input
```javascript
message: `channels_sendMessage`
payload: {
	id: number, // the channel id
	message: string,
}
```

#### Return
- A ChannelMessage object ([ChannelMessage](#channelmessage))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['Only channel members can send messages'],
					| ['You are muted in this channel']
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['Channel not found']
		}
		```

### **Get channel messages**

Retrieve 50 message before the date passed.

#### Input
```javascript
message: `channels_messages`
payload: {
	id: number, // the channel id
	before: string, // ISO date
}
```

### Example
To retrieve the last 50 messages.
```javascript
socket.emit('channels_messages', {
	id: 1,
	before: new Date().toISOString(),
},
	(data) => {
	//	console.log(data); // The messages array
	}
);
```

#### Return
- An array of ChannelMessage object ([ChannelMessage[]](#channelmessage))
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
		errors: ['Only channel members can read messages'],
	}
	```
- ```javascript
	{
		code: 404,
		message: 'Not found',
		errors: ['Channel not found']
	}
	```

## Users

### **Get user**

#### Input
```javascript
message: `users_get`
payload: {
	id: number // User id
}
```

#### Return
- The user object ([User](#user))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```

### **Update user**

#### Input
```javascript
message: `users_update`
payload: {
	id: number, // User id
	username: string, // Optionnal new username
}
```

#### Return
- The updated user object ([User](#user))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['You can only update your own user'],
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

### **Invite as friend**

#### Input
```javascript
message: `users_inviteFriend`
payload: {
	username: string, // Username of the friend to invite
}
```

#### Return
- The new friendship object ([UserFriend](#userfriend))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['You have been banned'],
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```
	+ ```javascript
		{
			code: 409,
			message: 'Conflict',
			errors: ['User already invited or already friend'],
		}
		```

### **Accept friendship request**

#### Input
```javascript
message: `users_acceptFriend`
payload: {
	id: number, // Id of the user how invited the client
}
```

#### Return
- The updated friendship object ([UserFriend](#userfriend))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 409,
			message: 'Conflict',
			errors: ['Friendship already accepted'],
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

### **Remove friend (or decline friendship request)**

#### Input
```javascript
message: `users_removeFriend`
payload: {
	id: number, // Id of the user how invited the client
}
```

#### Return
- The deleted friendship object ([UserFriend](#userfriend))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 409,
			message: 'Conflict',
			errors: ['Friendship not found'],
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

### **Ban user**

#### Input
```javascript
message: `users_ban`
payload: {
	id: number, // Id of the user to ban
	until: string, // ISO Date of the un-ban
}
```

#### Return
- The new user banned object ([BannedUser](#banneduser))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

### **Mute user**

#### Input
```javascript
message: `users_mute`
payload: {
	id: number, // Id of the user to ban
	until: string, // ISO Date of the un-ban
}
```

#### Return
- The new user muted object ([MutedUser](#muteduser))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

### **Send a message**

#### Input
```javascript
message: `users_sendMessage`
payload: {
	id: number, // Id of a friend
	until: string, // Message to send
}
```

#### Return
- The new message object ([UserMessage](#usermessage))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['You can only send messages to friends'],
					| ['You are muted by this user']
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

### **Get messages**

#### Input
```javascript
message: `users_getMessages`
payload: {
	id: number, // Id of a friend
	before: string, // ISO date
}
```

#### Return
- An array of messages object ([UserMessage[]](#usermessage))
- A [WSResponse](#wsresponse)
	+ ```javascript
		{
			code: 400,
			message: 'Bad request',
			errors: string[] // describing malformed payload
		}
		```
	+ ```javascript
		{
			code: 403,
			message: 'Forbidden',
			errors: ['You can only get messages from friends'],
		}
		```
	+ ```javascript
		{
			code: 404,
			message: 'Not found',
			errors: ['User not found'],
		}
		```

# Websocket Events

## Channel

### **New message**

- Event name: `channels_message`
- Data type: [ChannelMessage](#channelmessage)

#### Example

```javascript
socket.on('channels_message', (data: any) => {
	//console.log(`New message from ${data.user.username} in ${data.channel.name}: ${data.message}`)
});
```

# Objects

## WSResponse

```javascript
{
	statusCode: number, // HTTP status code
	error: string, // Relatded HTTP message
	messages: string[], // array of string describing the problem
}
```

## User

```javascript
{
	id: number,
	id42: number, // -1 for non-42 users
	username: string,
	invitedFriends: UserFriends[],
	friendOf: UserFriend[],
	friends: User[],
}
```

## UserFriend

```javascript
{
	inviterId: number,
	inviter: User,

	inviteeId: number,
	invitee: User,

	accepted: boolean
}
```

## BannedUser

```javascript
{
	userId: number,
	user: User,

	bannedId: number,
	banned: User,

	until: Date
}
```

## MutedUser

```javascript
{
	userId: number,
	user: User,

	mutedId: number,
	muted: User,

	until: Date
}
```

## UserMessage

```javascript
{
	id: number,

	senderId: number,
	sender: User,

	receiverId: number,
	receiver: User,

	message: string,

	sentAt: Date
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

## ChannelMessage
```javascript
{
	id: number,

	senderId: number,
	serder: User,

	channelId: number,
	channel: Channel,

	message: string,

	sentAt: Date,
}
```
