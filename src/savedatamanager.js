import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'
import * as soundmanager from 'soundmanager'
import Word from './word.js'

export default class SaveDataManager extends Thing {
  wordProgress = {}
  receivedAnswers = {}
  gamePhase = 1
  isMusicEnabled = false
  totalWords = 0

  constructor() {
    super()

    game.setThingName(this, 'saveDataManager')

    this.readFromLocalStorage()

    for (const word in this.wordProgress) {
      this.totalWords ++
      if (this.wordProgress[word] === 0) {
        game.addThing(new Word(word, [
          Math.random() * game.getWidth() * 0.8 + game.getWidth() * 0.1,
          Math.random() * game.getHeight() * 0.35 + game.getHeight() * 0.1,
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

  stripPunctuation(text) {
    return text.replaceAll(',', '').replaceAll('.', '').replaceAll('?', '').replaceAll('!', '')
  }

  receivedAnswer(answer) {
    if (this.receivedAnswers[answer]) {
      this.receivedAnswers[answer] ++
      this.checkAdvanceGamePhase()
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

      let words = this.stripPunctuation(answer).split(' ')
      let seenWords = {}
      for (const word of words) {
        // Only do each word once per response
        if (seenWords[word]) {
          continue
        }
        seenWords[word] = true

        if (this.wordProgress[word]) {
          this.wordProgress[word] -= 1
          ret.progressed.push(word)
          if (this.wordProgress[word] === 0) {
            ret.unlocked.push(word)

            
          }
        }
      }

      this.unHintAllWords()
      const ui = game.getThing('ui')
      ui.lastUnlockedWord = ui.time

      this.checkAdvanceGamePhase()

      this.writeToLocalStorage()

      return ret
    }
  }

  checkAdvanceGamePhase() {
    if (this.isWordUnlocked('hate') || this.isWordUnlocked('james')) {
      this.advanceGamePhase(2)
    }
    if (
      this.isWordUnlocked('deserve') ||
      this.isWordUnlocked('sedate') ||
      (this.isWordUnlocked('thought') && this.isWordUnlocked('reconstruction') && this.isWordUnlocked('trap'))
    ) {
      // this.advanceGamePhase(3)
    }
  }

  advanceGamePhase(phase) {
    if (phase > this.gamePhase) {
      this.gamePhase = phase
      this.writeToLocalStorage()
    }
  }

  getGamePhase() {
    return this.isMusicEnabled ? this.gamePhase : 0
  }

  enableMusic() {
    this.isMusicEnabled = true
  }

  getHintWords() {
    const answers = game.getThing('ui').answers
    let unlockedWords = new Set()
    let notUnlockedWords = new Set()
    for (const word in this.wordProgress) {
      if (this.wordProgress[word] === 0) {
        unlockedWords.add(word)
      }
      if (this.wordProgress[word] && this.wordProgress[word] > 0) {
        notUnlockedWords.add(word)
      }
    }
    const possibleHints = []

    // Iterate over all possible questions we could ask
    for (const question in answers) {
      if (!(answers[question] in this.receivedAnswers)) {
        const questionWords = this.stripPunctuation(question).split(" ")
        const wordSet = new Set(questionWords)

        // If the question is askable...
        if (wordSet.isSubsetOf(unlockedWords)) {
          const answerWords = this.stripPunctuation(answers[question]).split(" ")
          const answerSet = new Set(answerWords)

          // And if the answer has words we can make progress on...
          // Or if there are no words left to unlock...
          if (notUnlockedWords.size === 0 || answerSet.intersection(notUnlockedWords).size > 0) {
            // Add it to the list of possibilities
            possibleHints.push(wordSet)
          }
        }
      }
    }

    if (possibleHints.length === 0) {
      return []
    }
    else {
      return possibleHints[Math.floor(Math.random() * possibleHints.length)]
    }
  }

  unHintAllWords() {
    let didUnHint = false
    for (const wordObject of game.getThings().filter(x => x instanceof Word)) {
      if (wordObject.isHint) {
        wordObject.isHint = false
        didUnHint = true
      }
    }
    if (didUnHint) {
      soundmanager.playSound('hint', 0.8, 1.2)
    }
  }

  writeToLocalStorage() {
    localStorage.setItem('wordProgress', JSON.stringify(this.wordProgress));
    localStorage.setItem('receivedAnswers', JSON.stringify(this.receivedAnswers));
  }

  readFromLocalStorage() {
    const readWordProgress = JSON.parse(localStorage.getItem('wordProgress'));
    const readReceivedAnswers = JSON.parse(localStorage.getItem('receivedAnswers'));

    // Read from local storage
    if (readWordProgress != null && readReceivedAnswers != null) {
      this.wordProgress = readWordProgress;
      this.receivedAnswers = readReceivedAnswers;
    }
    // Default values
    else {
      this.wordProgress = game.assets.data.words
      for (const word in this.wordProgress) {
        this.wordProgress[word] = this.wordProgress[word].count
      }
      this.receivedAnswers = {}
    }

    this.checkAdvanceGamePhase()
  }

  update() {
    // Cheat/debug commands
    if (game.keysDown.ShiftLeft) {

      // Reset progress
      if (game.keysPressed.KeyP) {
        localStorage.removeItem('wordProgress');
        localStorage.removeItem('receivedAnswers');
      }

      // Cheat all words
      if (game.keysPressed.KeyJ) {
        this.wordProgress = game.assets.data.words
        for (const word in this.wordProgress) {
          this.wordProgress[word] = 0
        }
        this.writeToLocalStorage()
      }

      // List all possible words
      if (game.keysPressed.KeyL) {
        let wordList = []
        for (const word in this.wordProgress) {
          if (this.wordProgress[word] === 0) {
            wordList.push(word)
          }
        }
        const shuffledList = u.shuffle(wordList, Math.random)
        console.log(shuffledList.join("\n"))
      }

      // Run simulator
      if (game.keysPressed.KeyM) {
        const answers = game.getThing('ui').answers
        let wordCounts = {}
        Object.keys(game.assets.data.words).forEach(w => {
          wordCounts[w] = game.assets.data.words[w].count
        })
        let unlockedWords = new Set()
        let unlockedAnswers = new Set()
        for (const word in game.assets.data.words) {
          if (game.assets.data.words[word].count === 0) {
            unlockedWords.add(word)
          }
        }

        while (true) {
          let oldUnlockedWords = new Set(unlockedWords)
          let newAnswers = 0
          let newAnswersList = []
          for (const answer in answers) {
            if (!unlockedAnswers.has(answers[answer])) {
              const answerWords = this.stripPunctuation(answer).split(" ")
              const wordSet = new Set(answerWords)
              if (wordSet.isSubsetOf(oldUnlockedWords)) {
                // console.log(`asked "${answer}" and got "${answers[answer]}"`)
                unlockedAnswers.add(answers[answer])
                newAnswers ++
                newAnswersList.push(answer)
                const answerTextWords = this.stripPunctuation(answers[answer]).split(" ")
                for (const word of answerTextWords) {
                  if (wordCounts[word]) {
                    wordCounts[word] --
                    if (wordCounts[word] === 0) {
                      unlockedWords.add(word)
                      
                      // console.log(`word unlocked ${word}`)
                    }
                    else {
                      // console.log(`word progress ${word}: ${wordCounts[word]}`)
                    }
                  }
                }
              }
            }
          }
          
          console.log(`new answers found: ${newAnswers}`)
          for (const na of newAnswersList) {
            console.log("  " + na)
          }

          if (newAnswers === 0) {
            break
          }
        }

        const allWords = new Set(Object.keys(game.assets.data.words))
        let p1 = "Accessible words:\n"
        for (const word of unlockedWords) {
          p1 += "\n" + word
        }
        let p2 = "Inaccessible words:\n"
        for (const word of allWords.difference(unlockedWords)) {
          p2 += "\n" + word + ": " + wordCounts[word]
        }
        console.log(p1)
        console.log(p2)
      }
    }
  }
}
