import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { GREY_OBTAINED, YELLOW_HIGHLIGHTED, YELLOW_SELECTED } from './colors.js'

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
      if (!this.isHighlighted && !this.greyedOut) {
        soundmanager.playSound('click1', 0.05, 1.8)
        this.isHighlighted = true
      }
      if (game.mouse.leftClick) {
        this.clicked = true
        this.isClicked = true
      }
    }
    else {
      this.isHighlighted = false
    }
    if (!game.mouse.leftButton && !this.greyedOut) {
      this.isClicked = false
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()
    
    ctx.translate(...this.position)
    ctx.translate(...vec2.scale(this.size, -0.5))

    if (this.greyedOut) {
      ctx.filter = GREY_OBTAINED;
    }
    else if (this.isClicked) {
      ctx.filter = YELLOW_SELECTED;
    }
    else if (this.isHighlighted) {
      ctx.filter = YELLOW_HIGHLIGHTED;
    }

    const img = game.assets.images[this.icon]
    ctx.drawImage(img, 0, 0)

    ctx.restore()
  }
}
