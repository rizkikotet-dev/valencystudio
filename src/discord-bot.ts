import {
  Client, GatewayIntentBits, ActivityType,
  Events, EmbedBuilder, ChannelType,
  REST, Routes, SlashCommandBuilder,
  type GuildMember, type PartialGuildMember,
} from "discord.js";
import "dotenv/config";
import fs from "fs";
import path from "path";

// ==========================================
// 📝 ENVIRONMENT VARIABLES & CONFIGURATION
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID; // Opsional: Channel untuk welcome message

if (!BOT_TOKEN || !GUILD_ID || !LOG_CHANNEL_ID) {
  console.log("[discord-bot] ❌ Skipped: BOT_TOKEN, GUILD_ID, or LOG_CHANNEL_ID not set in .env");
  process.exit(0);
}

// ==========================================
// 📂 PERSISTENT CONFIGURATION (JSON)
// ==========================================
const CONFIG_FILE = path.join(process.cwd(), "bot-config.json");

interface BotConfig {
  statusMessageId?: string;
}

function loadConfig(): BotConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("[discord-bot] Error loading config:", err);
  }
  return {};
}

function saveConfig(config: BotConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("[discord-bot] Error saving config:", err);
  }
}

// ==========================================
// 🤖 DISCORD CLIENT INITIALIZATION
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,       // WAJIB: Untuk cache member & hitung total
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,     // WAJIB: Untuk status online/idle/dnd
  ],
});

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================
async function sendEmbed(channelId: string, embed: EmbedBuilder) {
  try {
    const ch = await client.channels.fetch(channelId);
    if (!ch) {
      console.error(`[discord-bot] ❌ Channel ${channelId} not found`);
      return;
    }

    console.log(`[discord-bot] Channel ${channelId} fetched: type=${ch.type}, name=${"name" in ch ? ch.name : "?"}}`);

    if (ch.isTextBased() && ch.type !== ChannelType.GroupDM) {
      const sent = await ch.send({ embeds: [embed] });
      console.log(`[discord-bot] ✅ Message sent to ${channelId}: ${sent.id}`);
    } else {
      console.error(`[discord-bot] ❌ Channel ${channelId} is not a sendable text channel (type=${ch.type})`);
    }
  } catch (e: any) {
    console.error(`[discord-bot] ❌ Failed to send embed to ${channelId}:`, e?.message ?? e);
    if (e?.rawError) console.error("[discord-bot] 🔍 Discord API rawError:", JSON.stringify(e.rawError));
    if (e?.code) console.error("[discord-bot] 🔍 Discord error code:", e.code);
  }
}

