import * as game from 'game'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'

const PHASE_CHANGE_DELAY = 3 * 60

export default class MusicManager extends Thing {
  curPhase = 0
  phaseChangeTimer = -1

  update() {
    const newPhase = game.getThing('saveDataManager').getGamePhase()
    console.log(newPhase)

    if (newPhase !== this.curPhase) {
      this.curPhase = newPhase
      this.phaseChangeTimer = PHASE_CHANGE_DELAY
    }

    if (this.phaseChangeTimer > 0) {
      this.phaseChangeTimer --
    }
    if (this.phaseChangeTimer === 0) {
      const musicName = 'music' + this.curPhase

      // Pause previous track
      if (this.oldMusicName) {
        game.assets.sounds[this.oldMusicName].pause()
      }
      this.oldMusicName = musicName

      soundmanager.playMusic(musicName, 0.4)
      this.phaseChangeTimer = -1
    }
  }
}
