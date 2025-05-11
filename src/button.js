import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { GREY_OBTAINED, WHITE, YELLOW_HIGHLIGHTED, YELLOW_SELECTED } from './colors.js'
import { drawSprite } from './draw.js'

export default class Button extends Thing {
  enabled = false
  position = [0, 0]
  positionEnabled = [0, 0]
  positionDisabled = [0, 0]
  size = [64, 64]
  depth = 10

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
    let translate = vec2.add(this.position, vec2.scale(this.size, -0.5))

    let color = WHITE;
    if (this.greyedOut) {
      color = GREY_OBTAINED;
    }
    else if (this.isClicked) {
      color = YELLOW_SELECTED;
    }
    else if (this.isHighlighted) {
      color = YELLOW_HIGHLIGHTED;
    }

    const img = game.assets.textures[this.icon]
    drawSprite({
      sprite: img,
      position: translate,
      color: color,
      width: this.size[0],
      height: this.size[1],
      depth: this.depth,
    });
  }
}
