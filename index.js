const { App } = require("@slack/bolt");

require("dotenv").config();

var cp = require("child_process");
var child = cp.spawn("clip");

// eslint-disable-next-line no-undef
const { BOT_USER_TOKEN, SIGNING_SECRET, APP_LEVEL_TOKEN } = process.env;

const app = new App({
  token: BOT_USER_TOKEN, // Oauth  & Permissions tab
  signingSecret: SIGNING_SECRET, // Basic Information Tab
  socketMode: true,
  appToken: APP_LEVEL_TOKEN, // Token from the App-level Token that we created
});

app.shortcut("copy_thread", async ({ shortcut, ack, client, logger }) => {
  try {
    await ack();

    const response = await client.conversations.replies({
      token: BOT_USER_TOKEN,
      channel: shortcut.channel.id,
      ts: shortcut.message_ts,
    });

    let r = "";

    const header = {
      type: "modal",
      title: {
        type: "plain_text",
        text: "copy_thread",
      },
    };

    const result = await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        ...header,
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "loading.....",
            },
          },
        ],
      },
    });

    let user_map = new Map();

    for (let i = 0; i < response.messages.length; i++) {
      const message = response.messages[i];

      if (!user_map.has(message.user)) {
        const user_info = await client.users.info({
          token: BOT_USER_TOKEN,
          user: message.user,
        });

        user_map[message.user] = user_info.user.name;
      }

      const dt = new Date(message.ts * 1000);
      r += `**${user_map[message.user]}** : ${
        message.text
      }\n${dt.toLocaleString()}\n\n`;
    }

    await client.views.update({
      view_id: result.view.id,
      view: {
        ...header,
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: r,
            },
          },
        ],
      },
    });

    child.stdin.write(r);
    child.stdin.end();

    logger.info("DONE");
  } catch (error) {
    logger.error(error);
  }
});

app.start(3000);
