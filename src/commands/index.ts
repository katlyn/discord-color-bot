import { InteractionHandler } from 'src/slashHandler'
import color from './color'
import paint from './paint'

const init = (handler: InteractionHandler): void => {
  color.init(handler)
  paint.init(handler)
}

export default { init }
