// Much of this is taken from https://github.com/theGordHoard/hoardbot/blob/master/src/commands/util/color.ts
// Used with permission from myself because i'm the author

import { getColor, hexToRgb } from '../util'
import { ApplicationCommandType, InteractionHandler } from '../slashHandler'

const init = (handler: InteractionHandler): void => {
  handler.registerSlash({
    name: 'color',
    description: 'Look up a color',
    options: [{
      name: 'color',
      description: 'What color would you like to see?',
      type: ApplicationCommandType.STRING
    }]
  }, async (slash) => {
    const colorQuery = slash.data.options[0].value as string
    const color = getColor(colorQuery)

    if (color === null) {
      return {
        content: `I don't know about ${colorQuery}, but don't worry. You can try another color, or provide a color in hex if you know one.`
      }
    }

    const red = (color.rgb.r / 255 * 100).toFixed(2)
    const blue = (color.rgb.b / 255 * 100).toFixed(2)
    const green = (color.rgb.g / 255 * 100).toFixed(2)

    return {
      embeds: [{
        type: 'rich',
        color: color.decimal,
        description: `${color.name} (\`${color.hex}\`) is comprised of ${red}% red, ${green}% green, and ${blue}% blue.`,
        image: {
          url: color.image
        },
        footer: {
          text: color.distance === 0
            ? `${color.name} is an exact match for this color.`
            : `${color.name} is an approximation for this color, with an error of ${color.distance.toFixed(2)}.`
        }
      }]
    }
  })
}

export default { init }
