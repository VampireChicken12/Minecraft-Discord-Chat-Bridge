# Minecraft-Chat-Bridge

Minecraft-Chat-Bridge is an application that sends the following things to the configured Discord channel.

Advancement, goal and challenge announcements, Chat messages, Death messages.

The following things are sent to minecraft chat from the configured Discord channel.

Links, Role mentions, Member mentions, Channel mentions

Channel mentions and links are clickable in the minecraft chat, When hovering over name in square brackets the user's username and discriminator and ID will be shown

# How to setup Minecraft-Chat-Bridge

## Requirements

- [Git](https://git-scm.com/downloads)
- [NodeJS 16 or higher](https://nodejs.org/en/download/)
- [Minecraft 1.19 server or later](https://www.minecraft.net/en-us/download/server)

The minecraft server must have RCON enabled for this application to work, it uses RCON to send the discord chat messages to minecraft chat.

## Install git

[Download and install git for your OS](https://git-scm.com/download)

## Instal Minecraft-Chat-Bridge

HTTPS

```
git clone -b master https://github.com/VampireChicken12/Minecraft-Chat-Bridge.git
```

SSH

```
git clone -b master git@github.com:VampireChicken12/Minecraft-Chat-Bridge.git
```

### Create `.env` file

> **⚠ WARNING**  
> You may have to enable hidden file visibility in file explorer if you are on windows.

- Create a .env file from the .env-sample file:

```
   cp .env-sample .env
```

Remember that this file can't be hot-reloaded if you modify a value in the `.env` you must restart the application to apply changes

### Creating a bot account

1. Go to [Discord Developer Portal](https://discord.com/developers/applications/) and click "New Application", type a name and click the "Create" button
   ![Creating an application](https://img.hikari-bot.com/3VyEBBGaA.png)
2. Go to the bot tab and click "Add bot" button and confirm by clicking "Yes, do it!", Ignore this step if you already have a bot on the application.
   ![Creating a bot account](https://img.hikari-bot.com/yhgkcwIZW.png)
3. Click the "Reset Token" button and confirm by clicking "Yes, do it!", Ignore this step if you already have your bot token.

   - You maybe prompted to input a 2FA code when clicking "Yes, do it!" input your 2FA code then click the "Submit" button.
     ![Resetting bot token](https://img.hikari-bot.com/FEhtMyysc.png)
   - Enable message content intent then click "Copy" button **⚠ WARNING** You may only copy the token once. then click "Save Changes" button ![Coyping token](https://img.hikari-bot.com/sPYLfYEbD.png)

4. Paste the token into the `.env` as the value of `TOKEN` property
   - The token shown here is invalid. Do not post your token publicly.
     ![Filling token variable](https://img.hikari-bot.com/jZu8UmZwn.png)

### Filling in environment variables

1. Type a prefix into the `.env` as the value of `PREFIX` property
   ![Filling prefix variable](https://img.hikari-bot.com/3OFJtciXs.png)
2. Put the command you use to listen to server logs in the `.env` as the value of `START_COMMAND` property. On windows I use PowerShell's Get-Content command to listen to the output of the latest.log file from the minecraft server logs directory. On linux you can use tail to do the same thing.
   ![Filling start command variable](https://img.hikari-bot.com/NP0drmbm6.png)
3. Paste the channel ID into the `.env` as the value of `GAME_CHAT_CHANNEL` property
   ![Filling game chat channel variable](https://img.hikari-bot.com/n0Fa1rCVP.png)
4. Update the value of the `RCON_PASSWORD` property to the actual RCON password from the server.properties file from the minecraft server folder.
   ![Filling rcon password variable](https://img.hikari-bot.com/RnZvPN80C.png)
5. Select the server type that matches your server and put it as the value of `SERVER_TYPE` property.
   ![Filling server type variable](https://img.hikari-bot.com/MYokZrws4.png)

## Start Minecraft-Chat-Bridge

Install dependencies

```
npm i
```

Build

```
npm run build
```

Start

```
npm run start
```

## Updating Minecraft-Chat-Bridge

Open the applications folder in a terminal make sure you stopped the application if it is still running.

Download the latest version

```
git pull
```

Update dependencies

```
npm i
```

Rebuild the application

```
npm run build
```

Start the application

```
npm run start
```

## Examples

Member role color effects the color of the mention
[![Example 1](https://img.hikari-bot.com/FjDwqCXrc.png)](https://img.hikari-bot.com/FjDwqCXrc.png)
Demo of link clickablity
[![Example 2](https://img.hikari-bot.com/G8bzIhVuJ.png)](https://img.hikari-bot.com/G8bzIhVuJ.png)
[![Example 3](https://img.hikari-bot.com/DfCLYv1QA.png)](https://img.hikari-bot.com/DfCLYv1QA.png)
Demo of channel mention clickablity
[![Example 4](https://img.hikari-bot.com/kkcKGZhXB.png)](https://img.hikari-bot.com/kkcKGZhXB.png)
Discord chat name hover demo
[![Example 5](https://img.hikari-bot.com/Yw35SUARi.png)](https://img.hikari-bot.com/Yw35SUARi.png)
Nickname support demo
[![Example 6](https://img.hikari-bot.com/kWb5Dr8tz.png)](https://img.hikari-bot.com/kWb5Dr8tz.png)
[![Example 7](https://img.hikari-bot.com/c2VjtWRxA.png)](https://img.hikari-bot.com/c2VjtWRxA.png)
