import * as game from 'game'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'

const PHASE_CHANGE_DELAY = 3 * 60

export default class MusicManager extends Thing {
  curPhase = 0
  phaseChangeTimer = -1

  update() {

    if (game.keysPressed.KeyM) {
      this.isMusicMuted = !this.isMusicMuted
    }

    const newPhase = this.isMusicMuted ? 0 : game.getThing('saveDataManager').getGamePhase()

    if (newPhase !== this.curPhase) {
      this.curPhase = newPhase
      this.phaseChangeTimer = this.isMusicMuted ? 0 : PHASE_CHANGE_DELAY
    }

    if (this.phaseChangeTimer > 0) {
      this.phaseChangeTimer --
    }
    if (this.phaseChangeTimer === 0) {
      const musicName = 'music' + this.curPhase

      // Pause previous track
      if (this.oldMusicName) {
        game.assets.sounds[this.oldMusicName]?.pause()
      }
      this.oldMusicName = musicName

      if (this.curPhase > 0 && this.curPhase <= 3) {
        soundmanager.playMusic(musicName, 0.6)
      }
      this.phaseChangeTimer = -1
    }
  }
}
