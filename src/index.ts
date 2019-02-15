import { CommandClient, Role, TextChannel, Member } from 'eris'
import { create } from 'domain';

const namedColors = require('color-name-list')

let hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

let bot = new CommandClient(process.env.TOKEN)

bot.registerCommand('paint', async (msg, args) => {
  if (args[0]) {
    let colorValue
    if (args[0].startsWith('#')) {
      let isValidHex = hexRegex.test(args[0])
      if (!isValidHex) {
        return msg.channel.createMessage(`That's not a valid hex colour, but don't worry. Let's turn that mistake into a happy little cloud.`)
      }
      colorValue = args[0].substring(1)
    } else {
      let colorMatch = namedColors.find(color => color.name.toLowerCase() === args.join(' ').toLowerCase())
      if (!colorMatch) {
        return msg.channel.createMessage(`I don't think I have that colour of paint, but we'll make it work. I have lots more you can choose from, you can look through them at https://colors.gordhoard.org if that's something you want to do.`)
      }
      colorValue = colorMatch.hex.substring(1)
    }

    let decimalColor = parseInt(colorValue, 16)
    let pendingMessage = await msg.channel.createMessage(`Painting your name with a touch of ${args.join(' ').toLowerCase()}...`)

    let colorRole
    msg.member.roles.forEach(role => {
      if ((msg.channel as TextChannel).guild.roles.get(role).name.includes('🎨')) {
        colorRole = (msg.channel as TextChannel).guild.roles.get(role)
      }
    })

    let botMember = (msg.channel as TextChannel).guild.members.get(bot.user.id)
    if (!botMember.permission.has('manageRoles')) {
      return pendingMessage.edit(`It looks like I don't have permissions to manage roles in this server. Let an admin know so they can fix it.`)
    }

    if (!colorRole) {
      let rolePosition = getHighestRole(botMember).position

      // Create the color role
      let createdRole = await (msg.channel as TextChannel).guild.createRole({
        name: `🎨 ${args.join(' ').toLowerCase()}`,
        color: decimalColor
      }, `Requested by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`)

      // Move the role to the highest position we can
      setTimeout(() => {
        createdRole.editPosition(rolePosition - 1)
          .catch(err => { throw new Error(err) })
      }, 500)

      await msg.member.addRole(createdRole.id, `Requested by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`)
    } else {
      if (colorRole.position > getHighestRole(botMember).position) {
        return pendingMessage.edit(`It looks like your painted role is a little higher than I'm able to reach. Maybe an admin will move it down for me.`)
      }
      await colorRole.edit({
        name: `🎨 ${args.join(' ').toLowerCase()}`,
        color: decimalColor
      })
    }
    return pendingMessage.edit(`Painted your name with a touch of ${args.join(' ').toLowerCase()}. What a happy little colour.`)
  } else {
    let colorRole
    msg.member.roles.forEach(role => {
      if ((msg.channel as TextChannel).guild.roles.get(role).name.includes('🎨')) {
        colorRole = (msg.channel as TextChannel).guild.roles.get(role)
      }
    })
    if (!colorRole) {
      bot.createMessage(msg.channel.id, 'You don\'t have a colour role right now, but that\'s ok. If you\'d like, you can add one with `@Bob Ross paint <colour>`.')
        .catch(err => { throw new Error(err) })
    } else {
      bot.createMessage(msg.channel.id, `You're a lovely shade of \`#${colorRole.color.toString(16)}\`. If you'd like to change your colour, just add a hex code or colour name after this command.`)
      .catch(err => { throw new Error(err) })
    }
  }
}, {
  aliases: ['colour', 'color']
})

function getHighestRole (member: Member): Role {
  let roles = []
  member.roles.forEach(role => {
    let guildRole = member.guild.roles.get(role)
    roles.push(guildRole)
  })
  roles.sort((x, y) => {
    return y.position - x.position
  })
  return roles[0]
}

bot.connect()
  .catch(err => { throw new Error(err) })
