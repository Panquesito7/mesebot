const Discord = require("discord.js");
const client = new Discord.Client();

const levels = require("./levels.js");
const config = require("./config.json");

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}.`);
});

// Register commands as object for easy aliasing
const commands = new (function() {
    this.rank = (message, params) => {
        if (!params[0]) { // Self info
            message.channel.send(levels.getInfo(message.author))
        } else if (message.mentions.users.size > 0) { // Mentioned user
            message.channel.send(levels.getInfo(message.mentions.users.first()));
        } else { // Named user
            const members = message.channel.guild.members;

            // Find by nick or username
            members.fetch({query: params[0], limit: 1}).then(member => {
                if (member.first()) {
                    message.channel.send(levels.getInfo(member.first().user));
                    return;
                }

                // Find by UUID
                if (params[0].match(/\d{18}/)) {
                    members.fetch(params[0]).then(member => {
                        if (member) {
                            message.channel.send(levels.getInfo(member.user));
                        }
                    });
                    return;
                }

                message.channel.send(`Could not find user \"${params[0]}\".`);
            });
        }
    }
    this.level = this.rank;

    this.levels = (message) => {
        message.channel.send(levels.getTop());
    }
    this.top = this.levels;

    this.help = (message) => {
        let c;
        message.channel.send({
            "embed": {
                "color": config.color,
                "thumbnail": {
                    "url": client.user.avatarURL(),
                },
                "title": "MeseBot Info",
                "description": `Minetest-themed levelling bot.\nPrefix: \`${config.prefix}\``,
                "fields": [
                    {
                        "name": "Commands",
                        "value": Object.entries(commands).map(e => {const s = `${c && e[1] == c ? `, ` : "\n"}\`${e[0]}\``; c = e[1]; return s;}).join("").slice(1),
                        "inline": true
                    },
                    {
                        "name": "Rank Rewards",
                        "value": (config.role_rewards || []).sort((a, b) => a[0] - b[0]).map(e => `${e[0]}: <@&${e[1]}>`).join("\n"),
                        "inline": true
                    },
                    {
                        "name": "Source",
                        "value": "https://github.com/MinetestBots/mesebot"
                    }
                ]
            }
        });
    }
    this.info = this.help;
});

client.on("message", message => {
    if (message.author.bot)	return;

    // Do user updating
    if (!message.content.startsWith(config.prefix)) {
        levels.newMessage(message);
        return;
    }

    // Check for command
    const params = message.content.slice(config.prefix.length).split(" ");
    const command = params.shift().toLowerCase();
    if (commands[command]) commands[command](message, params);
});

client.login(config.token);
