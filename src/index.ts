import 'source-map-support/register'
import { Client } from 'eris'
import { InteractionHandler } from './slashHandler'

import commands from './commands'

const bot = new Client(process.env.TOKEN, {
  getAllUsers: true,
  intents: [
    'guilds',
    'guildMembers',
    'guildMessages',
    'guildMessageReactions',
    'directMessages'
  ]
})

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
