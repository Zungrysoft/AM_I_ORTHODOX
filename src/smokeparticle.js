import * as game from 'game'
import * as vec2 from 'vector2'
import Thing from 'thing'

export default class SmokeParticle extends Thing {
  alpha = 1
  position = [0, 0]
  velocity = [0, 0]
  depth = -100

  constructor(position) {
    super()
    this.position = [...position]
    this.velocity = vec2.scale(vec2.angleToVector(-(Math.random() * Math.PI * 0.5) - (Math.PI*0.25)), 4)
    this.angle = Math.random() * Math.PI * 2
    this.rotSpeed = (Math.random() < 0.5 ? 1 : -1) * 0.05
  }

  update() {
    this.position = vec2.add(this.position, this.velocity)

    this.velocity = vec2.scale(this.velocity, 0.95)

    this.alpha -= 0.03

    this.angle += this.rotSpeed

    if (this.alpha <= 0) {
      this.isDead = true
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()

    ctx.globalAlpha = this.alpha;
    const img = game.assets.images["ui_smoke_particle"]

    
    ctx.translate(...this.position)
    ctx.rotate(this.angle);

    ctx.drawImage(img, -32, -32, 64, 64)

    ctx.restore()
  }
}
