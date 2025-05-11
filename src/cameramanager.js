import * as game from 'game'
import Thing from 'thing'

export default class CameraManager extends Thing {
  constructor() {
    super();

    game.getCamera3D().lookVector = [0, 0, -1];
    game.getCamera3D().upVector = [0, 1, 0];
    game.getCamera3D().near = 0.01;
    game.getCamera3D().isOrtho = true;
    game.getCamera3D().updateMatrices();
    game.getCamera3D().setUniforms();
  }
}
