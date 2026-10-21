require('./src/loadConfig');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadDBToCache } = require('./src/mainbot/database/db');

process.on('unhandledRejection', (reason) => {
    console.error('[Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Process] Uncaught Exception:', error);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
client.commands = new Collection();

const eventsPath = path.join(__dirname, 'src/mainbot/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const commandsPath = path.join(__dirname, 'src/mainbot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commandsArray = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
    }
}

loadDBToCache().then(() => {
    client.login(process.env.DISCORD_TOKEN).then(async () => {
        console.log(`[Bot] Đã đăng nhập: ${client.user.tag}`);
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commandsArray }
            );
            console.log(`[Bot] Đã đăng ký ${commandsArray.length} slash commands`);
        } catch (error) {
            console.error('[Bot] Lỗi khi đăng ký slash commands:', error.message);
        }
    }).catch(err => {
        console.error('[Bot] Không thể đăng nhập. Vui lòng kiểm tra DISCORD_TOKEN:', err.message);
    });
}).catch(err => {
    console.error('[Database] Lỗi khởi tạo cache:', err.message);
});
