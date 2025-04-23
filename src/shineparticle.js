import * as game from 'game'
import * as vec2 from 'vector2'
import Thing from 'thing'
import { getLockedColor } from './colors.js'

export default class ShineParticle extends Thing {
  alpha = 1
  position = [0, 0]
  velocity = [0, 0]
  depth = -100

  constructor(position, wordRarity, scale = 1.2) {
    super()
    this.wordRarity = wordRarity
    this.position = [...position]
    this.angle = Math.random() * Math.PI * 2
    this.size = 0
    this.sizeVel = 0.2 * scale
    this.sizeAccel = 0.02 * scale
  }

  update() {
    this.angle += 0.1

    this.sizeVel -= this.sizeAccel
    this.size += this.sizeVel

    if (this.size < 0) {
      this.isDead = true
    }
  }

  draw() {
    const { ctx } = game;

    ctx.save();

    const img = game.assets.images["ui_shine_particle"];
    
    ctx.filter = getLockedColor(this.wordRarity);
    
    ctx.translate(...this.position);
    ctx.rotate(this.angle);

    const size = Math.floor(32 * this.size);

    ctx.drawImage(img, size * -0.5, size * -0.5, size, size);

    ctx.restore()
  }
}
