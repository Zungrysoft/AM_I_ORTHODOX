import * as game from 'game'
import * as matrix from 'matrices'
import * as webgl from 'webgl'
import * as u from 'utils'

export function drawSprite({
  sprite,
  color = [1.0, 1.0, 1.0],
  alpha = 1.0,
  position = [0, 0],
  width = 32,
  height = 32,
  depth = 100,
  centered = false,
  rotation = 0,
} = {}) {
  webgl.setTexture(sprite)
  webgl.set('color', [...color, alpha])
  webgl.set('modelMatrix', matrix.getTransformation({
    position: [
      u.map(position[0] + (centered ? 0 : width/2), 0, game.getWidth(), -1, 1),
      u.map(position[1] + (centered ? 0 : height/2), 0, game.getHeight(), 1, -1),
      -depth,
    ],
    scale: [width / game.getWidth(), -height / game.getHeight(), 1.0],
    rotation: [0, rotation, 0],
  }))

  webgl.drawScreen()
}

export function drawBackground({
  sprite,
  color = [1.0, 1.0, 1.0],
  alpha = 1.0,
  depth = 2,
} = {}) {
  const dSprite = sprite ?? game.assets.textures.square;

  webgl.setTexture(dSprite)
  webgl.set('color', [...color, alpha])
  webgl.set('modelMatrix', matrix.getTransformation({
    position: [0, 0, -depth],
    scale: [1.0, -1.0, 1.0],
  }))

  webgl.drawScreen()
}