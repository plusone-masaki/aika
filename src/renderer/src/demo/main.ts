/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppDelegate } from './lappdelegate';

/**
 * ブラウザロード後の処理
 */
export default (canvas: HTMLCanvasElement) => {
  /**
   * 終了時の処理
   */
  window.onbeforeunload = (): void => LAppDelegate.releaseInstance();

  /**
   * Process when changing screen size.
   */
  canvas.onresize = () => {
    LAppDelegate.getInstance().onResize();
  };

  // create the application instance
  if (!LAppDelegate.getInstance().initialize(canvas)) {
    throw new Error('Live2D initialize failed.')
  }

  LAppDelegate.getInstance().run();
}
