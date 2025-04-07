import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { PINK_LOCKED, RED_ERROR, YELLOW_HIGHLIGHTED, YELLOW_SELECTED } from './colors.js'
import SuccessParticle from './successparticle.js'
import SmokeParticle from './smokeparticle.js'

export const LETTER_SPACING = 26
export const APOSTRAPHE_SPACING = 10
export const WORD_SPACING = 20
export const LETTER_SIZE = 32
export const REPEL_DISTANCE = 50
export const REPEL_FORCE = 0.0002
export const FRICTION = 0.03
export const DRIFT_FORCE = 0.004
export const DRIFT_CHANGE_RATE = 180
export const DRIFT_CHANGE_RATE_VARIANCE = 100
export const BOUND_CORRECTION_FORCE = 0.02
export const LINE_SPACING = 52
export const FLASH_DURATION = 25

export default class Word extends Thing {
  word = "zyxzyxzyx"
  position = [0, 0]
  originalPosition = [0, 0]
  selectedPosition = [0, 0]
  velocity = [0, 0]
  driftDirection = [0, 0]
  driftChangeTime = 0
  isBeingDragged = false
  isHighlighted = false
  mustReturnToOriginalPosition = false
  dragTime = 0
  flashTime = 0

  constructor(word, position, originalPosition) {
    super()

    this.word = word
    this.position = [...position]
    if (originalPosition) {
      this.originalPosition = [...originalPosition]
      this.mustReturnToOriginalPosition = true
    }
  }

  getSize() {
    return [LETTER_SIZE + ((this.word.length - 1) * LETTER_SPACING), LETTER_SIZE]
  }

  getAabb() {
    const size = this.getSize();
    return [
      this.position[0] - size[0] / 2,
      this.position[1] - size[1] / 2,
      this.position[0] + size[0] / 2,
      this.position[1] + size[1] / 2,
    ]
  }

  distanceToOtherWord(word) {
    const box1 = this.getAabb()
    const box2 = word.getAabb()

    const xSep = Math.max(0, Math.max(box1[0] - box2[2], box2[0] - box1[2]));
    const ySep = Math.max(0, Math.max(box1[1] - box2[3], box2[1] - box1[3]));
    
    if (xSep > 0 && ySep > 0) {
        return Math.sqrt(xSep ** 2 + ySep ** 2);
    }
    return Math.max(xSep, ySep);
  }

  releaseSuccessParticles(index) {
    this.flashOffset = Math.floor(FLASH_DURATION * 0.4 * index)
    this.flashTime = 0
  }

  update() {
    if (this.isBeingDragged) {
      this.dragTime ++
    }
    else {
      this.dragTime = 0
    }

    this.flashTime ++

    if (this.isSelected) {
      this.position = vec2.lerp(this.position, this.selectedPosition, 0.1)
      this.mustReturnToOriginalPosition = true
      this.velocity = [0, 0]
    }
    else if (this.isBeingDragged) {
      const prevPosition = [...this.position]

      if (game?.mouse?.position) {
        this.position = vec2.lerp(this.position, vec2.add(game.mouse.position, [0, 0]), 0.1)
      }

      // Constrain to boundary area
      const bounds = game.getThing('ui').wordBounds
      const aabb = this.getAabb()
      if (aabb[0] < bounds[0]) {
        this.position[0] = bounds[0] + this.getSize()[0] / 2
      }
      if (aabb[2] > bounds[2]) {
        this.position[0] = bounds[2] - this.getSize()[0] / 2
      }
      if (aabb[1] < bounds[1]) {
        this.position[1] = bounds[1] + this.getSize()[1] / 2
      }
      if (aabb[3] > bounds[3]) {
        this.position[1] = bounds[3] - this.getSize()[1] / 2
      }

      this.velocity = vec2.subtract(this.position, prevPosition)
      this.mustReturnToOriginalPosition = false
    }
    else {
      if (vec2.distance(this.position, this.originalPosition) < 1) {
        this.mustReturnToOriginalPosition = false
      }

      if (this.mustReturnToOriginalPosition) {
        this.position = vec2.lerp(this.position, this.originalPosition, 0.1)
      }
      else {
        // Constrain to boundary area
        const bounds = game.getThing('ui').wordBounds
        const aabb = this.getAabb()
        if (aabb[0] < bounds[0]) {
          this.velocity[0] += (bounds[0] - aabb[0]) * BOUND_CORRECTION_FORCE
        }
        if (aabb[2] > bounds[2]) {
          this.velocity[0] -= (aabb[2] - bounds[2]) * BOUND_CORRECTION_FORCE
        }
        if (aabb[1] < bounds[1]) {
          this.velocity[1] += (bounds[1] - aabb[1]) * BOUND_CORRECTION_FORCE
        }
        if (aabb[3] > bounds[3]) {
          this.velocity[1] -= (aabb[3] - bounds[3]) * BOUND_CORRECTION_FORCE
        }

        this.driftChangeTime --
        if (this.driftChangeTime <= 0) {
          this.driftChangeTime = DRIFT_CHANGE_RATE + (DRIFT_CHANGE_RATE_VARIANCE * Math.random()) - (DRIFT_CHANGE_RATE_VARIANCE / 2)
          const angle = Math.random() * 2 * Math.PI
          this.driftDirection = vec2.angleToVector(angle)
        }

        this.velocity = vec2.add(this.velocity, vec2.scale(this.driftDirection, DRIFT_FORCE))

        this.velocity = vec2.scale(this.velocity, 1.0 - FRICTION)

        for (const word of game.getThings().filter(x => x instanceof Word && this !== x)) {
          const dist = this.distanceToOtherWord(word)

          if (dist < REPEL_DISTANCE) {
            const dir = vec2.normalize(vec2.subtract(this.position, word.position))

            let velocityDelta = vec2.scale(dir, (REPEL_DISTANCE - dist) * REPEL_FORCE)
            if (dist === 0) {
              velocityDelta = vec2.scale(velocityDelta, 2)
            }
            this.velocity = vec2.add(this.velocity, velocityDelta)
          }
        }

        this.position = vec2.add(this.position, this.velocity)
        this.originalPosition = [...this.position]
      }
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()
    
    ctx.translate(...this.position)
    ctx.translate(...vec2.scale(this.getSize(), -0.5))

    if (this.flashTime >= this.flashOffset && this.flashTime < this.flashOffset + FLASH_DURATION) {
      const flashPoint = this.flashTime - this.flashOffset
      ctx.translate(0, Math.sin(Math.PI * (flashPoint / FLASH_DURATION)) * -28)
    }
    

    if (this.isSelected) {
      if (game.getThing('ui').errorTime > 0) {
        ctx.filter = RED_ERROR;
      }
      else {
        ctx.filter = YELLOW_SELECTED;
      }

      if (game.getThing('ui').blockTime > 0) {
        const shake = game.getThing('ui').getBlockShake();
        ctx.translate(shake, 0);
      }
    }
    else if (this.isHighlighted || this.isBeingDragged) {
      ctx.filter = YELLOW_HIGHLIGHTED;
    }

    for (const char of this.word) {
      if (char === '_') {
        continue
      }
      const img = game.assets.images["letter_" + char]
      ctx.drawImage(img, 0, 0)
      ctx.translate(LETTER_SPACING, 0)
    }

    ctx.restore()
  }
}
