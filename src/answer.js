import * as game from 'game'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { APOSTRAPHE_SPACING, LETTER_SIZE, LETTER_SPACING, LINE_SPACING, WORD_SPACING } from './word.js'
import { BLUE_LOCKED, GREY_OBTAINED, PINK_LOCKED } from './colors.js'
import LockParticle from './lockparticle.js'
import Word from './word.js'

const LOCK_SPACING = 8

export default class Answer extends Thing {
  words = []
  wordLocks = []
  position = [0, 0]
  done = false
  isAnimating = false
  animationCharacterTime = 0
  animationWord = 0
  animationCharacter = 0
  animationPhase = 0
  animationEvents = []
  animationTime = 0
  talkPhase = 0

  constructor(text, position) {
    super()

    const wordStrPunc = text.split(" ")
    let wordStr = []
    for (const wordPunc of wordStrPunc) {
      let start = 0
      let end = -1
      let hasSpaceAfter = true
      let endWord = null
      if (
        wordPunc.startsWith(',') ||
        wordPunc.startsWith('.') ||
        wordPunc.startsWith('?') ||
        wordPunc.startsWith('!')
      ) {
        start = 1
        wordStr.push({
          word: wordPunc[0],
          hasSpaceAfter: false,
        })
      }

      if (
        wordPunc.endsWith(',') ||
        wordPunc.endsWith('.') ||
        wordPunc.endsWith('?') ||
        wordPunc.endsWith('!')
      ) {
        end = -2
        hasSpaceAfter = false
        endWord = {
          word: wordPunc[wordPunc.length-1],
          hasSpaceAfter: true,
        }
      }
      
      wordStr.push({
        word: wordPunc.substring(start, wordPunc.length + 1 + end),
        hasSpaceAfter: hasSpaceAfter,
      })

      if (endWord) {
        wordStr.push(endWord)
      }
    }
    let pos = 0
    let line = 0
    let knownWords = {}
    for (let i = 0; i < wordStr.length; i ++) {
      let width = LETTER_SIZE + ((wordStr[i].word.length - 1) * LETTER_SPACING)
      if (pos + width > game.getWidth() - 20) {
        if (!([',', '.', '?', '!', ].includes(wordStr[i].word))) {
          pos = 0
          line ++
        }
      }
      const locksCount = game.getThing('saveDataManager').wordLocksRemaining(wordStr[i].word)

      this.words.push({
        word: wordStr[i].word,
        wordDisplay: "",
        locks: locksCount,
        hasLocks: knownWords[wordStr[i].word] ? false : !!locksCount,
        position: [pos + width/2, line * LINE_SPACING],
        width: width,
      })
      knownWords[wordStr[i].word] = true
      pos += width
      if (wordStr[i].hasSpaceAfter) {
        pos += WORD_SPACING
      }
    }
    this.position = [...position]

    const { progressed, unlocked, timesSeen } = game.getThing('saveDataManager').receivedAnswer(text)
    let animationTiming = 80
    for (let i = 0; i < this.words.length; i ++) {
      if (this.words[i].hasLocks) {
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
    }

    // Sound effect
    if (timesSeen === 1) {
      soundmanager.playSound('discover', 0.8, 0.7)
    }
  }

  skip() {
    if (this.animationPhase === 0) {
      this.animationPhase = 1
      
      for (const word of this.words) {
        word.wordDisplay = word.word
      }
    }
    else if (this.animationPhase === 1) {
      this.animationTime = this.animationEvents[0].time
    }
  }

  update() {
    if (this.done) {
      this.animationPhase = 1
      this.animationTime = 9999999999

      if (this.animationEvents.length === 0) {
        this.isDead = true
      }
    }

    if (this.animationPhase === 0) {
      this.animationCharacterTime --

      if (this.animationCharacterTime <= 0) {
        let curWord = this.words[this.animationWord]
        let writeChar = curWord.word[this.animationCharacter]

        curWord.wordDisplay += writeChar

        this.animationCharacter ++
        if (this.animationCharacter >= curWord.word.length) {
          this.animationCharacter = 0
          this.animationWord ++
          if (this.animationWord >= this.words.length) {
            this.animationPhase = 1
          }
        }

        if (this.talkPhase % 4 === 0) {
          soundmanager.playSound('talk', 0.2, 0.3)
        }
        this.talkPhase ++

        if (['.', '!', '?'].includes(writeChar)) {
          this.animationCharacterTime = 18
        }
        else if ([',', ':', ';'].includes(writeChar)) {
          this.animationCharacterTime = 12
        }
        else {
          this.animationCharacterTime = 1
        }
      }
    }
    else if (this.animationPhase === 1) {
      if (this.animationEvents.length === 0) {
        this.animationPhase = 2
      }

      this.animationTime ++

      if (this.animationEvents[0] && this.animationTime >= this.animationEvents[0].time) {
        const animEvent = this.animationEvents.shift()
        let word = this.words[animEvent.index]
  
        if (animEvent.type === "progress") {
          const pos = vec2.add(vec2.add(this.position, word.position), this.getLockPosition(word, word.locks))
          const isSpecial = game.assets.data.specialWords[word.word]
          game.addThing(new LockParticle(pos, isSpecial))
          game.addThing(new LockParticle(pos, isSpecial))
          game.addThing(new LockParticle(pos, isSpecial))
          game.addThing(new LockParticle(pos, isSpecial))
          game.addThing(new LockParticle(pos, isSpecial))
          game.addThing(new LockParticle(pos, isSpecial))
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
    pos[1] += 12
    return pos
  }

  draw() {
    const { ctx } = game

    if (this.done) {
      return
    }
    
    ctx.save()
    
    ctx.translate(...this.position)

    for (const word of this.words) {
      ctx.save()

      ctx.translate(...word.position)
      ctx.translate(-word.width/2, 0)

      const locksRemaining = word.locks
      ctx.filter = GREY_OBTAINED;
      if (word.hasLocks) {
        ctx.filter = game.assets.data.specialWords[word.word] ? PINK_LOCKED : BLUE_LOCKED;
        ctx.save()

        let locksToDisplay = 0
        if (word.wordDisplay.length === word.word.length) {
          locksToDisplay = locksRemaining
        }
        else if (word.wordDisplay.length > 0) {
          locksToDisplay = Math.min(Math.floor(word.wordDisplay.length * 3), locksRemaining)
        }

        ctx.translate(-LETTER_SPACING / 2, 12)
        for (let j = 0; j < locksToDisplay; j ++) {
          ctx.drawImage(game.assets.images["ui_lock"], 0, 0)
          ctx.translate(LOCK_SPACING, 0)
        }

        ctx.restore()
        
      }

      for (const char of word.wordDisplay) {
        if (char === '_') {
          continue
        }

        let imgName = 'letter_' + char
        if (char === ',') {
          imgName = 'symbol_comma'
        }
        else if (char === '.') {
          imgName = 'symbol_period'
        }
        else if (char === '?') {
          imgName = 'symbol_question_mark'
        }
        else if (char === '!') {
          imgName = 'symbol_exclamation_point'
        }
        else if (char === '-') {
          imgName = 'symbol_hyphen'
        }
        else if (char === '\'') {
          imgName = 'symbol_apostraphe'
        }
        else if (char === '$') {
          imgName = 'symbol_dollar_sign'
        }
        else if (char === ';') {
          imgName = 'symbol_semicolon'
        }
        else if (char === ':') {
          imgName = 'symbol_colon'
        }
        const img = game.assets.images[imgName]
        ctx.drawImage(img, 0, 0)

        if (char === '\'') {
          ctx.translate(APOSTRAPHE_SPACING, 0)
        }
        else {
          ctx.translate(LETTER_SPACING, 0)
        }
      }

      ctx.restore()
    }
    

    ctx.restore()
  }
}
