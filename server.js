import { Telegraf, Markup } from "telegraf";
import fs from "fs";
import { spawn } from "child_process";
import path, { format } from "path";
import { fileURLToPath } from "url";
import ytdlp from "yt-dlp-exec";
import { once } from "events";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config();

import { exec } from "child_process";

exec("python3 --version", (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`Python version: ${stdout}`);
});

const downloadFolder = path.join(__dirname, "downloads");

const bot = new Telegraf("");
let urlArray = [];
let urlArrayVideo = [];

bot.start(async (ctx) => {
  try {
    await ctx.replyWithHTML(
      `👋 <b>Welcome to the Media Downloader Bot!</b>\n\n` +
        `📥 <i>Download videos and media from:</i>\n` +
        `• <b>YouTube</b>\n` +
        `• <b>TikTok</b>\n` +
        `• <b>Instagram</b>\n` +
        `• <b>Facebook</b>\n\n` +
        `✨ <i>Features:</i>\n` +
        `• <b>Fast</b> and <b>high-quality</b> downloads\n` +
        `• <b>No limits</b> — download as much as you want\n` +
        `• <b>Super easy to use</b> — just send a link!\n\n` +
        `💡 <i>Send me a video or media link to get started.</i>`,
      {
        reply_markup: {
          keyboard: [
            ["🎧 Extract Audio", "📹 Video"],
            ["ℹ️ About this bot"],
            ["📝 Give feedback"],
          ],
          resize_keyboard: true,
        },
      }
    );
  } catch (error) {
    console.log("Error sending message:", error);
  }
});

bot.hears("ℹ️ About this bot", (ctx) => {
  ctx.reply(
    `🤖 <b>This bot is designed to help you download videos and audio from various platforms like YouTube, TikTok, Instagram, and Facebook.</b>\n\n
    📥 <i>Just send me a link, and I'll take care of the rest!</i>\n\n
    💬 <i>If you have any questions or need assistance, feel free to ask!</i>`
  );
});

bot.hears("📝 give feedback", (ctx) => {
  ctx.reply(
    `💬 <b>We value your feedback!</b>\n\n📝 <i>Please share your thoughts or suggestions about the bot. Your feedback helps us improve and provide a better experience for everyone.</i>`
  );

  bot.on("text", (messageCtx) => {
    const feedback = messageCtx.message.text.trim();
    ctx.reply(
      "🙏 <b>Thank you for your feedback!</b>\n\n💬 <i>We appreciate it and value your input.</i>"
    );

    bot.telegram.sendMessage(
      "1259654531",
      `📢 <b>New feedback from user: ${messageCtx.from.first_name}</b>\n\n📝 <i>"${feedback}"</i>`
    );
  });
});

//?!audio section

bot.hears("🎧 Extract Audio", (ctx) => {
  ctx.reply(
    "🎵 <b>Please select the download type to extract audio from videos:</b>\n\n🌐 It can be from any platform like <i>TikTok, YouTube, Instagram, and more...</i>",
    {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["🎧 Single Audio", "🎧 Multiple Audio"],
          ["❌ Cancel", "🔙 Back"],
        ],
        resize_keyboard: true,
      },
    }
  );
});

bot.hears("Back", (ctx) => {
  ctx.reply(
    `
      👋 Welcome to the Media Downloader Bot!
      
      📥 Download videos and media from:
      • YouTube  
      • TikTok  
      • Instagram  
      • Facebook
      
      ✨ Features:
      • Fast and high-quality downloads  
      • No limits — download as much as you want  
      • Super easy to use — just send a link!
      
      💡 Send me a video or media link to get started.
        `,
    {
      reply_markup: {
        keyboard: [
          ["Audio Only", "Video"],
          ["About this bot"],
          ["give feedback"],
        ],
        resize_keyboard: true,
      },
    }
  );
  urlArray = [];
});

