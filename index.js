//    ██████████████████      ██████████        ██              ██    ██████████████████    ██████████     ███      ██ 
//            ██            ██          ██      ████          ████            ██            ██             ████     ██ 
//            ██            ██          ██      ██  ██      ██  ██            ██            ██             ██ ██    ██ 
//            ██            ██          ██      ██    ██  ██    ██            ██            ███████        ██  ██   ██ 
//            ██            ██          ██      ██      ██      ██            ██            ██             ██   ██  ██ 
//            ██            ██          ██      ██              ██            ██            ██             ██    ██ ██ 
//            ██              ██████████        ██              ██            ██            ██████████     ██     ████ 

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2');
const { token,  welcomeChannelId,  logChannelId, databaseConfig, clientId, guildId, requiredRoleId, allowedRoles, products, ratings, recensionChannelId, messageLogsChannelId, antilinkChannelId, punktroll, memberCountChannelId, kunderCountChannelId, botCountChannelId, goalCountChannelId } = require('./config.json');
const moment = require('moment-timezone');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

const db = mysql.createPool({ // Database stuff. You change it in the config.json file. 
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database
});

db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Database connected! Test query result:', results[0].solution);
    }
});

let logChannel, messageLogsChannel, antilinkChannel;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) {
        console.error('Log channel not found. Check if your channel ID is correct in config.json.');
    }

    messageLogsChannel = client.channels.cache.get(messageLogsChannelId);
    if (!messageLogsChannel) {
        console.error('Message log channel not found. Check if your channel ID is correct in config.json.');
    }

    antilinkChannel = client.channels.cache.get(antilinkChannelId);
    if (!antilinkChannel) {
        console.error('Antilink channel not found! Check if your channel ID is correct in config.json.');
    }

    updateVoiceChannels();
});

const updateVoiceChannels = async () => {
    console.time('updateVoiceChannels'); 

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error('Guild not found! Check if your guild ID is correct in config.json.');
            return;
        }

        await guild.members.fetch(); 

        const totalMembers = guild.memberCount;
        const customerCount = guild.members.cache.filter(member =>
            member.roles.cache.has(requiredRoleId) && !member.user.bot
        ).size;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;

        console.log(`Total members: ${totalMembers}`);
        console.log(`Customer count: ${customerCount}`);
        console.log(`Bot count: ${botCount}`);

        const memberChannel = guild.channels.cache.get(memberCountChannelId);
        if (memberChannel) {
            await memberChannel.setName(`🐳Members: ${totalMembers}`); // Change to what your member channel style is. Note this is the stats for member counts.
            console.log('Member count channel updated successfully');
        } else {
            console.error('Member count channel not found');
        }

        const customerChannel = guild.channels.cache.get(kunderCountChannelId);
        if (customerChannel) {
            await customerChannel.setName(`⭐Customers: ${customerCount}`); // Change to what your Customer channel style is. Note this is the stats for member counts.
            console.log('Customer count channel updated successfully');
        } else {
            console.error('Customer count channel not found');
        }

        const botChannel = guild.channels.cache.get(botCountChannelId);
        if (botChannel) {
            await botChannel.setName(`🤖Bots: ${botCount}`); // Change to what your Bots channel style is. Note this is the stats for member counts.
            console.log('Bot count channel updated successfully');
        } else {
            console.error('Bot count channel not found');
        }

        const [rows] = await db.promise().query('SELECT member_goal FROM server_goals ORDER BY id DESC LIMIT 1');
        const currentGoal = rows.length > 0 ? rows[0].member_goal : 'No goal';

        const goalChannel = guild.channels.cache.get(goalCountChannelId);
        if (goalChannel) {
            await goalChannel.setName(`🌟Goal: ${currentGoal}`); // Goal channel style.
            console.log('Goal channel updated successfully');
        } else {
            console.error('Goal channel not found');
        }

        const [result] = await db.promise().query('INSERT INTO member_counts (total_members, customer_count, bot_count) VALUES (?, ?, ?)', 
            [totalMembers, customerCount, botCount]
        );
        console.log(`Database updated: ${result.affectedRows} rows affected`);
        console.log('Voice channels updated successfully');

    } catch (error) {
        console.error('Error updating voice channels:', error.message);
    }

    console.timeEnd('updateVoiceChannels'); 
};

