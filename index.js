const namedColors = require('color-name-list')
const { discordToken } = require('./config')
const Eris = require('eris')
const parser = require('yargs-parser')

let bot = new Eris(discordToken)

bot.on('messageCreate', msg => {
  if (msg.content.startsWith(`<@${bot.user.id}> `)) {
    msg.content = msg.content.slice(`<@${bot.user.id}> `.length).trim()
    if (msg.content.startsWith('color')) {
      console.log(msg.member.roles)
      let colorRole = null
      msg.member.roles.forEach(role => {
        console.log(msg.channel.guild.roles.get(role).name)
        if (msg.channel.guild.roles.get(role).name.startsWith('Paint Color ')) {
          colorRole = msg.channel.guild.roles.get(role)
        }
      })
      if (colorRole === null) {
        bot.createMessage(msg.channel.id, 'You don\'t have a color role right now. Get one with `@Bob Ross paint`')
        return
      }
      bot.createMessage(msg.channel.id, `You're a lovely shade of \`#${colorRole.color.toString(16)}\`, let me know if you'd like something new by telling me \`@Bob Ross paint\``)
    }
    if (msg.content.startsWith('paint ')) {
      msg.content = msg.content.slice(6)
      let parsed = parser(msg.content)
      console.log(parsed)
      let color = null
      if (parsed.hex) {
        parsed.hex = parsed.hex + ''
        if (/(^#?[0-9A-F]{6}$)|(^#?[0-9A-F]{3}$)/i.test(parsed.hex)) {
          color = parsed.hex.replace(/^(#)/, '')
        }
      } else if (parsed.name) {
        let someNamedColor = namedColors.find(color => color.name.toLowerCase() === parsed.name.toLowerCase())
        if (!someNamedColor) {
          bot.createMessage(msg.channel.id, 'Sorry, I don\'t have that paint color')
          return
        }
        console.log(someNamedColor)
        color = someNamedColor.hex.replace(/^(#)/, '')
        console.log(parsed.name + ' ' + someNamedColor.hex)
      }
      console.log(color)
      if (color === null) {
        return
      }
      bot.createMessage(msg.channel.id, `Painting your name with \`#${color}\`...`)
        .then(startedMessage => {
          let colorRole = null
          msg.member.roles.forEach(role => {
            console.log(msg.channel.guild.roles.get(role).name)
            if (msg.channel.guild.roles.get(role).name.startsWith('Paint Color ')) {
              colorRole = msg.channel.guild.roles.get(role)
            }
          })
          if (colorRole === null) {
            msg.channel.guild.createRole({
              name: `Paint Color #${color}`,
              color: parseInt(color, 16)
            }, 'Let\'s paint a happy little cloud.')
              .then(role => {
                msg.channel.guild.addMemberRole(msg.author.id, role.id, 'Let\'s paint a happy little cloud.')
                  .then(() => { startedMessage.edit('What a happy little color.') })
              })
            return
          }
          color = color + ''
          console.log(parseInt(color, 16))
          colorRole.edit({
            name: `Paint Color #${color}`,
            color: parseInt(color, 16)
          }, 'Let\'s paint a happy little cloud.')
            .then(() => {
              startedMessage.edit('What a happy little color.')
            })
        })
    }
  }
})

bot.connect()