bot.hears("🎧 Single Audio", (ctx) => {
  ctx.reply(
    `<b>🎯 Send the video URL</b>\n\n🎵 <i>I can extract audio from any platform</i> — TikTok, YouTube, Instagram, and more!\n\n🔗 Just drop the link, and I’ll do the rest.`,
    {
      parse_mode: "HTML",
    }
  );

  bot.on("text", async (messageCtx) => {
    try {
      const url = messageCtx.message.text.trim();
      if (!url.startsWith("http")) {
        return ctx.reply(
          "❌ <b>Please enter a valid URL!</b>\n\n🌐 Don't forget to include the <i>http</i> or <i>https</i> protocol in your link.",
          { parse_mode: "HTML" }
        );
      }

      const userId = ctx.from.id;
      const timestamp = Date.now();
      const filename = `video_${userId}_${timestamp}.mp3`;
      const filePath = path.join(downloadFolder, filename);
      ctx.reply(
        "⏳ <b>Downloading audio, please wait...</b>\n\n🔊 Your audio is being processed and will be ready shortly!",
        { parse_mode: "HTML" }
      );

      await dowloadVideo(url, filePath, true);
      await ctx.replyWithAudio(
        { source: filePath },
        {
          caption: `✅ Your audio has been successfully \n\n extracted 🎧. Enjoy premium sound quality from your favorite video 🔊. 🤖 Use this bot anytime to convert videos into crisp MP3s — fast ⚡, free 💸, and unlimited ♾️. 📩 Just share a video link and let the bot do the rest! \n\n give me more urls...`,
        }
      );
      fs.unlinkSync(filePath);
      urlArray = [];
    } catch (err) {
      console.log(err.message);
      ctx.reply(
        "❌ <b>Something went wrong! Please try again.</b>\n\n⚙️ If the issue persists, double-check the URLs or contact support.",
        { parse_mode: "HTML" }
      );
    }
  });
});

bot.hears("🎧 Multiple Audio", (ctx) => {
  ctx.reply(
    "*🎧 Please send the video URL you want to extract the audio from\\.*\n\n" +
      "👉 You can send *multiple URLs* as a single message, separated by *spaces* \\(e\\.g\\.:\n\n" +
      "`https://youtu.be/abc123 https://youtu.be/def456`\\)\n\n" +
      "⚠️ Make sure each URL starts with *http* or *https*",
    { parse_mode: "MarkdownV2" }
  );

  bot.on("text", (messageCtx) => {
    const url = messageCtx.message.text.trim();
    const urls = url.split(" ");
    const invalid = urls.some((url) => !url.startsWith("http"));
    if (invalid) {
      return ctx.reply(
        `*❌ Please enter a valid URL\\.*\n\n` +
          `*⚠️ Don't forget to add \\*http\\*\\/\\*https\\* protocols and separate each URL by a \\*space\\*\\.*`,
        { parse_mode: "MarkdownV2" }
      );
    }

    urlArray = urls;
    ctx.reply(
      "✅ <b>You have entered " +
        urls.length +
        " URLs.</b>\n\n<b>Please confirm to start downloading audio.</b>",
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback("Submit", "submit_audio_urls"),
              Markup.button.callback("Cancel", "Cancel"),
            ],
          ],
        },
      }
    );
  });
});

bot.action("Cancel", (ctx) => {
  ctx.reply(
    "*❌ Audio extraction process canceled*\n\n*🔄 Please send me a new URL to start over and extract audio from a new video\\!*",
    { parse_mode: "MarkdownV2" }
  );
  ctx.telegram.sendMessage(
    1259654531, // The chat ID or recipient
    `<b>❌ Video extraction process has been canceled.</b>\n\n🚀 <i>Ready when you are!</i>\n\n👉 Please send a new video URL to begin a fresh extraction.`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎧 Extract Audio", callback_data: "audio" }],
          [{ text: "📹 Extract Video", callback_data: "video" }],
          [{ text: "❌ Cancel", callback_data: "cancel" }],
          [{ text: "🔙 Back", callback_data: "back" }],
        ],
      },
    }
  );

  urlArrayVideo = [];
  urlArray = [];
});