const updateMemberCounts = async () => {
    console.time('updateMemberCounts'); 

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        await guild.members.fetch(); 
        const totalMembers = guild.memberCount;
        const customerCount = guild.members.cache.filter(member =>
            member.roles.cache.has(requiredRoleId) && !member.user.bot
        ).size;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;

        console.log('Updating member counts in database');
        await db.promise().query('INSERT INTO member_counts (total_members, customer_count, bot_count) VALUES (?, ?, ?)', 
            [totalMembers, customerCount, botCount]
        );
        console.log('Member count updated successfully');
    } catch (error) {
        console.error('Error updating member count:', error);
    }
    console.timeEnd('updateMemberCounts');
};

client.on('guildMemberAdd', async (member) => {
    console.log(`Member joined: ${member.user.tag}`);
    await updateMemberCounts();
    await updateVoiceChannels();

    const welcomeChannel = client.channels.cache.get(welcomeChannelId);
    if (welcomeChannel) {
        welcomeChannel.send(`Welcome to the server, ${member}!`);
    }

    const userId = member.id;

    db.query('SELECT roles FROM User_roles WHERE user_id = ?', [userId], async (err, results) => {
        if (err) {
            console.error('Error fetching user roles:', err.message);
        } else if (results.length > 0) {
            const roleIds = results[0].roles.split(',').map(roleId => roleId.trim());
            try {
                const roles = roleIds.map(roleId => member.guild.roles.cache.get(roleId)).filter(role => role);
                await member.roles.add(roles);
                console.log(`Restored roles for user ${member.user.tag}`);
            } catch (roleError) {
                console.error('Error restoring roles:', roleError.message);
            }
        } else {
            console.log(`No previous roles found for user ${member.user.tag}`);
        }
    });

    logToChannel(`User <@${member.id}> has joined the server.`);
});

client.on('guildMemberRemove', async (member) => {
    console.log(`Member left: ${member.user.tag}`);
    await updateMemberCounts();
    await updateVoiceChannels();

    logToChannel(`User <@${member.id}> has left the server.`);

    const userId = member.id;
    const roleIds = member.roles.cache
        .filter(role => role.id !== member.guild.id)
        .map(role => role.id)
        .join(',');

    const username = member.user.username;

    db.query('SELECT * FROM User_roles WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error checking user in database:', err.message);
        } else if (results.length > 0) {
            db.query('UPDATE User_roles SET roles = ?, username = ? WHERE user_id = ?', [roleIds, username, userId], (err) => {
                if (err) {
                    console.error('Error updating user roles in database:', err.message);
                } else {
                    console.log(`Updated roles for user ${member.user.tag}`);
                }
            });
        } else {
            db.query('INSERT INTO User_roles (user_id, roles, username) VALUES (?, ?, ?)', [userId, roleIds, username], (err) => {
                if (err) {
                    console.error('Error inserting user roles into database:', err.message);
                } else {
                    console.log(`Stored roles for user ${member.user.tag}`);
                }
            });
        }
    });
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        console.log(`Roles updated for member: ${newMember.user.tag}`);
        await updateVoiceChannels();  
    }
});

client.on('guildCreate', () => updateVoiceChannels());  

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.attachments.size > 0 || message.content.length === 0) return;

    const userId = message.author.id;
    const username = message.author.tag;
    const messageContent = message.content;

    if (messageLogsChannel) {
        const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setColor('#5ad6c1')
        .addFields(
            { name: 'User', value: `<@${message.author.id}>`, inline: true },
            { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
            { name: 'Message', value: message.content || 'No content', inline: false }
        )
        .setTimestamp();
        try {
            await messageLogsChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending message to messageLogsChannel:', error.message);
        }
    }

    const member = message.guild.members.cache.get(userId);
    if (member && member.roles.cache.some(role => punktroll.includes(role.id))) {
        return;
    }

    db.query('INSERT INTO messages (user_id, username, message) VALUES (?, ?, ?)', 
        [userId, username, messageContent], 
        (err) => {
            if (err) {
                console.error('Error storing message:', err.message);
            } else {
                console.log('Message stored successfully');
            }
        }
    );
});

