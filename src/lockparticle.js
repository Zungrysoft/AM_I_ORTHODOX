import * as game from 'game'
import * as vec2 from 'vector2'
import Thing from 'thing'
import { getLockedColor } from './colors.js'
import { drawSprite } from './draw.js'

export default class LockParticle extends Thing {
  position = [0, 0]
  velocity = [0, 0]
  wordRarity = 0

  constructor(position, wordRarity) {
    super()

    this.position = [...position]
    this.velocity = [
      (Math.random() - 0.5) * 10,
      -7 - (Math.random() * 4),
      this.wordRarity = wordRarity
    ]
  }

  update() {
    this.velocity[1] += 0.5

    this.position = vec2.add(this.position, this.velocity)

    if (this.position[2] > game.getHeight() + 128) {
      this.isDead = true
    }
  }

  draw() {
    const img = game.assets.textures.ui_lock_particle
    drawSprite({
      sprite: img,
      position: this.position,
      color: getLockedColor(this.wordRarity),
    });
  }
}