//?!video section

bot.hears("cancel_video", (ctx) => {
  ctx.reply(
    `<b>❌ Video extraction process canceled.</b>\n\n🚀 <i>Ready when you are!</i>\n\n👉 Please send a new video URL to begin a fresh extraction.`,
    {
      parse_mode: "HTML",
    }
  );

  urlArrayVideo = [];
  urlArray = [];
});

bot.hears("📹 Video", (ctx) => {
  ctx.reply(
    "📥 <b>Please choose your download type</b>:\n\n🎬 Select whether you want to download a <i>single</i> video or <i>multiple</i> videos at once.",
    {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [["🎞️ Single Video", "📂 Multiple Video"], ["❌ Cancel"]],
        resize_keyboard: true,
      },
    }
  );
});

bot.hears("🎞️ Single Video", (ctx) => {
  ctx.reply(
    "📥 <b>Send the video URL you want to download</b>\n\n🌐 Supported platforms include: <i>TikTok, YouTube, Instagram</i>, and more.\n\n🚀 The bot will handle the rest for you!",
    { parse_mode: "HTML" }
  );

  bot.on("text", async (messageCtx) => {
    try {
      const url = messageCtx.message.text.trim();
      if (!url.startsWith("http")) {
        return ctx.reply(
          "❗ <b>Please enter a valid URL</b>\n\n⚠️ Make sure to include <i>http</i> or <i>https</i> in your link, and separate multiple URLs with a <b>space</b>.",
          { parse_mode: "HTML" }
        );
      }

      const userId = ctx.from.id;
      const timestamp = Date.now();
      const filename = `video_${userId}_${timestamp}.mp4`;
      const filePath = path.join(downloadFolder, filename);
      ctx.reply(
        "⏳ <b>Please wait, we are downloading your videos!</b>\n\n🔽 Your videos will be ready soon...",
        {
          parse_mode: "HTML",
        }
      );
      await dowloadVideo(url, filePath, false);
      await ctx.replyWithAudio(
        { source: filePath },
        {
          caption: `✅ Your audio has been successfully \n\n extracted 🎧. Enjoy premium sound quality from your favorite video 🔊. 🤖 Use this bot anytime to convert videos into crisp MP3s — fast ⚡, free 💸, and unlimited ♾️. 📩 Just share a video link and let the bot do the rest! \n\ngive me another list of urls...`,
        }
      );

      fs.unlinkSync(filePath);
      urlArrayVideo = [];
    } catch (err) {
      console.log(err.message);
      ctx.reply(
        "⚠️ <b>Something went wrong</b>\n\n🔁 Please try again in a moment or send a new URL.",
        { parse_mode: "HTML" }
      );
    }
  });
});

bot.hears("📂 Multiple Video", (ctx) => {
  ctx.reply(
    "📥 <b>Please send the video URL you want to download</b>\n\n🔗 You can send multiple URLs by separating them with a <b>space</b>.\n\n🌐 Supported platforms include <i>TikTok, YouTube, Instagram</i>, and more.",
    { parse_mode: "HTML" }
  );

  bot.on("text", (messageCtx) => {
    const url = messageCtx.message.text.trim();
    const urls = url.split(" ");
    const invalid = urls.some((url) => !url.startsWith("http"));
    if (invalid) {
      return ctx.reply(
        "⚠️ <b>Please enter a valid URL</b>\n\n❗ Don't forget to include <b>http://</b> or <b>https://</b> protocols.\n➕ Separate multiple URLs with a <b>space</b>.",
        { parse_mode: "HTML" }
      );
    }

    urlArrayVideo = urls;
    ctx.reply(
      `✅ <b>You have entered ${urls.length} URLs.</b>\n\n🎬 <b>Please confirm to start downloading the video(s).</b>`,
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback("✔️ Submit", "submit_video_urls"),
          Markup.button.callback("❌ Cancel", "cancel_video"),
        ]),
      }
    );
  });
});