const linkRegex = /(https?:\/\/[^\s]+)/g; // Antilink for links with https://
const discordInviteRegex = /^discord\.gg\/[^\s]+/; // Antilink for discord links without https://. Example: discord.gg/

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const member = message.guild.members.cache.get(message.author.id);
    if (member && member.roles.cache.some(role => punktroll.includes(role.id))) {
        return;
    }
    if (linkRegex.test(message.content) || discordInviteRegex.test(message.content)) {
        await message.delete();

        if (antilinkChannel) {
            const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(`**Content:** ${message.content || 'No content'}`)
            .setColor('#5ad6c1')
            .addFields(
                { name: 'User', value: `<@${message.author.id}>`, inline: true },
                { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                { name: 'Action', value: 'Message deleted due to link', inline: false }
            )
            .setTimestamp();

            try {
                await antilinkChannel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Error sending message to antilink channel:', error.message);
            }
        }

        db.query('INSERT INTO link_logs (user_id, username, message_content, channel_id, timestamp) VALUES (?, ?, ?, ?, ?)', 
            [message.author.id, message.author.tag, message.content, message.channel.id, new Date()], (err) => {
                if (err) {
                    console.error('Error logging link to database:', err.message);
                }
            });

        try {
            const dmChannel = await message.author.createDM();
            const dmEmbed = new EmbedBuilder()
                .setTitle('Link Detected')
                .setDescription(`Hello <@${message.author.id}>, you have sent a link in <#${message.channel.id}>. This is strictly forbidden, and a warning has been added to your account. To view your warnings, type /warnings. If you believe this is an error, you can contact RiktigaTomten to remove your warning.`)
                .setColor('#5ad6c1')
                .setTimestamp();

            await dmChannel.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Error sending DM:', error.message);
        }

        db.query('INSERT INTO warnings (user_id, warning_type, date_time) VALUES (?, ?, ?)', [message.author.id, 'link', new Date()], (err) => {
            if (err) {
                console.error('Error adding warning:', err.message);
            }
        });

        db.query('SELECT COUNT(*) AS warning_count FROM warnings WHERE user_id = ?', [message.author.id], (err, results) => {
            if (err) {
                console.error('Error checking warnings:', err.message);
                return;
            }
            if (results[0].warning_count >= 3) {
                const member = message.guild.members.cache.get(message.author.id);
                if (member) {
                    member.ban({ reason: '3 warnings received' }).catch(console.error);
                }
            }
        });
    }
});

function logToChannel(message) {
    if (logChannel) {
        logChannel.send(message).catch(error => console.error('Error sending message to log channel:', error));
    }
    console.log(message);
}

function convertUTCToStockholm(utcDate) {
    const date = new Date(utcDate);
    const options = {
        timeZone: 'Europe/Stockholm', // Set your time zone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // set your clock. If you don't have a clock that goes to 13:00 14:00 ect don't enable.
    };
    const formatter = new Intl.DateTimeFormat('sv-SE', options);
    return formatter.format(date);
}

const commands = [
    new SlashCommandBuilder()
        .setName('wipe') // command name. If you want to change don't forget to change it in interactionCreate too.
        .setDescription('Removes all messages in the channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(0)  
        .setDMPermission(false),
    new SlashCommandBuilder()
        .setName('review') // command name. If you want to change don't forget to change it in interactionCreate too.
        .setDescription('Write a review.')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Choose a product.')
                .setRequired(true)
                .addChoices(...products.map(product => ({ name: product, value: product })))
        )
        .addStringOption(option =>
            option.setName('rating')
                .setDescription('Choose a rating.')
                .setRequired(true)
                .addChoices(
                    { name: '1 ⭐', value: '1' },
                    { name: '2 ⭐⭐', value: '2' },
                    { name: '3 ⭐⭐⭐', value: '3' },
                    { name: '4 ⭐⭐⭐⭐', value: '4' },
                    { name: '5 ⭐⭐⭐⭐⭐', value: '5' }
                )
        )
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Optional comment.')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('warnings') // command name. If you want to change don't forget to change it in interactionCreate too.
        .setDescription('Show your warnings.')
        .setDMPermission(true), 
    new SlashCommandBuilder()
        .setName('goal') // command name. If you want to change don't forget to change it in interactionCreate too.
        .setDescription('Set a new goal for the number of members.')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('The new member goal')
                .setRequired(true)
        )
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Starting to update commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log('Commands have been registered.');
    } catch (error) {
        console.error(error);
    }
})();

