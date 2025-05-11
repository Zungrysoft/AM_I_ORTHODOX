import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import * as soundmanager from 'soundmanager'
import * as matrix from 'matrices'
import * as webgl from 'webgl'
import Thing from 'thing'
import Word, { WORD_SPACING } from './word.js'
import QuestionMark from './questionmark.js'
import Button from './button.js'
import Answer from './answer.js'
import { GREY_OBTAINED } from './colors.js'
import Credits from './credits.js'
import { drawBackground, drawSprite } from './draw.js'

const BUTTON_MARGIN = 10
const ERROR_DURATION = 25
const BLOCK_DURATION = 15
const MAX_WORDS = 5
const HINT_TIME = 60 * 60 * 2

export default class UI extends Thing {
  sprite = 'ui_background'
  pan = [0, 0]
  selectedWords = []
  wordBounds = [0, 0, game.getWidth(), game.getHeight() * 0.54]
  errorTime = 0
  blockTime = 0
  haveWordsChanged = true
  lastUnlockedWord = 0
  time = 0
  endingStage = 0
  endingTime = 0

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
      [32 + 64 + BUTTON_MARGIN*3, buttonHeightDisabled],
      [32 + 64 + BUTTON_MARGIN*3, buttonHeightEnabled],
      'ui_hint',
      'hintButton',
    ))
    game.addThing(new Button(
      [game.getWidth() - 64 - BUTTON_MARGIN, buttonHeightDisabled],
      [game.getWidth() - 64 - BUTTON_MARGIN, buttonHeightEnabled],
      'ui_send',
      'sendButton',
      [128, 64]
    ))

    game.getCamera3D().lookVector = [0, 0, -1];
    game.getCamera3D().upVector = [0, 1, 0];
    game.getCamera3D().near = 0.01;
    game.getCamera3D().isOrtho = true;
    game.getCamera3D().updateMatrices();
    game.getCamera3D().setUniforms();

  }

  getAllWords() {
    return game.getThings().filter(x => x instanceof Word)
  }

  update() {
    const saveDataManager = game.getThing('saveDataManager')

    this.errorTime --
    this.blockTime --
    this.time ++
    if (this.isInEnding) {
      this.endingTime ++
    }

    const currentlyAnimating = game.getThings().some(x => x instanceof Answer && x.animationPhase < 2)
    const allowActions = !game.getThings().some(x => x instanceof Answer && x.animationEvents.length > 0) && !this.lockActions
    const showHintButton = this.time - this.lastUnlockedWord > HINT_TIME && !this.isInEnding

    // Figure out which word the user should be acting on
    let activeWord = null
    if (!this.lockActions) {
      for (const word of this.getAllWords()) {
        if (word.isBeingDragged && !word.isDying) {
          activeWord = word
          break
        }
      }
      if (!activeWord && !(game.getThings().some(x => x instanceof Button && x.isHighlighted))) {
        for (const word of this.getAllWords()) {
          if (u.pointInsideAabb(...game.mouse.position, word.getAabb()) && !word.isDying) {
            activeWord = word
            break
          }
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
            this.haveWordsChanged = true
            soundmanager.playSound('swipe', 0.9, 0.6)
          }
          else {
            if (this.selectedWords.length >= MAX_WORDS) {
              soundmanager.playSound('block', 0.9, 1.0)
              this.blockTime = BLOCK_DURATION
            }
            else {
              this.selectedWords.push(activeWord)
              this.haveWordsChanged = true
              soundmanager.playSound('swipe', 0.7, 1.0)
              soundmanager.playSound('click2', 0.2, [0.6, 0.7])
              soundmanager.playSound('block', 0.15, 0.7)
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
      if (!this.isInEnding) {
        questionMark.isSelected = true
      }

      let selectedWordsExtended = [...this.selectedWords, questionMark]

      let totalWidth = (selectedWordsExtended.length - 1) * WORD_SPACING
      for (const word of selectedWordsExtended) {
        totalWidth += word.getSize()[0]
      }
      let curPosition = 0
      for (const word of selectedWordsExtended) {
        word.selectedPosition[1] = game.getHeight() - 40
        word.selectedPosition[0] = game.getWidth() / 2
        word.selectedPosition[0] += (-totalWidth / 2) + (word.getSize()[0] / 2) + curPosition
        curPosition += word.getSize()[0] + WORD_SPACING
      }
    }
    else {
      questionMark.isSelected = false
    }

    // Handle buttons
    const clearButton = game.getThing('clearButton')
    const sendButton = game.getThing('sendButton')
    const hintButton = game.getThing('hintButton')
    clearButton.enabled = this.selectedWords.length > 0
    sendButton.enabled = this.selectedWords.length > 0
    hintButton.enabled = showHintButton
    clearButton.greyedOut = !allowActions
    sendButton.greyedOut = !this.haveWordsChanged && !currentlyAnimating
    hintButton.greyedOut = !showHintButton
    if ((clearButton.clicked || game.keysPressed.KeyC) && allowActions && this.selectedWords.length > 0) {
      this.selectedWords = []
      this.haveWordsChanged = true
      soundmanager.playSound('swipe', 0.9, 0.6)
    }
    if ((sendButton.clicked || game.keysPressed.KeyS) && this.selectedWords.length > 0) {
      if (!currentlyAnimating) {
        if (allowActions) {
          const questionText = this.selectedWords.map(x => x.word).join(' ')
          let answerText = game.getThing('saveDataManager').answers[questionText] ?? null

          if (this.endingStage > 0 && this.endingStage < 7) {
            answerText = this.endingAnswerText(answerText, this.endingStage)
          }

          if (this.endingStage === 7) {
            this.endingSequence()
          }
          else if (answerText) {
            if (this.haveWordsChanged) {
              for (const answer of game.getThings().filter(x => x instanceof Answer)) {
                answer.done = true
              }

              game.addThing(new Answer(answerText, [10, game.getHeight() * 0.62]))
              this.haveWordsChanged = false

              saveDataManager.enableMusic()

              // Trigger game ending sequence
              if (answerText.includes('let this happen') && (!saveDataManager.didEnding)) {
                this.endingStage ++
              }

              // Trigger credits sequence
              if (this.endingStage === 100) {
                this.creditsSequence()
              }
            }
          }
          else {
            this.errorTime = ERROR_DURATION
            this.blockTime = ERROR_DURATION
            soundmanager.playSound('error', 0.9, 0.8)
          }
        }
      }
      else {
        game.getThings().filter(x => x instanceof Answer).forEach(x => x.skip())
      }
    }
    if (
      (hintButton.clicked && showHintButton) ||
      (game.keysDown.ShiftLeft && game.keysPressed.KeyH)
    ) {
      this.showHint(true)
    }

    if (this.endingTime === 60 * 5) {
      game.addThing(new Answer("will you be orthodox?", [10, game.getHeight() * 0.62]));
    }
    else if (this.endingTime === 60 * 8) {
      game.addThing(new Word("yes", [-64, game.getHeight() * 0.2]));
      game.addThing(new Word("no", [game.getWidth() + 64, game.getHeight() * 0.4]));
    }
  }

  endingSequence() {
    game.getThing('saveDataManager').advanceGamePhase(4);
    this.endingStage = 100;
    this.isInEnding = true
    this.selectedWords = []
    game.getThings().filter(x => x instanceof Answer).forEach(x => x.isDead = true)

    for (const word of game.getThings().filter(x => x instanceof Word)) {
      word.isDying = true
    }
  }

  endingAnswerText(text, count) {
    if (count === 4) {
      return "let this happen.";
    }
    if (count === 5) {
      return "let this happen, brother.";
    }
    if (count === 6) {
      return "just let this happen.";
    }
    
    let textToMutate = text
    while (!textToMutate || textToMutate.length < 50) {
      // If we're not given valid text to mutate, just pick an answer we've received already and mutate that.
      const receivedAnswers = game.getThing('saveDataManager').receivedAnswers;
      textToMutate = Object.keys(receivedAnswers)[Math.floor(Object.keys(receivedAnswers).length * Math.random())];
    }

    let addedCount = 0
    if (!textToMutate.includes("let this happen")) {
      const r2 = " let this happen."
      textToMutate = textToMutate.substring(0, textToMutate.length - r2.length) + r2;
      addedCount ++
    }

    const rep = " let this happen ";
    const midPoint = Math.floor(textToMutate.length * 0.6)

    const pos1 = Math.floor(u.map(Math.random(), 0, 1, midPoint, textToMutate.length - (rep.length * 2 + 1)));
    textToMutate = textToMutate.substring(0, pos1) + rep + textToMutate.substring(pos1 + rep.length)
    addedCount ++

    if (addedCount < count) {
      const pos2 = Math.floor(u.map(Math.random(), 0, 1, 5, midPoint - (rep.length)));
      textToMutate = textToMutate.substring(0, pos2) + rep + textToMutate.substring(pos2 + rep.length)
      addedCount ++
    }
    
    // Remove double spaces
    while (textToMutate.includes("  ")) {
      textToMutate = textToMutate.replaceAll("  ", " ")
    }

    return textToMutate;
  }

  creditsSequence() {
    game.addThing(new Credits())
    this.lockActions = true
  }

  showHint(apply=false) {
    if (this.isInEnding || this.endingStage) {
      return
    }

    const saveDataManager = game.getThing('saveDataManager')
    let hintWords = new Set(saveDataManager.getHintWords())

    for (const wordObject of game.getThings().filter(x => x instanceof Word)) {
      if (hintWords.has(wordObject.word)) {
        wordObject.isHint = true
      }
      else {
        wordObject.isHint = false
      }
    }

    this.lastUnlockedWord = this.time

    if (hintWords.size > 0) {
      soundmanager.playSound('hint', 0.8, 1.2)
    }

    if (apply) {
      const newSelectedWords = Array.from(hintWords).map(x => game.getThings().filter(w => w instanceof Word && w.word === x)[0])
      if (newSelectedWords.every(x => x)) {
        this.selectedWords = newSelectedWords
        this.haveWordsChanged = true
      }
      
    }
  }

  getBlockShake() {
    if (this.blockTime < 0) {
      return 0;
    }
    return (this.blockTime / ERROR_DURATION) * 10 * Math.sin(this.blockTime / 1.4)
  }

  draw() {
    const { ctx } = game

    // background
    drawBackground({ depth: 100000, color: [0.0, 0.0, 0.0] });

    // divider
    drawBackground({ sprite: game.assets.textures.ui_background, depth: 100000 - 1 });
    
  }
}