bot.hears("❌ Cancel", (ctx) => {
  ctx.reply(
    "❌ <b>Video extraction process canceled.</b>\n\n🚀 <i>Ready when you are!</i>\n\n👉 Please send a new video URL to begin a fresh extraction.",
    {
      parse_mode: "HTML",
    }
  );
  urlArrayVideo = [];
  urlArray = [];
});

bot.action("submit_video_urls", async (ctx) => {
  try {
    if (urlArrayVideo.length === 0) {
      return ctx.reply(
        "❌ <b>No URLs provided.</b>\n\n⚠️ <b>Please send a valid URL to proceed.</b>",
        { parse_mode: "HTML" }
      );
    }

    ctx.reply(
      "⏳ <b>Please wait, we are downloading your videos!</b>\n\n🔽 Your videos will be ready soon...",
      {
        parse_mode: "HTML",
      }
    );

    urlArrayVideo.forEach(async (url, index) => {
      const userId = ctx.from.id;
      const timestamp = Date.now();
      const filename = `video_${userId}_${timestamp}__${index}.mp4`;
      const filePath = path.join(downloadFolder, filename);
      try {
        await dowloadVideo(url, filePath, false);
        await ctx.replyWithVideo(
          { source: filePath },
          {
            caption: `Enjoy listening your video_${1}, wait there are ${
              urlArrayVideo.length - 1 - index
            } video files`,
          }
        );
        fs.unlinkSync(filePath);
        urlArrayVideo = [];
      } catch (err) {
        console.log(err.message);
        ctx.reply(
          "⚠️ <b>Something went wrong with one of the URLs!</b>\n\nPlease check the URL and try again."
        );
      }
    });
  } catch (err) {
    console.log(err.message);
    ctx.reply(
      "❌ <b>Something went wrong. Please try again!</b>\n\nIf the issue persists, check your URL or try a different one."
    );
  }
});

bot.action("submit_audio_urls", async (ctx) => {
  try {
    if (urlArray.length === 0) {
      return ctx.reply(
        "❌ <b>No URLs provided!</b>\n\n🌐 Please send a valid URL to proceed."
      );
    }

    ctx.reply(
      "⏳ <b>Please wait, we're downloading the audio!</b>\n\n🔊 Hang tight, the process is almost complete!"
    );
    urlArray.forEach(async (url, index) => {
      const userId = ctx.from.id;
      const timestamp = Date.now();
      const filename = `video_${userId}_${timestamp}__${index}.mp3`;
      const filePath = path.join(downloadFolder, filename);
      try {
        await dowloadVideo(url, filePath, true);
        await ctx.replyWithAudio(
          { source: filePath },
          {
            caption: `Enjoy listening your extracted audio_${1}, wait there are ${
              urlArray.length - index
            } audio files`,
          }
        );
        fs.unlinkSync(filePath);
        urlArray = [];
      } catch (err) {
        console.log(err.message);
        ctx.reply(
          "❌ <b>Something went wrong with one of the URLs!</b>\n\n⚠️ Please check the URLs and try again."
        );
      }
    });
  } catch (err) {
    console.log(err.message);
    ctx.reply(
      "❌ <b>Something went wrong! Please try again.</b>\n\n⚡ If the issue persists, please check your input or try a different URL."
    );
  }
});

async function dowloadVideo(url, outputPath, isAudioOnly = false) {
  try {
    if (!fs.existsSync(downloadFolder)) {
      fs.mkdirSync(downloadFolder, { recursive: true });
    }

    const stream = fs.createWriteStream(outputPath);
    const options = isAudioOnly
      ? {
          format: "worstaudio",
          output: "-",
          extractAudio: true,
          audioFormat: "mp3",
        }
      : {
          format: "best",
          output: "-",
        };

    const media = ytdlp.exec(url, options);
    media.stdout.pipe(stream);

    await once(media, "close");
  } catch (err) {
    console.error("Download error:", err.message);
    throw err;
  }
}

console.log("bot is running✅");
await bot.launch();
