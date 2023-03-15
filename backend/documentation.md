# Table of content

- [Rest API](#rest-api)
- [Websocket API](#websocket-api)
- [Websocker Events](#websocket-events)
- [Objects](#objects)

## Per modules

- **Auth**
	+ **Rest API**
		* [Login](#login)
		* [Register](#register)
		* [42 oauth callback](#42-oauth-callback)
		* [Enable TOTP](#enable-totp)
		* [Validate TOTP](#validate-totp)
- **Users**
	+ **Rest API**
		* [Get informations about yourself](#get-my-profile)
		* [Upload a profile picture](#upload-profile-picture)
		* [Generate a profile picture](#generate-a-profile-picture)
		* [Use the 42 intra profile picture](#use-42-intra-profile-picture)
	+ **Websocket API**
		* [Get a user](#get-user)
		* [Update a user](#update-user)
		* [Invite a firend](#invite-as-friend)
		* [Accept a friendship request](#accept-friendship-request)
		* [Remove a friend or decline friendship request](#remove-friend-or-decline-friendship-request)
		* [Ban a user from your friend](#ban-user)
		* [Mute a user](#mute-user)
		* [Send a private message](#send-a-message)
		* [Retrieve a conversation](#get-messages)
	+ **Websocket Events**
		* [New private message](#new-private-message)
		* [On profile update](#on-profile-update)
		* [On friendship invitation](#on-friendship-invitation)
		* [On friendship acceptation](#on-friendship-acceptation)
		* [On friendship deletion](#on-friendship-deletion)
		* [On ban](#on-ban)
		* [On mute](#on-mute)
- **Channels**
	+ **Websocket API**
		* [Create a channel](#create-channel)
		* [List visible channels](#list-channels)
		* [Get a channel](#get-channel)
		* [Update a channel](#update-channel)
		* [Join a channel](#join-channel)
		* [List joined channels](#list-joined-channel)
		* [Leave a channel](#leave-channel)
		* [Add a channel administrator](#add-channel-administrator)
		* [Remove a channel administrator](#remove-channel-administrator)
		* [Ban a user](#ban-user-from-channel)
		* [Mute a user](#mute-user-from-channel)
		* [Invite a user in a channel](#invite-user-in-channel)
		* [Send a message in a channel](#send-message-into-channel)
		* [Retrieve channel conversation](#get-channel-messages)
	+ **Websocket Events**
		* [New message](#new-channel-message)
		* [On channel update](#on-channel-update)
		* [On member join](#on-member-join)
		* [On member leave](#on-member-leave)
		* [On admin added](#on-admin-added)
		* [On admin removed](#on-admin-removed)
		* [On member ban](#on-member-ban)
		* [On member mute](#on-member-mute)
		* [On channel invitation](#on-channel-invitation)
- **Games**
	+ **Websocket API**
		* [Create a game](#create-a-game)
		* [Join a game](#join-a-game)
		* [Quit a game](#quit-a-game)
		* [Join the matchmaking](#join-matchmaking)
		* [Send new player position](#send-new-player-position)
		* [Invite a user in a game](#invite-a-player-in-a-game)
		* [Get a player games history](#get-player-games-history)
		* [Get a player statistics](#get-player-statistics)
		* [Get the leadreboards](#get-leaderboards)
		* [Start watching a game](#start-watching-a-game)
		* [Stop watching a game](#stop-watching-a-game)
	+ **Websocket Events**
		+ [Before game start](#game-start)
		+ [On game end](#game-end)
		+ [New opponent position](#new-opponent-position)
		+ [New score](#new-score-after-a-goal)
		+ [New ball position](#new-ball-position)
		+ [Watch - New creator position](#watch---new-creator-position)
		+ [Watch - New opponent position](#watch---new-opponent-position)
		+ [Watch - New ball position](#watch---new-ball-position)
		+ [Watch - New score](#watch---new-score-after-a-goal)
		+ [Watch - On game end](#watch---game-end)

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
```typescript
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
-	```typescript
	{
		bearer: string, // a bearer token that can be used in the whole app
	}
	```
-	```typescript
	{
		statusCode: 401,
		error: 'Unauthorized',
		messages: 'Invalid token'
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
	```typescript
	{
		statusCode: 401,
		error: 'Unauthorized',
		messages: string
				| 'TOTP not validated, go to /api/v1/auth/totp',
	}
	```

## Upload profile picture

```
POST /api/v1/users/profile-picture
```

For frontend implementation, see: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#uploading_a_file

### Return
- The user profile ([User](#user))
- `401 Unauthorized` as described before
-   ```typescript
	{
		statusCode: 400,
		error: 'Bad Request',
		messages: 'No file uploaded' |
					'File type not supported' |
					'Error while uploading the file',
	}
	```

## Generate a profile picture

```
GET /api/v1/users/profile-picture/generate
```

### Return
- The user profile ([User](#user))
- `401 Unauthorized` as described before
-   ```typescript
	{
		statusCode: 400,
		error: 'Bad Request',
		messages: 'Error while uploading the file',
	}
	```

## Use 42 intra profile picture

```
GET /api/v1/users/profile-picture/fetch42
```

### Return
- The user profile ([User](#user))
- `401 Unauthorized` as described before
-   ```typescript
	{
		statusCode: 400,
		error: 'Bad Request',
		messages: 'You need to be logged in with 42 to use this feature' |
					'Error while uploading the file',
	}
	```

## Get profile picture

```
GET /api/v1/users/profile-picture/:user_id
```

### Return
- The profile picture image
-   ```typescript
	{
		statusCode: 404,
		error: 'Not found',
		messages: 'No profile picture found',
	}
	```

# Websocket API

Every websocket requests can return an Unauthorized error if the user is not logged in.

```typescript
{
	statusCode: 401,
	error: 'Unauthorized',
	error: string,
}
```

## Example

```typescript
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
```typescript
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
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```

### **List channels**

List every channel the user can see. That includes public channels, private channels in which the user is invited and every channels the user has joined.

#### Input
```typescript
message: `channels_list`
payload: empty
```

#### Return
- An channel array ([Channel[]](#channel))

### **Get channel**

#### Input
```typescript
message: `channels_get`
payload: {
	id: number, // the id of the channel
}
```

#### Return
- A channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You are not allowed to see this channel']
		}
		```

### **Update channel**

#### Input
```typescript
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
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel owner can update channel']
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
		}
		```

### **Join channel**

#### Input
```typescript
message: `channels_join`
payload: {
	code: string,
	password: string, // Optionnal
}
```

#### Return
- The joined channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You are not invited to this channel']
					| ['Password is required']
					| ['Wrong password']
					| ['You are banned from this channel']
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
		}
		```
	+ ```typescript
		{
			statusCode: 409,
			error: 'Conflict',
			messages: ['You are already a member']
		}
		```

### **List joined channel**

#### Input
```typescript
message: `channels_listJoined`
payload: empty
```

#### Return
- An array of channel object ([Channel[]](#channel))

### **Leave channel**

#### Input
```typescript
message: `channels_leave`
payload: {
	id: number, // the channel id
}
```

#### Return
- The leaved channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
		}
		```

### **Add channel administrator**

#### Input
```typescript
message: `channels_addAdmin`
payload: {
	id: number, // the channel id
	user_id: number,
}
```

#### Return
- The channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
					| ['User is not a member of this channel']
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel owner can add admins'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
					| ['User not found']
		}
		```

### **Remove channel administrator**

#### Input
```typescript
message: `channels_removeAdmin`
payload: {
	id: number, // the channel id
	user_id: number,
}
```

#### Return
- The channel object ([Channel](#channel))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
					| ['User is not an admin of the channel']
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel owner can remove admins'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
					| ['User not found']
		}
		```

### **Ban user from channel**

To unban a user, simply ban the user again with a past date.

#### Input
```typescript
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
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel admins can ban users'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
					| ['User not found']
		}
		```

### **Mute user from channel**

To unmute a user, simply mute the user again with a past date.

#### Input
```typescript
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
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel admins can mute users'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
					| ['User not found']
		}
		```

### **Invite user in channel**

#### Input
```typescript
message: `channels_inviteUser`
payload: {
	id: number, // the channel id
	user_id: number,
}
```

#### Return
- A ChannelInvitedUser object ([ChannelInvitedUser](#channelinviteduser))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel admins can invite users'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
					| ['User not found']
		}
		```
	+ ```typescript
		{
			statusCode: 409,
			error: 'Conflict',
			messages: ["You can't invite yourself"]
					| ['There is already a pending invitation']
		}
		```

### **Send message into channel**

#### Input
```typescript
message: `channels_sendMessage`
payload: {
	id: number, // the channel id
	message: string,
}
```

#### Return
- A ChannelMessage object ([ChannelMessage](#channelmessage))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['Only channel members can send messages'],
					| ['You are muted in this channel']
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['Channel not found']
		}
		```

### **Get channel messages**

Retrieve 200 message before the date passed.

#### Input
```typescript
message: `channels_messages`
payload: {
	id: number, // the channel id
	before: string, // ISO date
}
```

### Example
To retrieve the last 200 messages.
```typescript
socket.emit('channels_messages', {
	id: 1,
	before: new Date().toISOString(),
},
	(data) => {
		console.log(data); // The messages array
	}
);
```

#### Return
- An array of ChannelMessage object ([ChannelMessage[]](#channelmessage))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 403,
		error: 'Forbidden',
		messages: ['Only channel members can read messages'],
	}
	```
- ```typescript
	{
		statusCode: 404,
		error: 'Not found',
		messages: ['Channel not found']
	}
	```

## Users

### **Get user**

#### Input
```typescript
message: `users_get`
payload: {
	id: number // User id
}
```

#### Return
- The user object ([User](#user))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```

### **Update user**

#### Input
```typescript
message: `users_update`
payload: {
	id: number, // User id
	username: string, // Optionnal new username
	displayName: string, // Optionnal new username
}
```

#### Return
- The updated user object ([User](#user))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You can only update your own user'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

### **Invite as friend**

#### Input
```typescript
message: `users_inviteFriend`
payload: {
	username: string, // Username of the friend to invite
}
```

#### Return
- The new friendship object ([UserFriend](#userfriend))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You have been banned'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```
	+ ```typescript
		{
			statusCode: 409,
			error: 'Conflict',
			messages: ['There is already a pending invitation']
						| ["You can't invite yourself"],
						| ["You are already friends"]
		}
		```

### **Accept friendship request**

#### Input
```typescript
message: `users_acceptFriend`
payload: {
	id: number, // Id of the user how invited the client
}
```

#### Return
- The updated friendship object ([UserFriend](#userfriend))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 409,
			error: 'Conflict',
			messages: ['Friendship already accepted'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

### **Remove friend (or decline friendship request)**

#### Input
```typescript
message: `users_removeFriend`
payload: {
	id: number, // Id of the user how invited the client
}
```

#### Return
- The deleted friendship object ([UserFriend](#userfriend))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 409,
			error: 'Conflict',
			messages: ['Friendship not found'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

### **Ban user**

#### Input
```typescript
message: `users_ban`
payload: {
	id: number, // Id of the user to ban
	until: string, // ISO Date of the un-ban
}
```

#### Return
- The new user banned object ([BannedUser](#banneduser))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

### **Mute user**

#### Input
```typescript
message: `users_mute`
payload: {
	id: number, // Id of the user to ban
	until: string, // ISO Date of the un-ban
}
```

#### Return
- The new user muted object ([MutedUser](#muteduser))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

### **Send a message**

#### Input
```typescript
message: `users_sendMessage`
payload: {
	id: number, // Id of a friend
	until: string, // Message to send
}
```

#### Return
- The new message object ([UserMessage](#usermessage))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You can only send messages to friends'],
					| ['You are muted by this user']
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

### **Get messages**

#### Input
```typescript
message: `users_getMessages`
payload: {
	id: number, // Id of a friend
	before: string, // ISO date
}
```

#### Return
- An array of messages object ([UserMessage[]](#usermessage))
- A [WSResponse](#wsresponse)
	+ ```typescript
		{
			statusCode: 400,
			error: 'Bad request',
			messages: string[] // describing malformed payload
		}
		```
	+ ```typescript
		{
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You can only get messages from friends'],
		}
		```
	+ ```typescript
		{
			statusCode: 404,
			error: 'Not found',
			messages: ['User not found'],
		}
		```

## Games

### **Create a game**

#### Input
```typescript
message: `games_create`
payload: {
	maxDuration: 1 | 2 | 3;
	maxScore: 5 | 10 | 30 | null;
	mode: 'classic' | 'hardcore';
	visibility: 'public' | 'private';
}
```

#### Return
- The new game object ([LocalGameInfo](#localgameinfo))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```

### **Join a game**

#### Input
```typescript
message: `games_join`
payload: {
	id: string, // Local game id
}
```

#### Return
- The game object ([LocalGameInfo](#localgameinfo))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['Game not found'],
	}
	```
- ```typescript
	{
		statusCode: 403,
		error: 'Forbidden',
		messages: ['User not invited'],
	}
	```
- ```typescript
	{
		statusCode: 409,
		error: 'Conflict',
		messages: ['User is already in the game'],
	}
	```

### **Quit a game**

#### Input
```typescript
message: `games_quit`
payload: {
	id: string, // Game ID
}
```

#### Return
- The game object ([LocalGameInfo](#localgameinfo))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		error: 'Not Found',
		messages: ['Game not found'] |
					['Player not found'],
	}
	```

### **Join matchmaking**

#### Input
```typescript
message: `games_joinMatchmaking`
payload: empty
```

#### Return
- `true` when you joined matchmaking

### **Invite a player in a game**

#### Input
```typescript
message: `games_invite`
payload: {
	id: string, // Local game id
	user_id: number, // ID of user to invite
}
```

#### Return
- The user invited ([User](#user))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['Game not found'] |
					['User not found'],
	}
	```
- ```typescript
	{
		statusCode: 403,
		error: 'Forbidden',
		messages: ['Only the creator can invite'] |
					['Game is already full'] |
					['User is offline'], |
					['Game is not private']
	}
	```
- ```typescript
	{
		statusCode: 409,
		error: 'Conflict',
		messages: ['User is already in the game']
				| ['You cannot invite yourself']
				| ['User is already invited']
	}
	```

### **Send new player position**

#### Input
```typescript
message: `games_playerMove`
payload: {
	id: string, // Local game id
	y: number, // The new Y position
}
```

#### Return
- A `null` response (means everything is alright)
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['Game not found'] |
					['Player not found'],
	}
	```

### **Get player games history**

#### Input
```typescript
message: `games_history`
payload: {
	id: number, // User id
}
```

#### Return
- A game array ([Game[]](#game))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['User not found'],
	}
	```

### **Get player statistics**

#### Input
```typescript
message: `games_userStats`
payload: {
	id: number, // User id
}
```

#### Return
- A user stats object ([StatsUser](#statsuser))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['User not found'],
	}
	```

### **Get leaderboards**

#### Input
```typescript
message: `games_leaderboards`
payload: empty
```

#### Return
- A leaderboards object ([Leaderboards](#leaderboards))

### **Start watching a game**

#### Input
```typescript
message: `games_startWatching`
payload: {
	id: string, // Game id, optionnal if you provide a user_id
	user_id: number, // User id, optionnal if you provide a game id
}
```

#### Return
- The local game info object ([LocalGameInfo](#localgameinfo))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['Game not found'],
	}
	```

### **Stop watching a game**

#### Input
```typescript
message: `games_stopWatching`
payload: {
	id: string, // Game id, optionnal if you provide a user_id
	user_id: number, // User id, optionnal if you provide a game id
}
```

#### Return
- The local game info object ([LocalGameInfo](#localgameinfo))
- ```typescript
	{
		statusCode: 400,
		error: 'Bad request',
		messages: string[] // describing malformed payload
	}
	```
- ```typescript
	{
		statusCode: 404,
		message: 'Not Found',
		messages: ['Game not found'],
	}
	```

# Websocket Events

## Users

### **New private message**

- Event name: `users_message`
- Data type: [UserMessage](#usermessage)

### **On profile update**

When a user related to you update his profile (a friend or someone who is in one of the channels you joined)

- Event name: `users_update`
- Data type: [User](#user)

### **On friendship invitation**

- Event name: `users_friendshipInvitation`
- Data type: [UserFriend](#userfriend)

### **On friendship acceptation**

- Event name: `users_friendshipAccepted`
- Data type: [UserFriend](#userfriend)

### **On friendship deletion**

When someone remove your friendship or decline your invitation

- Event name: `users_friendshipRemoved`
- Data type: [UserFriend](#userfriend)

### **On ban**

When someone ban you from his friends.

- Event name: `users_banned`
- Data type: [BannedUser](#banneduser)

### **On mute**

- Event name: `users_muted`
- Data type: [MutedUser](#muteduser)

## Channels

### **New channel message**

- Event name: `channels_message`
- Data type: [ChannelMessage](#channelmessage)

### **On channel update**

- Event name: `channels_update`
- Data type: [Channel](#channel)

### **On member join**

When a new member join the channel

- Event name: `channels_join`
- Data type: [Channel](#channel)

### **On member leave**

When a member leave the channel

- Event name: `channels_leave`
- Data type: [Channel](#channel)

### **On admin added**

When a member is promoted admin

- Event name: `channels_addAdmin`
- Data type: [Channel](#channel)

### **On admin removed**

When a member is downgraded

- Event name: `channels_removeAdmin`
- Data type: [Channel](#channel)

### **On member ban**

When a member is banned

- Event name: `channels_banUser`
- Data type: [ChannelBannedUser](#channelbanneduser)

### **On member mute**

When a member is muted

- Event name: `channels_muteUser`
- Data type: [ChannelMutedUser](#channelmuteduser)

### **On channel invitation**

When you receive an invitation to join a channel

- Event name: `channels_inviteUser`
- Data type: [ChannelInvitedUser](#channelinviteduser)

#### Example

```typescript
socket.on('channels_message', (data: any) => {
	console.log(`New message from ${data.user.username} in ${data.channel.name}: ${data.message}`)
});
```

## Games

### **Game start**

Send game information 3 seconds before the start of the game.

- Event name: `games_start`
- Data type: [LocalGameInfo](#localgameinfo)

### **Invitation to a game**

- Event name: `games_invitation`
- Data type: [LocalGameInfo](#localgameinfo)

### **Game end**

- Event name: `games_end`
- Data type:
	```typescript
		{
			winner: {
				user: User,
				score: number,
			},
			score: number,
			opponent_score: number,
		}
	```

### **New opponent position**

- Event name: `games_opponentMove`
- Data type:
	```typescript
		{ y: number }
	```

### **New score (after a goal)**

- Event name: `games_score`
- Data type:
	```typescript
		you: number, // your score
		opponent: number, // opponent score
	```

### **On play invitation**

- Event name: `games_invitation`
- Data type:
	```typescript
		game: LocalGameInfo,
		inviter: User,
	```

### **New ball position**

- Event name: `games_ballMove`
- Data type:
	```typescript
		x: number,
		y: number
	```

### **Watch - New creator position**

- Event name: `games_watch_creatorMove`
- Data type:
	```typescript
		{ y: number }
	```

### **Watch - New opponent position**

- Event name: `games_watch_opponentMove`
- Data type:
	```typescript
		{ y: number }
	```

### **Watch - New ball position**

- Event name: `games_watch_ballMove`
- Data type:
	```typescript
		x: number,
		y: number
	```

### **Watch - New score (after a goal)**

- Event name: `games_watch_score`
- Data type:
	```typescript
		creator: number, // creator score
		opponent: number, // opponent score
	```

### **Watch - Game end**

- Event name: `games_watch_end`
- Data type:
	```typescript
		{
			winner: {
				user: User,
				score: number,
			},
			creator_score: number,
			opponent_score: number,
		}
	```

# Objects

## WSResponse

```typescript
{
	statusCode: number, // HTTP status code
	error: string, // Relatded HTTP message
	messages: string[], // array of string describing the problem
}
```

## User

```typescript
{
	id: number,
	id42: number, // null for non-42 users
	username: string,
	displayName: string,
	status: 'online' | 'offline' | 'playing',
	elo: number,
	firstConnection: boolean,
	invitedFriends: UserFriends[],
	friendOf: UserFriend[],
	friends: User[],
	profile_picture: string,
}
```

## UserFriend

```typescript
{
	inviterId: number,
	inviter: User,

	inviteeId: number,
	invitee: User,

	accepted: boolean
}
```

## BannedUser

```typescript
{
	userId: number,
	user: User,

	bannedId: number,
	banned: User,

	until: Date
}
```

## MutedUser

```typescript
{
	userId: number,
	user: User,

	mutedId: number,
	muted: User,

	until: Date
}
```

## UserMessage

```typescript
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

```typescript
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
```typescript
{
	userId: number,
	user: User,

	channelId: number,
	channel: Channel,

	until: Date,
}
```

## ChannelMutedUser
```typescript
{
	userId: number,
	user: User,

	channelId: number,
	channel: Channel,

	until: Date,
}
```

## ChannelInvitedUser
```typescript
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
```typescript
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

## Game
```typescript
{
	id: number,
	visibility: 'public' | 'private',
	mode: 'classic' | 'hardcore',
	maxDuration: 1 | 2 | 3;
	maxScore: 5 | 10 | 30 | null,

	winner: User,
	winnerScore: number,

	loser: User,
	loserScore: number,
}
```

## LocalGameInfo
```typescript
{
	id: string,
	state: "waiting" | "started" | "ended" | "saved",
	startAt: number | null,
	players: Array<{
		user: User,
		score: number,
	}>,
	paddleHeight: number,
}
```

## StatsUser
```typescript
{
	user: User,
	stats: {
		games: number,
		wins: number,
		losses: number,
		winrate: number,
	},
}
```

## Leaderboards
```typescript
{
	elo: User[],
	mostPlayed: StatsUser[],
}
```
