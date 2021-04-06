import 'source-map-support/register'
import { CommandClient } from 'eris'
import { InteractionHandler } from './slashHandler'

import commands from './commands'

const bot = new CommandClient(process.env.TOKEN, {
  getAllUsers: true,
  intents: [
    'guilds',
    'guildMembers',
    'guildMessages',
    'guildMessageReactions',
    'directMessages'
  ]
}, {
  defaultHelpCommand: false
})

bot.registerCommand(
  'help',
  "Hey there. If you'd like to use my commands, they've all been moved to slash commands. Type `/` to see a list.",
  {
    aliases: ['paint', 'color', 'colour']
  }
)

const slashHandler = new InteractionHandler(bot, {
  development: process.env.DEV_ENABLED === 'true',
  developmentGuild: process.env.DEV_GUILD
})

commands.init(slashHandler)

slashHandler.init().catch(err => { throw new Error(err) })
bot.connect().catch(err => { throw new Error(err) })

process.on('SIGTERM', () => {
  bot.disconnect({
    reconnect: false
  })
})
