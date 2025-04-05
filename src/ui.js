import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import Word from './word.js'
import QuestionMark from './questionmark.js'
import Button from './button.js'

const SPACE_BETWEEN_WORDS = 20
const BUTTON_MARGIN = 42

export default class UI extends Thing {
  sprite = 'ui_background'
  pan = [0, 0]
  selectedWords = []
  wordBounds = [0, 0, game.getWidth(), game.getHeight() * 0.66]

  constructor() {
    super()

    game.setThingName(this, 'ui')

    game.addThing(new Word('where', [100, 100]))
    game.addThing(new Word('am', [300, 100]))
    game.addThing(new Word('i', [100, 200]))

    game.addThing(new QuestionMark([game.getWidth() / 2, game.getHeight() + 100]))
    
    const buttonHeightDisabled = game.getHeight() + 100
    const buttonHeightEnabled = game.getHeight() - BUTTON_MARGIN
    game.addThing(new Button(
      [BUTTON_MARGIN, buttonHeightDisabled],
      [BUTTON_MARGIN, buttonHeightEnabled],
      'ui_erase',
      'clearButton',
    ))
    game.addThing(new Button(
      [game.getWidth() - BUTTON_MARGIN - 64, buttonHeightDisabled],
      [game.getWidth() - BUTTON_MARGIN - 64, buttonHeightEnabled],
      'ui_send',
      'sendButton',
    ))
  }

  getAllWords() {
    return game.getThings().filter(x => x instanceof Word)
  }

  update() {
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
      word.isHighlighted = word === activeWord
    }

    if (activeWord) {
      if (game.mouse.leftClick) {
        activeWord.isBeingDragged = true
      }

      if (game.mouse.leftRelease && activeWord.isBeingDragged) {
        if (activeWord.dragTime < 15) {
          if (this.selectedWords.includes(activeWord)) {
            this.selectedWords = this.selectedWords.filter(x => x !== activeWord)
          }
          else {
            this.selectedWords.push(activeWord)
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
    if (clearButton.clicked) {
      this.selectedWords = []
    }
    if (sendButton.clicked) {
      console.log("SEND!")
    }
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
