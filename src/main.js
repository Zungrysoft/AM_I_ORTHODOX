import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as webgl from 'webgl'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import UI from './ui.js'
import SaveDataManager from './savedatamanager.js'
import MusicManager from './musicmanager.js'

document.title = 'AM I ORTHODOX?'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()
const { ctx } = game
ctx.save()
ctx.fillStyle = 'white'
ctx.font = 'italic bold 64px Arial'
ctx.fillText('Loading...', 64, game.getHeight() - 64)
ctx.restore()

game.assets.images = await game.loadImages({
  letter_0: 'images/letter_0.png',
  letter_1: 'images/letter_1.png',
  letter_2: 'images/letter_2.png',
  letter_3: 'images/letter_3.png',
  letter_4: 'images/letter_4.png',
  letter_5: 'images/letter_5.png',
  letter_6: 'images/letter_6.png',
  letter_7: 'images/letter_7.png',
  letter_8: 'images/letter_8.png',
  letter_9: 'images/letter_9.png',
  letter_a: 'images/letter_a.png',
  letter_b: 'images/letter_b.png',
  letter_c: 'images/letter_c.png',
  letter_d: 'images/letter_d.png',
  letter_e: 'images/letter_e.png',
  letter_f: 'images/letter_f.png',
  letter_g: 'images/letter_g.png',
  letter_h: 'images/letter_h.png',
  letter_i: 'images/letter_i.png',
  letter_j: 'images/letter_j.png',
  letter_k: 'images/letter_k.png',
  letter_l: 'images/letter_l.png',
  letter_m: 'images/letter_m.png',
  letter_n: 'images/letter_n.png',
  letter_o: 'images/letter_o.png',
  letter_p: 'images/letter_p.png',
  letter_q: 'images/letter_q.png',
  letter_r: 'images/letter_r.png',
  letter_s: 'images/letter_s.png',
  letter_t: 'images/letter_t.png',
  letter_u: 'images/letter_u.png',
  letter_v: 'images/letter_v.png',
  letter_w: 'images/letter_w.png',
  letter_x: 'images/letter_x.png',
  letter_y: 'images/letter_y.png',
  letter_z: 'images/letter_z.png',
  symbol_comma: 'images/symbol_comma.png',
  symbol_period: 'images/symbol_period.png',
  symbol_exclamation_point: 'images/symbol_exclamation_point.png',
  symbol_question_mark: 'images/symbol_question_mark.png',
  symbol_hyphen: 'images/symbol_hyphen.png',
  symbol_apostraphe: 'images/symbol_apostraphe.png',
  symbol_dollar_sign: 'images/symbol_dollar_sign.png',
  symbol_semicolon: 'images/symbol_semicolon.png',
  symbol_colon: 'images/symbol_colon.png',
  ui_background: 'images/ui_background.png',
  ui_send: 'images/ui_send.png',
  ui_erase: 'images/ui_erase.png',
  ui_lock: 'images/ui_lock.png',
  ui_lock_particle: 'images/ui_lock_particle.png',
  ui_success_particle: 'images/ui_success_particle.png',
  ui_smoke_particle: 'images/ui_smoke_particle.png',
})

game.assets.data = await game.loadJson({
  answers: 'data/answers.json',
  words: 'data/words.json',
  specialWords: 'data/specialwords.json',
})

game.assets.sounds = await game.loadAudio({
  click1: 'sounds/click1.wav',
  click2: 'sounds/click2.wav',
  swipe: 'sounds/swipe.wav',
  swoosh1: 'sounds/swoosh1.wav',
  discover: 'sounds/discover.wav',
  break2: 'sounds/break2.wav',
  impact1: 'sounds/impact1.wav',
  newword1: 'sounds/newword1.wav',
  newword2: 'sounds/newword2.wav',
  error: 'sounds/error.wav',
  block: 'sounds/block.wav',
  talk: 'sounds/talk.wav',

  music1: 'sounds/track1.flac',
  music2: 'sounds/track2.flac',
})
soundmanager.setSoundsTable(game.assets.sounds)



game.setScene(() => {
  game.addThing(new SaveDataManager())
  game.addThing(new UI())
  game.addThing(new MusicManager())
})
