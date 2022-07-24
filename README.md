# Minecraft-Discord-Chat-Bridge

Minecraft-Discord-Chat-Bridge is an application that sends the following things to the configured Discord channel.

Advancement, goal and challenge announcements, Chat messages, Death messages.

The following things are sent to minecraft chat from the configured Discord channel.

Chat messages, Links, Role mentions, Member mentions, Channel mentions

Channel mentions and links are clickable in the minecraft chat, When hovering over name in square brackets the user's username and discriminator and ID will be shown

# How to setup Minecraft-Discord-Chat-Bridge

## Requirements

- [Git](https://git-scm.com/downloads)
- [NodeJS 16 or higher](https://nodejs.org/en/download/)
- [Minecraft 1.19 server or later](https://www.minecraft.net/en-us/download/server)

The minecraft server must have RCON enabled for this application to work, it uses RCON to send the discord chat messages to minecraft chat.

## Install git

[Download and install git for your OS](https://git-scm.com/download)

## Instal Minecraft-Discord-Chat-Bridge

- HTTPS

  ```
  git clone -b master https://github.com/VampireChicken12/Minecraft-Discord-Chat-Bridge.git
  ```

- SSH
  ```
  git clone -b master git@github.com:VampireChicken12/Minecraft-Discord-Chat-Bridge.git
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
     ![Filling token variable](https://img.hikari-bot.com/y0OVSPrKg.png)

### Filling in environment variables

1. Type a prefix into the `.env` as the value of `PREFIX` property
   ![Filling prefix variable](https://img.hikari-bot.com/4PwHtQvhm.png)
2. Put the command you use to listen to server logs in the `.env` as the value of `START_COMMAND` property. On windows I use PowerShell's Get-Content command to listen to the output of the latest.log file from the minecraft server logs directory. On linux you can use tail to do the same thing.
   ![Filling start command variable](https://img.hikari-bot.com/Jr5bkueM3.png)
3. Paste the channel ID into the `.env` as the value of `GAME_CHAT_CHANNEL` property
   ![Filling game chat channel variable](https://img.hikari-bot.com/zadle6LrU.png)
4. Update the value of the `RCON_PASSWORD` property to the actual RCON password from the server.properties file from the minecraft server folder.
   ![Filling rcon password variable](https://img.hikari-bot.com/HLMXU1t9C.png)
5. Select from the following options what matches your server and put it as the value of `SERVER_TYPE` property.
   - `vanilla`, `spigot`, `paper`, `purpur`
     ![Filling server type variable](https://img.hikari-bot.com/EjsNaCyoH.png)

## Start Minecraft-Discord-Chat-Bridge

1. Install dependencies

   ```
   npm i
   ```

2. Build the application

   ```
   npm run build
   ```

3. Start the application
   ```
   npm run start
   ```

## Updating Minecraft-Discord-Chat-Bridge

Open the applications folder in a terminal make sure you stopped the application if it is still running.

1. Download the latest version
   ```
   git pull
   ```
2. Update dependencies

   ```
   npm i
   ```

3. Rebuild the application

   ```
   npm run build
   ```

4. Start the application
   ```
   npm run start
   ```

## Examples

Member role color effects the color of the mention
![Example 1](https://user-images.githubusercontent.com/45531575/180667735-379c6efb-7de6-4858-bb9a-c426ada54570.png)
Demo of link clickablity
![Example 2](https://user-images.githubusercontent.com/45531575/180667874-336da769-de6f-4f63-a455-12cb3da1ca3e.png)
![Example 3](https://user-images.githubusercontent.com/45531575/180667878-aeed6f4c-5ed7-4abf-a3c8-b8c76a4987f8.png)
Demo of channel mention clickablity
![Example 4](https://user-images.githubusercontent.com/45531575/180667715-472d91e0-d9d5-4b03-9b5d-9ce802408580.png)
Discord chat name hover demo
![Example 5](https://user-images.githubusercontent.com/45531575/180667890-daa4c061-efd9-4512-ba43-2897563515d1.png)
Nickname support demo
![Example 6](https://user-images.githubusercontent.com/45531575/180667902-58eedf42-47ac-4995-afaa-96fefd65f274.png)
![Example 7](https://user-images.githubusercontent.com/45531575/180667905-a188ec8e-97d3-4c8c-8f8e-f4c45abef021.png)
