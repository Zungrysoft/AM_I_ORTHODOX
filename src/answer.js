import * as game from 'game'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { LETTER_SIZE, LETTER_SPACING, LINE_SPACING, SPACE_BETWEEN_WORDS } from './word.js'
import { BLUE_LOCKED, GREY_OBTAINED } from './colors.js'
import LockParticle from './lockparticle.js'

const LOCK_SPACING = 12

export default class Answer extends Thing {
  words = []
  wordLocks = []
  position = [0, 0]
  desiredPositon = [0, 0]
  donePosition = [0, 0]
  done = false
  isAnimating = false
  animationEvents = []
  animationTime = 0

  constructor(text, position) {
    super()

    const wordStr = text.split(" ")
    let pos = 0
    let line = 0
    for (let i = 0; i < wordStr.length; i ++) {
      let width = LETTER_SIZE + ((wordStr[i].length - 1) * LETTER_SPACING)
      if (pos + width > game.getWidth()) {
        pos = 0
        line ++
      }
      this.words.push({
        word: wordStr[i],
        locks: game.getThing('saveDataManager').wordLocksRemaining(wordStr[i]),
        position: [pos + width/2, line * LINE_SPACING],
        width: width,
      })
      pos += width + SPACE_BETWEEN_WORDS
    }
    this.desiredPosition = [...position]
    this.position = [
      game.getWidth() + 100,
      position[1],
    ]
    this.donePosition = [
      -game.getWidth(),
      position[1],
    ]

    const { progressed, unlocked } = game.getThing('saveDataManager').receivedAnswer(text)
    let animationTiming = 120
    for (let i = 0; i < this.words.length; i ++) {
      if (progressed.includes(this.words[i].word)) {
        this.animationEvents.push({
          type: "progress",
          time: animationTiming,
          index: i
        })
        animationTiming += 60
      }
      if (unlocked.includes(this.words[i].word)) {
        this.animationEvents.push({
          type: "unlock",
          time: animationTiming,
          index: i
        })
        animationTiming += 60
      }
    }
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

      this.animationTime ++

      if (this.animationEvents[0] && this.animationTime >= this.animationEvents[0].time) {
        const animEvent = this.animationEvents.shift()

        if (animEvent.type === "progress") {
          this.words[animEvent.index].locks --
          const pos = [100, 100]
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
        }
      }
    }
  }

  draw() {
    const { ctx } = game
    
    ctx.save()
    
    ctx.translate(...this.position)

    for (const word of this.words) {
      ctx.save()

      ctx.translate(...word.position)
      ctx.translate(-word.width/2, 0)

      const locksRemaining = word.locks
      ctx.filter = GREY_OBTAINED;
      if (locksRemaining) {
        ctx.filter = BLUE_LOCKED;

        ctx.save()

        ctx.translate(-LETTER_SPACING / 2, 10)
        for (let j = 0; j < locksRemaining; j ++) {
          ctx.drawImage(game.assets.images["ui_lock"], 0, 0)
          ctx.translate(LOCK_SPACING, 0)
        }

        ctx.restore()
      }

      for (const char of word.word) {
        const img = game.assets.images["letter_" + char]
        ctx.drawImage(img, 0, 0)
        ctx.translate(LETTER_SPACING, 0)
      }

      ctx.restore()
    }
    

    ctx.restore()
  }
}
