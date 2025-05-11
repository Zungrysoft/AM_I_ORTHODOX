import * as game from 'game'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { YELLOW_SELECTED } from './colors.js'

export default class SuccessParticle extends Thing {
  alpha = 1
  position = [0, 0]
  speed = 4

  constructor(position) {
    super()
    this.position = [...position]
  }

  update() {
    this.speed += 2
    this.position[1] -= this.speed
    this.alpha -= 0.1

    if (this.alpha <= 0 || this.position[1] < -100) {
      this.isDead = true
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()
    
    ctx.translate(...vec2.add(this.position, [-16, -16]))

    // ctx.filter = YELLOW_SELECTED;
    ctx.globalAlpha = this.alpha;
    const img = game.assets.images["ui_success_particle"]

    ctx.drawImage(img, 0, 0)

    ctx.restore()
  }
}
