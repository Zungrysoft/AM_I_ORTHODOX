import * as game from 'game'
import Thing from 'thing'
import Answer from './answer.js'
import { drawBackground } from './draw.js'

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
    // background
    drawBackground({
      color: [0.0, 0.0, 0.0],
      alpha: Math.pow(Math.floor(this.drawAlpha * 10) / 10, 0.7),
      depth: this.depth,
    });
  }
}
