import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import Word, { SPACE_BETWEEN_WORDS } from './word.js'
import QuestionMark from './questionmark.js'
import Button from './button.js'
import Answer from './answer.js'

const BUTTON_MARGIN = 10
const ERROR_DURATION = 25
const BLOCK_DURATION = 15
const MAX_WORDS = 5

export default class UI extends Thing {
  sprite = 'ui_background'
  pan = [0, 0]
  selectedWords = []
  wordBounds = [0, 0, game.getWidth(), game.getHeight() * 0.55]
  errorTime = 0
  blockTime = 0

  constructor() {
    super()

    game.setThingName(this, 'ui')

    game.addThing(new QuestionMark([game.getWidth() / 2, game.getHeight() + 100]))
    
    const buttonHeightDisabled = game.getHeight() + 100
    const buttonHeightEnabled = game.getHeight() - 32 - BUTTON_MARGIN
    game.addThing(new Button(
      [32 + BUTTON_MARGIN, buttonHeightDisabled],
      [32 + BUTTON_MARGIN, buttonHeightEnabled],
      'ui_erase',
      'clearButton',
    ))
    game.addThing(new Button(
      [game.getWidth() - 64 - BUTTON_MARGIN, buttonHeightDisabled],
      [game.getWidth() - 64 - BUTTON_MARGIN, buttonHeightEnabled],
      'ui_send',
      'sendButton',
      [128, 64]
    ))
  }

  getAllWords() {
    return game.getThings().filter(x => x instanceof Word)
  }

  update() {
    this.errorTime --
    this.blockTime --

    const allowActions = !game.getThings().some(x => x instanceof Answer && x.animationEvents.length > 0)

    // Figure out which word the user should be acting on
    let activeWord = null
    for (const word of this.getAllWords()) {
      if (word.isBeingDragged) {
        activeWord = word
        break
      }
    }
    if (!activeWord) {
      for (const word of this.getAllWords()) {
        if (u.pointInsideAabb(...game.mouse.position, word.getAabb())) {
          activeWord = word
          break
        }
      }
    }

    // Update isHighlighted status for all words
    for (const word of this.getAllWords()) {
      const shouldBeHighlighted = word === activeWord
      if (!word.isHighlighted && shouldBeHighlighted && !word.isSelected) {
        soundmanager.playSound('click1', 0.05, 1.8)
      }
      word.isHighlighted = shouldBeHighlighted
    }

    if (activeWord) {
      if (game.mouse.leftClick) {
        activeWord.isBeingDragged = true
      }

      if (game.mouse.leftRelease && activeWord.isBeingDragged) {
        if (activeWord.dragTime < 15 && allowActions) {
          if (this.selectedWords.includes(activeWord)) {
            this.selectedWords = this.selectedWords.filter(x => x !== activeWord)
            soundmanager.playSound('swipe', 0.9, 0.6)
          }
          else {
            if (this.selectedWords.length >= MAX_WORDS) {
              soundmanager.playSound('block', 0.9, 1.0)
              this.blockTime = BLOCK_DURATION
            }
            else {
              this.selectedWords.push(activeWord)
              soundmanager.playSound('swipe', 0.9, 1.0)
              soundmanager.playSound('click1', 0.2, [0.6, 0.8])
            }
          }
        }
      }

      if (!game.mouse.leftButton) {
        activeWord.isBeingDragged = false
      }
    }


    // Set isSelected status of words
    for (const word of this.getAllWords()) {
      word.isSelected = false
    }
    for (const word of this.selectedWords) {
      word.isSelected = true
    }

    // Move selected words into place
    let questionMark = game.getThing('questionMark')
    if (this.selectedWords.length > 0) {
      questionMark.isSelected = true

      let selectedWordsExtended = [...this.selectedWords, questionMark]

      let totalWidth = (selectedWordsExtended.length - 1) * SPACE_BETWEEN_WORDS
      for (const word of selectedWordsExtended) {
        totalWidth += word.getSize()[0]
      }
      let curPosition = 0
      for (const word of selectedWordsExtended) {
        word.selectedPosition[1] = game.getHeight() - 40
        word.selectedPosition[0] = game.getWidth() / 2
        word.selectedPosition[0] += (-totalWidth / 2) + (word.getSize()[0] / 2) + curPosition
        curPosition += word.getSize()[0] + SPACE_BETWEEN_WORDS
      }
    }
    else {
      questionMark.isSelected = false
    }

    // Handle buttons
    const clearButton = game.getThing('clearButton')
    const sendButton = game.getThing('sendButton')
    clearButton.enabled = this.selectedWords.length > 0
    sendButton.enabled = this.selectedWords.length > 0
    clearButton.greyedOut = !allowActions
    sendButton.greyedOut = !allowActions
    if (clearButton.clicked && allowActions) {
      this.selectedWords = []
      soundmanager.playSound('swipe', 0.9, 0.6)
    }
    if (sendButton.clicked && allowActions) {
      const questionText = this.selectedWords.map(x => x.word).join(' ')
      const answerText = game.assets.data.answers[questionText] ?? null
      if (answerText) {
        for (const answer of game.getThings().filter(x => x instanceof Answer)) {
          answer.done = true
        }
        game.addThing(new Answer(answerText, [10, game.getHeight() * 0.62]))
      }
      else {
        this.errorTime = ERROR_DURATION
        this.blockTime = ERROR_DURATION
        soundmanager.playSound('error', 0.9, 0.8)
      }
    }
  }

  getBlockShake() {
    if (this.blockTime < 0) {
      return 0;
    }
    return (this.blockTime / ERROR_DURATION) * 10 * Math.sin(this.blockTime / 1.4)
  }

  preDraw() {
    const { ctx } = game

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.fillRect(0, 0, game.getWidth(), game.getHeight())

    const img = game.assets.images.ui_background
    ctx.drawImage(img, 0, 0)

    ctx.restore()
  }
}
