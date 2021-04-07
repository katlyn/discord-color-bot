import { generateEmbed, getColor, getHighestRole } from '../util'
import { ApplicationCommandType, InteractionHandler } from '../slashHandler'

const init = (handler: InteractionHandler): void => {
  handler.registerSlash({
    name: 'paint',
    description: 'Paint your name with a nice color',
    options: [{
      name: 'color',
      description: 'What color would you like?',
      type: ApplicationCommandType.STRING,
      required: true
    }]
  }, async (slash, client) => {
    const colorQuery = slash.data.options[0].value as string
    const color = getColor(colorQuery)

    if (color === null) {
      return {
        content: `I don't have any ${colorQuery} on hand, but don't worry. You can try another color, or provide a color in hex if you know one.`
      }
    }

    // Make sure we have permission to do the things we need
    const botMember = slash.guild.members.get(client.user.id)
    const rolePosition = getHighestRole(botMember).position - 1
    if (!botMember.permissions.has('manageRoles')) {
      return {
        content: "It looks like I don't have permission to manage roles here. If you'd like, ask an admin to give me that permission."
      }
    }

    // Find the user's color role - this will always start with 🎨
    const role = slash.guild.roles.get(slash.member.roles.find(r => {
      return slash.guild.roles.get(r).name.startsWith('🎨')
    }))

    // Check if the user has a color role already - if not, create one for them
    if (role === undefined) {
      // Create the new role directly under the bot's highest role
      const createdRole = await slash.guild.createRole({
        name: `🎨 ${color.name}`,
        color: color.decimal
      })
      await createdRole.editPosition(rolePosition)
      await slash.member.addRole(createdRole.id)
    } else {
      // The user already has a role, see if the bot is able to modify it
      if (role.position > rolePosition) {
        return {
          content: "It looks like your painted role is a bit higher than I'm able to reach. Maybe an admin can move it below my highest role."
        }
      }
      // Update the role's name and color
      await role.edit({
        name: `🎨 ${color.name}`,
        color: color.decimal
      })
    }

    return {
      content: `Painted your name with a touch of ${color.name} - ${color.hex}. What a happy little color.`,
      embeds: [generateEmbed(color)]
    }
  })
}

export default { init }
