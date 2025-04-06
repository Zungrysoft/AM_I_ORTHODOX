import * as game from 'game'
import Thing from 'thing'
import Word, { SPACE_BETWEEN_WORDS } from './word.js'

export default class SaveDataManager extends Thing {
  wordProgress = {}
  receivedAnswers = {}

  constructor() {
    super()

    game.setThingName(this, 'saveDataManager')

    this.readFromLocalStorage()

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

      this.writeToLocalStorage()

      return ret
    }
  }

  writeToLocalStorage() {
    localStorage.setItem('wordProgress', JSON.stringify(this.wordProgress));
    localStorage.setItem('receivedAnswers', JSON.stringify(this.receivedAnswers));
  }

  readFromLocalStorage() {
    const readWordProgress = JSON.parse(localStorage.getItem('wordProgress'));
    const readReceivedAnswers = JSON.parse(localStorage.getItem('receivedAnswers'));

    if (readWordProgress != null && readReceivedAnswers != null) {
      this.wordProgress = readWordProgress;
      this.receivedAnswers = readReceivedAnswers;
    }
    else {
      this.resetLocalStorage()
    }
  }

  resetLocalStorage() {
    this.wordProgress = game.assets.data.words
    for (const word in this.wordProgress) {
      this.wordProgress[word] = this.wordProgress[word].count
    }
    this.receivedAnswers = {}
  }

  update() {
    if (game.keysDown.ShiftLeft && game.keysPressed.KeyP) {
      localStorage.removeItem('wordProgress');
      localStorage.removeItem('receivedAnswers');
    }
    if (game.keysDown.ShiftLeft && game.keysPressed.KeyJ) {
      this.wordProgress = game.assets.data.words
      for (const word in this.wordProgress) {
        this.wordProgress[word] = 0
      }
      this.writeToLocalStorage()
    }
  }
}
