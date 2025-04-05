import * as game from 'game'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { LETTER_SIZE, LETTER_SPACING, LINE_SPACING, SPACE_BETWEEN_WORDS } from './word.js'
import { BLUE_LOCKED, GREY_OBTAINED } from './colors.js'
import LockParticle from './lockparticle.js'
import Word from './word.js'

const LOCK_SPACING = 10

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
      const locksCount = game.getThing('saveDataManager').wordLocksRemaining(wordStr[i])
      this.words.push({
        word: wordStr[i],
        locks: locksCount,
        hasLocks: !!locksCount,
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

    const { progressed, unlocked, timesSeen } = game.getThing('saveDataManager').receivedAnswer(text)
    let animationTiming = 120
    for (let i = 0; i < this.words.length; i ++) {
      if (progressed.includes(this.words[i].word)) {
        this.animationEvents.push({
          type: "progress",
          time: animationTiming,
          index: i
        })
        animationTiming += 40
      }
      if (unlocked.includes(this.words[i].word)) {
        this.animationEvents.push({
          type: "unlock",
          time: animationTiming + 10,
          index: i
        })
        animationTiming += 60
      }
    }

    // Sound effect
    soundmanager.playSound('swoosh1', 0.6, 0.6)
    if (timesSeen === 1) {
      soundmanager.playSound('unlock', 0.4, 1.1)
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
        let word = this.words[animEvent.index]

        if (animEvent.type === "progress") {
          const pos = vec2.add(vec2.add(this.position, word.position), this.getLockPosition(word, word.locks))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          game.addThing(new LockParticle(pos))
          soundmanager.playSound('break2', 0.4, [1.4, 1.8])
          soundmanager.playSound('impact1', 0.4, 1.7)
          word.locks --
        }

        if (animEvent.type === "unlock") {
          const pos = vec2.add(this.position, word.position)
          game.addThing(new Word(word.word, pos, [
            Math.random() * game.getWidth() * 0.5 + game.getWidth() * 0.25,
            Math.random() * game.getHeight() * 0.25 + game.getWidth() * 0.125,
          ]))
          soundmanager.playSound('swipe', 0.9, 1.0)
          if (game.assets.data.specialWords[word.word]) {
            soundmanager.playSound('newword2', 0.4, 0.7)
          }
          else {
            soundmanager.playSound('newword1', 0.4, 0.9)
          }
          
          word.hasLocks = false
        }
      }
    }
  }

  getLockPosition(word, index) {
    let pos = [0, 0]
    pos[0] -= word.width/2
    pos[0] += (index - 1) * LOCK_SPACING
    pos[0] += -LETTER_SPACING / 2
    pos[1] += 10
    return pos
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
      if (word.hasLocks) {
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
