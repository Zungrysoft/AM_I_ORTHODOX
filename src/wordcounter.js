import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import Thing from 'thing'
import Word from './word.js'
import { GREY_OBTAINED } from './colors.js'

export default class WordCounter extends Thing {
  enabledPosition = [game.getWidth() - 8 - 20, 8]
  disabledPosition = [game.getWidth() - 8 - 20, -80]
  isEnabled = false
  depth = -1

  constructor() {
    super()
    game.setThingName(this, 'wordCounter')
    this.totalWords = game.getThing('saveDataManager').totalWords
    this.totalAnswers = Array.from(new Set(Object.values(game.getThing('saveDataManager').answers))).length
    this.position = [...this.disabledPosition]
  }

  update() {
    this.isEnabled = game.getThing('saveDataManager').didEnding

    this.position = vec2.lerp(this.position, this.isEnabled ? this.enabledPosition : this.disabledPosition, 0.1)
  }

  drawDigit = (ctx, digit) => {
    if (digit !== 'clear') {
      const img = game.assets.images['number_' + digit]
      ctx.drawImage(img, 0, 0)
    }
  }

  draw() {
    const { ctx } = game;

    const unlockedWords = game.getThings().filter(x => x instanceof Word).length
    const unlockedAnswers = Object.keys(game.getThing('saveDataManager').receivedAnswers).length

    // progress counter
    ctx.save()

    let digits1 = [
      ...unlockedAnswers.toString(),
      'slash',
      ...this.totalAnswers.toString(),
    ]

    let digits2 = [
      ...unlockedWords.toString(),
      'slash',
      ...this.totalWords.toString(),
    ]

    ctx.filter = GREY_OBTAINED
    ctx.translate(...this.position)

    // Top row
    ctx.save()
    for (let i = digits1.length - 1; i >=0; i --) {
      this.drawDigit(ctx, digits1[i])
      ctx.translate(-20, 0)
    }
    ctx.restore()

    ctx.translate(0, 32)

    // Bottom row
    ctx.save()
    for (let i = digits2.length - 1; i >=0; i --) {
      this.drawDigit(ctx, digits2[i])
      ctx.translate(-20, 0)
    }
    ctx.restore()

    ctx.restore()
  }
}
