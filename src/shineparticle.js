import * as game from 'game'
import * as vec2 from 'vector2'
import Thing from 'thing'
import { getLockedColor } from './colors.js'
import { drawSprite } from './draw.js'

export default class ShineParticle extends Thing {
  alpha = 1
  position = [0, 0]
  velocity = [0, 0]
  depth = 2

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
    this.angle += 0.3

    this.sizeVel -= this.sizeAccel
    this.size += this.sizeVel

    if (this.size < 0) {
      this.isDead = true
    }
  }

  draw() {
    const img = game.assets.textures.ui_shine_particle;
    const size = Math.floor(32 * this.size);
    drawSprite({
      sprite: img,
      position: this.position,
      color: getLockedColor(this.wordRarity),
      width: size,
      height: size,
      centered: true,
      rotation: this.angle,
      depth: this.depth,
    });
  }
}