let commandTimeouts = new Map();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, member } = interaction;

    if (commandName === 'warnings') { // command name. If you want to change don't forget to change it in SlashCommandBuilder too.
        const userId = member.id;
        
        db.query('SELECT COUNT(*) AS warning_count FROM warnings WHERE user_id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching warnings:', err.message);
                return interaction.reply({ content: 'An error occurred while fetching warnings.', ephemeral: true });
            }

            const warningCount = results[0].warning_count;
            let response = `You have ${warningCount} warnings.`;

            if (warningCount >= 3) {
                response += ' You have been banned from the server due to too many warnings.';
            }

            interaction.reply({ content: response, ephemeral: true });
        });
    }

    const timeoutKey = `${commandName}-${member.id}`;

    if (commandTimeouts.has(timeoutKey)) {
        const expiration = commandTimeouts.get(timeoutKey);
        const now = Date.now();
        if (now < expiration) {
            const remaining = Math.ceil((expiration - now) / 1000);
            return interaction.reply({ content: `You need to wait ${remaining} seconds before using this command again.`, ephemeral: true });
        }
    }

    commandTimeouts.set(timeoutKey, Date.now() + 10 * 1000);

    if (commandName === 'goal') { // command name. If you want to change don't forget to change it in SlashCommandBuilder too.
        if (!member.roles.cache.has(punktroll)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const newGoal = options.getInteger('number');
    
        const guild = client.guilds.cache.get(guildId);
        const memberCount = guild.memberCount;
    
        if (newGoal < memberCount) {
            await interaction.reply({ content: `The goal cannot be less than the number of members we have now (${memberCount})!`, ephemeral: true });
        } else {
            db.query('INSERT INTO server_goals (member_goal) VALUES (?)', [newGoal], (err) => {
                if (err) {
                    console.error('Error updating member goal:', err.message);
                    interaction.reply({ content: 'An error occurred while updating the goal.', ephemeral: true });
                } else {
                    updateVoiceChannels();  
                    interaction.reply({ content: `The goal has been updated to ${newGoal} members!`, ephemeral: true });
                }
            });
        }
    }

    if (commandName === 'wipe') { // command name. If you want to change don't forget to change it in SlashCommandBuilder too.
        const amount = options.getInteger('amount');
        if (!amount || amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Please provide a valid number between 1 and 100.', ephemeral: true });
        }
        if (!member.roles.cache.some(role => punktroll.includes(role.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        const fetchedMessages = await interaction.channel.messages.fetch({ limit: amount });
        const deletedMessages = await interaction.channel.bulkDelete(fetchedMessages, true);

        const deletedCount = deletedMessages.size;

        interaction.reply(`Deleted ${deletedCount} messages.`);
        setTimeout(() => interaction.deleteReply(), 5000);
    };
    if (commandName === 'review') { // command name. If you want to change don't forget to change it in SlashCommandBuilder too.
        
  if (!member.roles.cache.has(requiredRoleId)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
        const product = options.getString('product');
        const rating = options.getString('rating');
        const comment = options.getString('comment');
        const userId = member.id;

        const starRating = '⭐'.repeat(parseInt(rating));

        const guild = client.guilds.cache.get(guildId);
        const guildName = guild ? guild.name : 'Unknown Guild';
        
        const embed = new EmbedBuilder()
            .setTitle(`${guildName} - New Review`)
            .addFields(
                { name: 'Rating', value: starRating, inline: true },
                { name: 'Review by', value: `<@${userId}>`, inline: true },
                { name: 'Product', value: product, inline: true },
                { name: 'Comment', value: comment, inline: false }
            )
            .setColor('#5ad6c1')
            .setFooter({ text: `${guildName} • ${convertUTCToStockholm(new Date().toISOString())}`, iconURL: client.user.displayAvatarURL() }); //change the ${convertUTCToStockholm(new Date().toISOString())} To your time zone.

        const reviewChannel = client.channels.cache.get(reviewChannelId);
        if (reviewChannel) {
            await reviewChannel.send({ embeds: [embed] });
        }
        await interaction.reply({ content: 'Review submitted!', ephemeral: true });
    }
});

client.login(token);