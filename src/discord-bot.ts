import {
  Client, GatewayIntentBits, ActivityType,
  Events, EmbedBuilder, ChannelType,
} from "discord.js";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID;

if (!BOT_TOKEN || !GUILD_ID || !LOG_CHANNEL_ID) {
  console.log("[discord-bot] Skipped: BOT_TOKEN, GUILD_ID, or LOG_CHANNEL_ID not set");
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

let statusMessageId: string | null = null;

async function sendEmbed(channelId: string, embed: EmbedBuilder) {
  try {
    const ch = await client.channels.fetch(channelId);
    if (ch?.isTextBased()) {
      await ch.send({ embeds: [embed] });
    }
  } catch (e) {
    console.error(`[discord-bot] Failed to send embed to ${channelId}:`, e);
  }
}

async function logMemberJoin(member: import("discord.js").GuildMember) {
  const embed = new EmbedBuilder()
    .setTitle("📥 Member Joined")
    .setDescription(`<@${member.id}> **${member.user.tag}**`)
    .addFields(
      { name: "User ID", value: member.id, inline: true },
      { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
    .setColor(0x22c55e)
    .setTimestamp();
  await sendEmbed(LOG_CHANNEL_ID!, embed);
}

async function logMemberLeave(member: import("discord.js").GuildMember | import("discord.js").PartialGuildMember) {
  const embed = new EmbedBuilder()
    .setTitle("📤 Member Left")
    .setDescription(`**${member.user?.tag ?? "Unknown"}#${member.user?.discriminator ?? "0000"}** (${member.id})`)
    .addFields(
      { name: "User ID", value: member.id, inline: true },
      { name: "Joined At", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
    )
    .setThumbnail(member.user?.displayAvatarURL({ size: 128 }) ?? null)
    .setColor(0xef4444)
    .setTimestamp();
  await sendEmbed(LOG_CHANNEL_ID!, embed);
}

async function updateServerStatus() {
  if (!STATUS_CHANNEL_ID) return;
  const guild = client.guilds.cache.get(GUILD_ID!);
  if (!guild) return;

  try {
    const ch = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!ch || ch.type !== ChannelType.GuildText) return;

    await guild.members.fetch();
    const total = guild.memberCount;
    const online = guild.members.cache.filter((m) => m.presence?.status === "online").size;
    const idle = guild.members.cache.filter((m) => m.presence?.status === "idle").size;
    const dnd = guild.members.cache.filter((m) => m.presence?.status === "dnd").size;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name} — Server Status`)
      .setThumbnail(guild.iconURL({ size: 128 }))
      .addFields(
        { name: "👥 Total Members", value: `${total}`, inline: true },
        { name: "🟢 Online", value: `${online}`, inline: true },
        { name: "🌙 Idle", value: `${idle}`, inline: true },
        { name: "🔴 Do Not Disturb", value: `${dnd}`, inline: true },
        { name: "🤖 Bots", value: `${botCount}`, inline: true },
        { name: "💬 Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    if (statusMessageId) {
      const msg = await ch.messages.fetch(statusMessageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
        return;
      }
    }
    const msg = await ch.send({ embeds: [embed] });
    statusMessageId = msg.id;
  } catch (e) {
    console.error("[discord-bot] Failed to update server status:", e);
  }
}

client.once(Events.ClientReady, async (c) => {
  console.log(`[discord-bot] ✅ Logged in as ${c.user.tag}`);

  c.user.setPresence({
    activities: [{ name: "VALENCY STUDIO", type: ActivityType.Watching }],
    status: "online",
  });

  await updateServerStatus();
  setInterval(updateServerStatus, 5 * 60 * 1000);
});

client.on(Events.GuildMemberAdd, async (member) => {
  await logMemberJoin(member);
});

client.on(Events.GuildMemberRemove, async (member) => {
  await logMemberLeave(member);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    await message.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`);
  }
  if (message.content === "!status") {
    await updateServerStatus();
    await message.react("✅");
  }
});

client.login(BOT_TOKEN).catch((e) => {
  console.error("[discord-bot] Failed to login:", e);
  process.exit(1);
});
