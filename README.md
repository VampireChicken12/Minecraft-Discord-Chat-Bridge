# Minecraft-Chat-Bridge
Minecraft-Chat-Bridge is an application that sends the following things to the configured Discord channel.

Advancement, goal and challenge announcements, Chat messages, Death messages.

The following things are sent to minecraft chat from the configured Discord channel.

Links, Role mentions, Member mentions, Channel mentions

Channel mentions and links are clickable in the minecraft chat, When hovering over name in square brackets the user's username and discriminator and ID will be shown
## Requirements
- [Git](https://git-scm.com/downloads)
- [NodeJS 16 or higher](https://nodejs.org/en/download/)
- [Minecraft 1.19 server or later](https://www.minecraft.net/en-us/download/server)

The minecraft server must have RCON enabled for this application to work, it uses RCON to send the discord chat messages to minecraft chat.

## Create a .env file

Create a .env file from the .env-sample file:

```
cp .env-sample .env
```
Open `.env` with a text editor and fill out `TOKEN`, `PREFIX`, `STARTCOMMAND`, `RCON_HOST`, `RCON_PASSWORD`

Remember that this file can't be hot-reloaded if you modify a value in the `.env` you must restart the application to apply changes

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
