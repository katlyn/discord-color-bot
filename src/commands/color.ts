// Much of this is taken from https://github.com/theGordHoard/hoardbot/blob/master/src/commands/util/color.ts
// Used with permission from myself because i'm the author

import { autocompleteColor, generateEmbed, getColor } from '../util'
import { ApplicationCommandType, InteractionHandler } from '../slashHandler'

const init = (handler: InteractionHandler): void => {
  handler.registerSlash({
    name: 'color',
    description: 'Look up a color',
    options: [{
      name: 'color',
      description: 'What color would you like to see?',
      type: ApplicationCommandType.STRING,
      required: false,
      autocomplete: true
    }]
  }, async (slash) => {
    const colorQuery = slash.data.options?.[0]?.value as string

    if (colorQuery === undefined) {
      // Find the user's color role - this will always start with 🎨
      const role = slash.guild.roles.get(slash.member.roles.find(r => {
        return slash.guild.roles.get(r).name.startsWith('🎨')
      }))
      if (role === undefined) {
        return {
          content: "You don't have a color role right now, but that's okay. Give me a color and I can get you one."
        }
      } else {
        const color = getColor(role.color.toString(16))
        return {
          embeds: [generateEmbed(color)]
        }
      }
    }

    const color = getColor(colorQuery)
    if (color === null) {
      return {
        content: `I don't know about ${colorQuery}, but don't worry. You can try another color, or provide a color in hex if you know one.`
      }
    }

    return {
      embeds: [generateEmbed(color)]
    }
  }, {
    autocomplete (interaction) {
      const input = interaction.data.options[0]
      const options = autocompleteColor(input.value as string)
      return options.map(v => ({
        name: v,
        value: v
      }))
    }
  })
}

export default { init }
