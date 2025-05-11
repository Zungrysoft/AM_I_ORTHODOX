import * as game from 'game'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { APOSTRAPHE_SPACING, LETTER_SIZE, LETTER_SPACING, LINE_SPACING, WORD_SPACING } from './word.js'
import { getLockedColor, GREEN_HINT, GREY_OBTAINED, RED_ERROR, WHITE, YELLOW_HIGHLIGHTED } from './colors.js'
import LockParticle from './lockparticle.js'
import Word from './word.js'
import ShineParticle from './shineparticle.js'
import { drawSprite } from './draw.js'

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
  depth = 3

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
        isEvil: game.getThing('ui').endingStage > 3,
      })
      knownWords[wordStr[i].word] = true
      pos += width
      if (wordStr[i].hasSpaceAfter) {
        pos += WORD_SPACING
      }
    }

    // Evil words
    for (let i = 0; i < this.words.length - 2; i ++) {
      if (
        this.words[i].word === "let" &&
        this.words[i+1].word === "this" &&
        this.words[i+2].word === "happen"
      ) {
        this.words[i].isEvil = true;
        this.words[i+1].isEvil = true;
        this.words[i+2].isEvil = true;
        this.preventSkipping = true
      }
    }

    this.preventSkipping = this.words.some(x => x.isEvil);

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
    const endingStage = game.getThing('ui').endingStage
    if ((timesSeen === 1 || endingStage > 0) && endingStage < 100) {
      soundmanager.playSound('discover', 0.8, 0.7)

      const wordObjects = game.getThing('ui').selectedWords
      for (let j = 0; j < wordObjects.length; j ++) {
        wordObjects[j].releaseSuccessParticles(j)
      }
    }
  }

  skip() {
    if (!this.preventSkipping) {
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
  }

  update() {
    if (this.done) {
      this.animationPhase = 1
      this.animationTime = 9999999999

      if (this.animationEvents.length === 0) {
        this.isDead = true
      }
    }

    // Rarity particles
    for (const word of this.words) {
      const wordRarity = game.assets.data.specialWords[word.word]
      if (word.hasLocks && wordRarity) {
        for (let i = 0; i < word.wordDisplay.length; i ++) {
          if (
            (wordRarity === 2 && Math.random() < 0.02) ||
            (wordRarity !== 2 && Math.random() < 0.004)
          ) {
            const particleOffset = [(Math.random() * 48) - 8, (Math.random() * 48) - 8];
            const particlePosition = vec2.add([(i * 26) - (word.width / 2), 0], vec2.add(word.position, this.position));
            game.addThing(new ShineParticle(vec2.add(particlePosition, particleOffset), wordRarity));
          }
        }
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

        if (this.talkPhase % 4 === 0 || (this.talkPhase % 4 === 2 && curWord.isEvil)) {
          soundmanager.playSound('talk', 0.2, 0.3)
          if (curWord.isEvil) {
            soundmanager.playSound('hate', 0.4, 0.6)
            soundmanager.playSound('hate2', 0.4, 1.0)
          }
        }
        this.talkPhase ++

        if (['.', '!', '?'].includes(writeChar)) {
          this.animationCharacterTime = 18
        }
        else if ([',', ':', ';'].includes(writeChar)) {
          this.animationCharacterTime = 12
        }
        else if (curWord.isEvil) {
          this.animationCharacterTime = 3
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
          const wordRarity = game.assets.data.specialWords[word.word]
          game.addThing(new LockParticle(pos, wordRarity))
          game.addThing(new LockParticle(pos, wordRarity))
          game.addThing(new LockParticle(pos, wordRarity))
          game.addThing(new LockParticle(pos, wordRarity))
          game.addThing(new LockParticle(pos, wordRarity))
          game.addThing(new LockParticle(pos, wordRarity))
          if (wordRarity === 2) {
            soundmanager.playSound('break2', 0.4, [1.3, 1.7])
            soundmanager.playSound('break5', 0.3, [1.2, 1.4])
            soundmanager.playSound('break5', 0.3, [0.6, 0.7])
          }
          else if (wordRarity) {
            soundmanager.playSound('break2', 0.4, [1.3, 1.7])
            soundmanager.playSound('break5', 0.3, [1.2, 1.4])
          }
          else {
            soundmanager.playSound('break2', 0.4, [1.4, 1.8])
          }
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
          const wordRarity = game.assets.data.specialWords[word.word]
          if (wordRarity === 2) {
            soundmanager.playSound('newword2', 0.4, 0.93333)
            soundmanager.playSound('newword3', 0.7, 1.1)
          }
          else if (wordRarity) {
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
    pos[0] += -LETTER_SPACING / 4
    pos[1] += 12
    return pos
  }

  draw() {
    if (this.done) {
      return
    }
    
    const answerPos = [...this.position];

    for (const word of this.words) {
      let wordPos = vec2.add(answerPos, vec2.add(word.position, [-word.width/2, 0]))
      let color = GREY_OBTAINED;

      const locksRemaining = word.locks
      if (word.hasLocks) {
        // Locked text color
        const wordRarity = game.assets.data.specialWords[word.word]
        color = getLockedColor(wordRarity);

        // Lock particles
        let locksToDisplay = 0
        if (word.wordDisplay.length === word.word.length) {
          locksToDisplay = locksRemaining
        }
        else if (word.wordDisplay.length > 0) {
          locksToDisplay = Math.min(Math.floor(word.wordDisplay.length * 3), locksRemaining)
        }

        for (let j = 0; j < locksToDisplay; j ++) {
          drawSprite({
            sprite: game.assets.textures.ui_lock,
            position: vec2.add(vec2.add(this.position, word.position), this.getLockPosition(word, j)),
            color: color,
            depth: this.depth,
          });
        }
      }
      if (word.isEvil) {
        color = RED_ERROR;
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
        const img = game.assets.textures[imgName]
        drawSprite({
          sprite: img,
          position: wordPos,
          color: color,
          depth: this.depth,
        });

        if (char === '\'') {
          wordPos[0] += APOSTRAPHE_SPACING;
        }
        else {
          wordPos[0] += LETTER_SPACING;
        }
      }
    }
  }
}
