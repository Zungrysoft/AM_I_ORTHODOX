import * as game from 'game'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { LETTER_SPACING, SPACE_BETWEEN_WORDS } from './word.js'

export default class Answer extends Thing {
  words = []
  position = [0, 0]
  desiredPositon = [0, 0]
  donePosition = [0, 0]
  done = false

  constructor(text, position) {
    super()

    this.words = text.split(" ")
    this.desiredPosition = [...position]
    this.position = [
      game.getWidth() + 100,
      position[1],
    ]
    this.donePosition = [
      -game.getWidth(),
      position[1],
    ]
  }

  update() {
    if (this.done) {
      this.position = vec2.lerp(this.position, this.donePosition, 0.1)
      if (vec2.distance(this.position, this.donePosition) < 1) {
        this.isDead = true
      }
    }
    else {
      this.position = vec2.lerp(this.position, this.desiredPosition, 0.1)
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()
    
    ctx.translate(...this.position)

    for (const word of this.words) {
      for (const char of word) {
        const img = game.assets.images["letter_" + char]
        ctx.drawImage(img, 0, 0)
        ctx.translate(LETTER_SPACING, 0)
      }
      ctx.translate(SPACE_BETWEEN_WORDS, 0)
    }
    

    ctx.restore()
  }
}