async function logMemberJoin(member: GuildMember) {
  const embed = new EmbedBuilder()
    .setTitle("📥 Member Joined")
    .setDescription(`**${member.user.tag}** (<@${member.id}>) has joined the server.`)
    .addFields(
      { name: "🆔 User ID", value: member.id, inline: true },
      { name: "📅 Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "👥 Total Members", value: `${member.guild.memberCount}`, inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setColor(0x22c55e) // Green
    .setTimestamp();
  
  await sendEmbed(LOG_CHANNEL_ID!, embed);
}

async function logMemberLeave(member: GuildMember | PartialGuildMember) {
  const embed = new EmbedBuilder()
    .setTitle("📤 Member Left")
    .setDescription(`**${member.user?.tag ?? "Unknown"}** (<@${member.id}>) has left the server.`)
    .addFields(
      { name: "🆔 User ID", value: member.id, inline: true },
      { name: "📅 Joined At", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
      { name: "👥 Total Members", value: `${member.guild.memberCount}`, inline: true }
    )
    .setThumbnail(member.user?.displayAvatarURL({ size: 256 }) ?? null)
    .setColor(0xef4444) // Red
    .setTimestamp();
  
  await sendEmbed(LOG_CHANNEL_ID!, embed);
}

async function sendWelcome(member: GuildMember) {
  if (!WELCOME_CHANNEL_ID) return;
  
  try {
    const ch = await client.channels.fetch(WELCOME_CHANNEL_ID);
    // ✅ FIX: Pastikan channel bisa menerima pesan (bukan GroupDM)
    if (!ch || !ch.isTextBased() || ch.type === ChannelType.GroupDM) return;

    const embed = new EmbedBuilder()
      .setTitle("🎉 Welcome to the Server!")
      .setDescription(`Hello <@${member.id}>, welcome to **${member.guild.name}**! We now have **${member.guild.memberCount}** members.`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "👤 Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "🆔 User ID", value: member.id, inline: true }
      )
      .setColor(0x00ff00) // Bright Green
      .setFooter({ text: "Enjoy your stay!" })
      .setTimestamp();

    await ch.send({ content: `Welcome aboard, <@${member.id}>! 🎉`, embeds: [embed] });
  } catch (e) {
    console.error(`[discord-bot] Failed to send welcome message:`, e);
  }
}

async function updateServerStatus() {
  if (!STATUS_CHANNEL_ID) return;
  const guild = client.guilds.cache.get(GUILD_ID!);
  if (!guild) return;

  try {
    const ch = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!ch || !ch.isTextBased() || ch.type === ChannelType.GroupDM) return;

    const total = guild.memberCount;
    const online = guild.members.cache.filter((m) => m.presence?.status === "online").size;
    const idle = guild.members.cache.filter((m) => m.presence?.status === "idle").size;
    const dnd = guild.members.cache.filter((m) => m.presence?.status === "dnd").size;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostLevel = guild.premiumTier;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name} — Server Status`)
      .setDescription(`Real-time statistics for **${guild.name}**.`)
      .setThumbnail(guild.iconURL({ size: 256 }) || null)
      .addFields(
        { name: "👥 Members", value: `Total: **${total}**\nBots: **${botCount}**`, inline: true },
        { name: "🟢 Presence", value: `Online: **${online}**\nIdle: **${idle}**\nDND: **${dnd}**`, inline: true },
        { name: "💎 Boosts", value: `Level: **${boostLevel}**\nCount: **${boostCount}**`, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "💬 Channels", value: `**${guild.channels.cache.size}**`, inline: true },
      )
      .setColor(0x5865F2)
      .setFooter({ text: `Server ID: ${guild.id} • Auto-updates every 5m`, iconURL: client.user?.displayAvatarURL() })
      .setTimestamp();

    const config = loadConfig();

    // Pakai config.statusMessageId, bukan variable module
    if (config.statusMessageId) {
      try {
        const fetched = await ch.messages.fetch(config.statusMessageId);
        await fetched.edit({ embeds: [embed] });
        console.log(`[discord-bot] ✅ Status message edited: ${fetched.id}`);
        return;
      } catch (e) {
        console.log(`[discord-bot] ⚠️ Status message ${config.statusMessageId} not found, sending new`);
      }
    }

    const newMsg = await ch.send({ embeds: [embed] });
    console.log(`[discord-bot] ✅ Status message sent: ${newMsg.id}`);
    saveConfig({ ...config, statusMessageId: newMsg.id });
  } catch (e) {
    console.error("[discord-bot] Failed to update server status:", e);
  }
}

// ==========================================
// 🚀 SLASH COMMANDS DEFINITION
// ==========================================
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong and latency!'),
  new SlashCommandBuilder().setName('status').setDescription('Force updates the server status message.'),
  new SlashCommandBuilder().setName('help').setDescription('Shows bot information and available commands.'),
].map(command => command.toJSON());

// ==========================================
// 🎯 EVENT HANDLERS
// ==========================================
client.once(Events.ClientReady, async (c) => {
  console.log(`[discord-bot] ✅ Logged in as ${c.user.tag}`);

  // Force fetch guild — cache sering kosong pas ClientReady
  try {
    await client.guilds.fetch(GUILD_ID!);
  } catch (e) {
    console.error(`[discord-bot] Failed to fetch guild ${GUILD_ID}:`, e);
  }

  c.user.setPresence({
    activities: [{ name: "VALENCY STUDIO", type: ActivityType.Watching }],
    status: "online",
  });

  // Register Slash Commands ke Server
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN!);
  try {
    console.log('[discord-bot] Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(c.user.id, GUILD_ID!),
      { body: commands },
    );
    console.log('[discord-bot] ✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('[discord-bot] Error registering commands:', error);
  }

  // Diagnostic channel
  for (const [label, id] of Object.entries({ LOG_CHANNEL_ID, STATUS_CHANNEL_ID, WELCOME_CHANNEL_ID })) {
    if (!id) { console.log(`[discord-bot] ⏭️ ${label} not set`); continue; }
    try {
      const ch = await client.channels.fetch(id);
      if (!ch) { console.log(`[discord-bot] ❌ ${label} (${id}) not found`); continue; }
      const perms = ch.isTextBased() && ch.type !== ChannelType.GroupDM && "permissionsFor" in ch ? (ch as any).permissionsFor(client.user!.id) : null;
      console.log(`[discord-bot] 📡 ${label} (${id}): type=${ch.type} name=${"name" in ch ? ch.name : "?"} canSend=${!!perms?.has("SendMessages")} canEmbed=${!!perms?.has("EmbedLinks")}`);
    } catch (e: any) {
      console.log(`[discord-bot] ❌ ${label} (${id}) fetch error: ${e?.message ?? e}`);
    }
  }

  await updateServerStatus();
  setInterval(updateServerStatus, 5 * 60 * 1000);
});

client.on(Events.GuildMemberAdd, async (member) => {
  await logMemberJoin(member);
  await sendWelcome(member); // Trigger welcome message
});

client.on(Events.GuildMemberRemove, async (member) => {
  await logMemberLeave(member);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply(`🏓 Pong! Websocket heartbeat: **${client.ws.ping}ms**.`);
  } 
  else if (interaction.commandName === 'status') {
    await interaction.deferReply({ ephemeral: true }); // Hanya user yang lihat respon
    await updateServerStatus();
    await interaction.editReply('✅ Server status message updated successfully!');
  }
  else if (interaction.commandName === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Help & Commands')
      .setDescription('Here are the available commands:')
      .addFields(
        { name: '/ping', value: 'Check bot latency.', inline: true },
        { name: '/status', value: 'Force update the server status embed.', inline: true },
        { name: '!status', value: 'Legacy command to force update status.', inline: true },
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'Developed with ❤️' });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  
  // Legacy prefix commands (Fallback)
  if (message.content === "!ping") {
    await message.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`);
  }
  if (message.content === "!status") {
    await updateServerStatus();
    await message.react("✅");
  }
});

// ==========================================
// 🛑 GRACEFUL SHUTDOWN
// ==========================================
process.on('SIGINT', async () => {
  console.log('[discord-bot] SIGINT received. Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[discord-bot] SIGTERM received. Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// ==========================================
// 🔑 LOGIN
// ==========================================
client.login(BOT_TOKEN).catch((e) => {
  console.error("[discord-bot] ❌ Failed to login:", e.message);
  process.exit(0); 
});