import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import Thing from 'thing'
import Word from './word.js'
import { GREY_OBTAINED } from './colors.js'
import { drawSprite } from './draw.js'

export default class WordCounter extends Thing {
  enabledPosition = [game.getWidth() - 8 - 20, 8]
  disabledPosition = [game.getWidth() - 8 - 20, -80]
  isEnabled = false
  depth = 2

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

  drawDigit = (digit, position) => {
    if (digit !== 'clear') {
      const img = game.assets.textures['number_' + digit]
      drawSprite({
        sprite: img,
        position: position,
        color: GREY_OBTAINED,
        depth: this.depth,
      })
    }
  }

  draw() {
    const unlockedWords = game.getThings().filter(x => x instanceof Word).length
    const unlockedAnswers = Object.keys(game.getThing('saveDataManager').receivedAnswers).length

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

    // Top row
    {
      let digitPos = 0
      for (let i = digits1.length - 1; i >=0; i --) {
        this.drawDigit(digits1[i], vec2.add(this.position, [digitPos, 0]))
        digitPos -= 20;
      }
    }

    // Bottom row
    {
      let digitPos = 0
      for (let i = digits2.length - 1; i >=0; i --) {
        this.drawDigit(digits2[i], vec2.add(this.position, [digitPos, 32]))
        digitPos -= 20;
      }
    }
  }
}
