import * as game from 'game'
import Thing from 'thing'
import Word, { SPACE_BETWEEN_WORDS } from './word.js'

export default class SaveDataManager extends Thing {
  wordProgress = {}
  receivedAnswers = {}

  constructor() {
    super()

    game.setThingName(this, 'saveDataManager')

    this.wordProgress = game.assets.data.words

    for (const word in this.wordProgress) {
      if (this.wordProgress[word] === 0) {
        game.addThing(new Word(word, [
          Math.random() * game.getWidth() * 0.5 + game.getWidth() * 0.25,
          Math.random() * game.getHeight() * 0.25 + game.getWidth() * 0.125,
        ]))
      }
    }
  }

  isWordUnlocked(word) {
    return this.wordProgress[word] === 0
  }

  wordLocksRemaining(word) {
    return this.wordProgress[word]
  }

  receivedAnswer(answer) {
    if (this.receivedAnswers[answer]) {
      this.receivedAnswers[answer] ++
      return {
        progressed: [],
        unlocked: [],
        timesSeen: this.receivedAnswers[answer] 
      }
    }
    else {
      let ret = {
        progressed: [],
        unlocked: [],
        timesSeen: 1,
      }

      this.receivedAnswers[answer] = 1

      const words = answer.replaceAll(',', '').replaceAll('.', '').replaceAll('?', '').replaceAll('!', '').split(' ')
      for (const word of words) {
        if (this.wordProgress[word]) {
          this.wordProgress[word] -= 1
          ret.progressed.push(word)
          if (this.wordProgress[word] === 0) {
            ret.unlocked.push(word)
          }
        }
      }

      return ret
    }
  }

  update() {
  }
}
