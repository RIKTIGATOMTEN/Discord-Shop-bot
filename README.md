# Discord Bot Setup Guide

## Prerequisites

### Database Setup

To run this Discord bot, you need a database. You can use either MariaDB or MySQL for this purpose. Below are the download links for the required tools:

- **MariaDB Server**: [Download MariaDB](https://mariadb.org/download/?t=mariadb&p=mariadb&r=11.5.2&os=windows&cpu=x86_64&pkg=msi&mirror=one)
- **MySQL Workbench**: [Download MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- **HeidiSQL**: [Download HeidiSQL](https://www.heidisql.com/download.php)

For detailed setup instructions, you might find it helpful to watch a tutorial video on YouTube.

# How to run

Open the folder in [Download Visual studio](https://code.visualstudio.com/download) and run this in the terminal. "node index.js"

## Configuring the Bot

1. **Create a Discord Application**: 
   - Go to [Discord Developer Portal](https://discord.com/developers/applications).
   - Create a new application.
   - Copy your application’s token and client ID.

2. **Update `config.json`**:
   - Create a file named `config.json` in the root directory of your project.
   - Replace the placeholders in the `config.json` file with your actual values.

3. **Here is the sql commands for the database, just copy and paste**:
   
 CREATE TABLE member_counts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_members INT,
    customer_count INT,
    bot_count INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE server_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_goal INT
);

CREATE TABLE User_roles (
    user_id VARCHAR(18) PRIMARY KEY,
    roles TEXT,
    username VARCHAR(100)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(18),
    username VARCHAR(100),
    message TEXT
);

CREATE TABLE link_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(18),
    username VARCHAR(100),
    message_content TEXT,
    channel_id VARCHAR(18),
    timestamp DATETIME
);

CREATE TABLE warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(18),
    warning_type VARCHAR(50),
    date_time DATETIME
);

### Configuration File

Here's a sample `config.json` file. Make sure to replace the placeholder values with your actual information:

```json
{
  "token": "YOUR DISCORD BOT TOKEN",
  "clientId": "YOUR BOT'S CLIENT ID",
  "guildId": "YOUR GUILD ID",
  
  "welcomeChannelId": "CHANNEL ID FOR WELCOME MESSAGES",
  "logChannelId": "CHANNEL ID FOR JOIN/LEAVE AND ROLE LOGS",
  "requiredRoleId": "ID FOR CUSTOMER ROLE",
  "allowedRoles": ["ROLE ID FOR DOT OR OWNER"],
  "recensionChannelId": "CHANNEL ID FOR REVIEWS",
  "punktroll": ["ROLE ID FOR DOT OR OWNER"],
  "memberCountChannelId": "CHANNEL ID FOR MEMBER COUNT",
  "kunderCountChannelId": "CHANNEL ID FOR CUSTOMER COUNT",
  "botCountChannelId": "CHANNEL ID FOR BOT COUNT",
  "goalCountChannelId": "CHANNEL ID FOR GOAL COUNT",

  "databaseConfig": {
    "host": "DATABASE HOST IP",
    "port": 3306,
    "user": "DATABASE USERNAME",
    "password": "DATABASE PASSWORD",
    "database": "DATABASE NAME"
  },
  
  "products": ["PRODUCT 1", "PRODUCT 2", "PRODUCT 3", "PRODUCT 4", "PRODUCT 5", "PRODUCT 6"],
  "ratings": [1, 2, 3, 4, 5],
  
  "antilinkChannelId": "CHANNEL ID FOR ANTILINK LOGS",
  "messageLogsChannelId": "CHANNEL ID FOR MESSAGE LOGS"
}
