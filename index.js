const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const dns = require('dns').promises;
const fs = require('fs');

// 🔥 PUT YOUR DETAILS HERE
const token = "8753184572:AAGLtyo3eD4ZqEkEhMYPXmVzjYMkvlbdf5E";
const ADMIN_ID = 6641503036;

const bot = new TelegramBot(token, { polling: true });

// SAVE USERS
function saveUser(id) {
    let users = [];
    if (fs.existsSync("users.json")) {
        users = JSON.parse(fs.readFileSync("users.json"));
    }

    if (!users.includes(id)) {
        users.push(id);
        fs.writeFileSync("users.json", JSON.stringify(users));
    }
}

// START
bot.onText(/\/start/, (msg) => {
    saveUser(msg.chat.id);

    bot.sendMessage(msg.chat.id, `
👋 Welcome ${msg.from.first_name}!

🌐 *IP Intelligence Bot*
━━━━━━━━━━━━━━
/ip <ip>
/domain <site>
/check <ip>
/help
    `, { parse_mode: "Markdown" });
});

// SMART SCAN 😈
bot.onText(/\/ip (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ip = match[1];

    try {
        let sent = await bot.sendMessage(chatId, "🔎 Initializing scan...");

        const edit = async (text) => {
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: sent.message_id,
                parse_mode: "Markdown"
            });
        };

        const steps = [
            "🌐 Connecting to target...",
            "📡 Gathering network data...",
            "🧠 Analyzing ISP & routing...",
            "🛡️ Checking security layers...",
            "📍 Resolving geolocation..."
        ];

        for (let step of steps) {
            await new Promise(r => setTimeout(r, 1000));
            await edit(step);
        }

        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        const d = res.data;

        if (d.status !== "success") {
            return edit("❌ Invalid IP");
        }

        let domain = "N/A";
        try {
            const reverse = await dns.reverse(ip);
            domain = reverse.join(", ");
        } catch {}

        const map = `https://www.google.com/maps?q=${d.lat},${d.lon}`;

        await edit(`
✅ *SCAN COMPLETE*
━━━━━━━━━━━━━━
🌍 IP: ${d.query}
Country: ${d.country}
Region: ${d.regionName}
City: ${d.city}

📍 Lat: ${d.lat}
📍 Lon: ${d.lon}

🏢 ISP: ${d.isp}
🏛️ Org: ${d.org}

🌐 Domain: ${domain}

🗺️ [Open Location](${map})
        `);

    } catch {
        bot.sendMessage(chatId, "⚠️ Scan failed");
    }
});

// DOMAIN
bot.onText(/\/domain (.+)/, async (msg, match) => {
    try {
        const res = await dns.lookup(match[1]);

        bot.sendMessage(msg.chat.id, `
🌐 Domain Lookup
━━━━━━━━━━━━━━
Domain: ${match[1]}
IP: ${res.address}
        `);

    } catch {
        bot.sendMessage(msg.chat.id, "❌ Invalid domain");
    }
});

// VPN CHECK
bot.onText(/\/check (.+)/, async (msg, match) => {
    try {
        const res = await axios.get(`http://ip-api.com/json/${match[1]}?fields=proxy,hosting,query`);
        const d = res.data;

        bot.sendMessage(msg.chat.id, `
🛡️ Security Check
━━━━━━━━━━━━━━
IP: ${d.query}
Proxy: ${d.proxy ? "Yes ⚠️" : "No ✅"}
Hosting: ${d.hosting ? "Yes ⚠️" : "No ✅"}
        `);

    } catch {
        bot.sendMessage(msg.chat.id, "⚠️ Failed");
    }
});

// BROADCAST
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    if (msg.chat.id !== ADMIN_ID) {
        return bot.sendMessage(msg.chat.id, "🚫 Admin only");
    }

    if (!fs.existsSync("users.json")) return;

    const users = JSON.parse(fs.readFileSync("users.json"));

    users.forEach(id => {
        bot.sendMessage(id, `📢 ${match[1]}`).catch(() => {});
    });

    bot.sendMessage(msg.chat.id, "✅ Sent");
});

console.log("🚀 Bot running...");