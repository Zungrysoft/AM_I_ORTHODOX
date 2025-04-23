import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import Word, { WORD_SPACING } from './word.js'
import QuestionMark from './questionmark.js'
import Button from './button.js'
import Answer from './answer.js'
import { GREY_OBTAINED } from './colors.js'

export default class Credits extends Thing {
  depth = 100000
  drawAlpha = 0
  time = 0

  update() {
    this.time ++

    if (this.time > 60 * 4) {
      this.drawAlpha += 0.005
    }

    if (this.time === 60 * 10) {
      const credits = new Answer("am i orthodox? - by zungryware", [220, game.getHeight() / 2])
      credits.depth = this.depth + 1
      game.addThing(credits)
      game.getThing('saveDataManager').setDidEnding()
    }
  }

  draw() {
    const { ctx } = game

    // background
    ctx.save()
    ctx.globalAlpha = Math.pow(Math.floor(this.drawAlpha * 10) / 10, 0.7);
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.fillRect(0, 0, game.getWidth(), game.getHeight())
    ctx.restore()

  }
}
