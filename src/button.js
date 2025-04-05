import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'

export default class Button extends Thing {
  enabled = false
  position = [0, 0]
  positionEnabled = [0, 0]
  positionDisabled = [0, 0]
  size = [64, 64]

  constructor(positionDisabled, positionEnabled, icon, thingName, size=[64, 64]) {
    super()

    this.position = [...positionDisabled]
    this.positionDisabled = [...positionDisabled]
    this.positionEnabled = [...positionEnabled]
    this.enabled = false
    this.icon = icon
    this.size = size
    game.setThingName(this, thingName)
  }

  getAabb() {
    return [
      this.position[0] - this.size[0] / 2,
      this.position[1] - this.size[1] / 2,
      this.position[0] + this.size[0] / 2,
      this.position[1] + this.size[1] / 2,
    ]
  }

  update() {
    this.position = vec2.lerp(this.position, this.enabled ? this.positionEnabled : this.positionDisabled, 0.1)
    this.clicked = false

    if (u.pointInsideAabb(...game.mouse.position, this.getAabb())) {
      if (game.mouse.leftClick) {
        this.clicked = true
        this.isClicked = true
      }
    }
    if (!game.mouse.leftButton) {
      this.isClicked = false
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()
    
    ctx.translate(...this.position)
    ctx.translate(...vec2.scale(this.size, -0.5))

    if (this.isClicked) {
      ctx.filter = 'brightness(0) invert(1) sepia(1) saturate(50) hue-rotate(0deg)';
    }
    else if (u.pointInsideAabb(...game.mouse.position, this.getAabb())) {
      ctx.filter = 'brightness(0) invert(1) sepia(1) saturate(10) hue-rotate(0deg)';
    }

    const img = game.assets.images[this.icon]
    ctx.drawImage(img, 0, 0)

    ctx.restore()
  }
}
