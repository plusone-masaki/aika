/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

// @ts-ignore
// import _ from 'whatwg-fetch';

import { CubismDefaultParameterId } from '@framework/cubismdefaultparameterid';
import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import {
  BreathParameterData,
  CubismBreath
} from '@framework/effect/cubismbreath';
import { CubismEyeBlink } from '@framework/effect/cubismeyeblink';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';
import { CubismIdHandle } from '@framework/id/cubismid';
import { CubismFramework } from '@framework/live2dcubismframework';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismUserModel } from '@framework/model/cubismusermodel';
import {
  ACubismMotion,
  FinishedMotionCallback
} from '@framework/motion/acubismmotion';
import { CubismMotion } from '@framework/motion/cubismmotion';
import {
  CubismMotionQueueEntryHandle,
  InvalidMotionQueueEntryHandleValue
} from '@framework/motion/cubismmotionqueuemanager';
import { csmMap } from '@framework/type/csmmap';
import { csmRect } from '@framework/type/csmrectf';
import { csmString } from '@framework/type/csmstring';
import { csmVector } from '@framework/type/csmvector';
import { CubismLogError, CubismLogInfo } from '@framework/utils/cubismdebug';

import { canvas, frameBuffer, gl, LAppDelegate } from './lappdelegate';
import { LAppPal } from './lapppal';
import { TextureInfo } from './lapptexturemanager';
import { LAppWavFileHandler } from './lappwavfilehandler';

enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup
}

/**
 * ユーザーが実際に使用するモデルの実装クラス<br>
 * モデル生成、機能コンポーネント生成、更新処理とレンダリングの呼び出しを行う。
 */
export class LAppModel extends CubismUserModel {
  /**
   * model3.jsonが置かれたディレクトリとファイルパスからモデルを生成する
   * @param dir
   * @param fileName
   */
  public async loadAssets(dir: string, fileName: string): Promise<void> {
    this._modelHomeDir = dir;

    // ステートを更新
    this._state = LoadStep.LoadModel
    const model = await window.api.getModelData(dir, fileName)
    const arrayBuffer = await (new Blob([model])).arrayBuffer()
    const setting: ICubismModelSetting = new CubismModelSettingJson(
      arrayBuffer,
      arrayBuffer.byteLength
    )
    this._state = LoadStep.LoadModel
    this.setupModel(setting)

    // fetch(`${this._modelHomeDir}${fileName}`)
    //   .then(response => response.arrayBuffer())
    //   .then(arrayBuffer => {
    //     console.log('loadAssets: ', `${this._modelHomeDir}${fileName}`)
    //     const setting: ICubismModelSetting = new CubismModelSettingJson(
    //       arrayBuffer,
    //       arrayBuffer.byteLength
    //     );
    //
    //     // ステートを更新
    //     this._state = LoadStep.LoadModel;
    //
    //     // 結果を保存
    //     this.setupModel(setting);
    //   });
  }

  /**
   * model3.jsonからモデルを生成する。
   * model3.jsonの記述に従ってモデル生成、モーション、物理演算などのコンポーネント生成を行う。
   *
   * @param setting ICubismModelSettingのインスタンス
   */
  private async setupModel(setting: ICubismModelSetting): Promise<void> {
    this._updating = true;
    this._initialized = false;

    this._modelSetting = setting;

    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();

      this._state = LoadStep.WaitLoadModel;
      const model = await window.api.getModelData(this._modelHomeDir, modelFileName)
      const arrayBuffer = await (new Blob([model])).arrayBuffer()
      this.loadModel(arrayBuffer);
      this._state = LoadStep.LoadExpression;

      // callback
      await this.loadCubismExpression();
      await this.loadCubismPhysics();
      await this.loadCubismPose();
      await this.setupEyeBlink();
      await this.setupBreath();
      await this.loadUserData();
      await this.setupEyeBlinkIds();
      await this.setupLipSyncIds();
      await this.setupLayout();
      await this.loadCubismMotion();

      // fetch(`${this._modelHomeDir}${modelFileName}`)
      //   .then(response => response.arrayBuffer())
      //   .then(arrayBuffer => {
      //     console.log('MODEL FETCHED: ', `${this._modelHomeDir}${modelFileName}`, arrayBuffer)
      //     this.loadModel(arrayBuffer);
      //     this._state = LoadStep.LoadExpression;
      //
      //     // callback
      //     loadCubismExpression();
      //   });
      //
      // this._state = LoadStep.WaitLoadModel;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }
  }

  // Expression
  private async loadCubismExpression (): Promise<void> {
    const count: number = this._modelSetting.getExpressionCount();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const expressionName = this._modelSetting.getExpressionName(i);
        const expressionFileName =
          this._modelSetting.getExpressionFileName(i);

        this._state = LoadStep.WaitLoadExpression;
        const model = await window.api.getModelData(this._modelHomeDir, expressionFileName)
        const arrayBuffer = await (new Blob([model])).arrayBuffer()
        const motion: ACubismMotion = this.loadExpression(
          arrayBuffer,
          arrayBuffer.byteLength,
          expressionName
        );

        if (this._expressions.getValue(expressionName) != null) {
          ACubismMotion.delete(
            this._expressions.getValue(expressionName)
          );
          this._expressions.setValue(expressionName, null as any);
        }

        this._expressions.setValue(expressionName, motion);

        this._expressionCount++;

        // fetch(`${this._modelHomeDir}${expressionFileName}`)
        //   .then(response => response.arrayBuffer())
        //   .then(arrayBuffer => {
        //     const motion: ACubismMotion = this.loadExpression(
        //       arrayBuffer,
        //       arrayBuffer.byteLength,
        //       expressionName
        //     );
        //
        //     if (this._expressions.getValue(expressionName) != null) {
        //       ACubismMotion.delete(
        //         this._expressions.getValue(expressionName)
        //       );
        //       this._expressions.setValue(expressionName, null as any);
        //     }
        //
        //     this._expressions.setValue(expressionName, motion);
        //
        //     this._expressionCount++;
        //
        //     if (this._expressionCount >= count) {
        //       this._state = LoadStep.LoadPhysics;
        //
        //       // callback
        //       loadCubismPhysics();
        //     }
        //   });
      }
    }
    this._state = LoadStep.LoadPhysics;
  };

  // Physics
  private async loadCubismPhysics (): Promise<void> {
    if (this._modelSetting.getPhysicsFileName() != '') {
      const physicsFileName = this._modelSetting.getPhysicsFileName();

      this._state = LoadStep.WaitLoadPhysics;
      const model = await window.api.getModelData(this._modelHomeDir, physicsFileName)
      const arrayBuffer = await (new Blob([model])).arrayBuffer()
      this.loadPhysics(arrayBuffer, arrayBuffer.byteLength)

      // fetch(`${this._modelHomeDir}${physicsFileName}`)
      //   .then(response => response.arrayBuffer())
      //   .then(arrayBuffer => {
      //     this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);
      //
      //     this._state = LoadStep.LoadPose;
      //
      //     // callback
      //     loadCubismPose();
      //   });
      // this._state = LoadStep.WaitLoadPhysics;
    }
    this._state = LoadStep.LoadPose;
  }

  // Pose
  private async loadCubismPose (): Promise<void> {
    if (this._modelSetting.getPoseFileName() != '') {
      const poseFileName = this._modelSetting.getPoseFileName();

      this._state = LoadStep.WaitLoadPose;
      const model = await window.api.getModelData(this._modelHomeDir, poseFileName)
      const arrayBuffer = await (new Blob([model])).arrayBuffer()
      this.loadPose(arrayBuffer, arrayBuffer.byteLength);

      // fetch(`${this._modelHomeDir}${poseFileName}`)
      //   .then(response => response.arrayBuffer())
      //   .then(arrayBuffer => {
      //     this.loadPose(arrayBuffer, arrayBuffer.byteLength);
      //
      //     this._state = LoadStep.SetupEyeBlink;
      //
      //     // callback
      //     setupEyeBlink();
      //   });
      // this._state = LoadStep.WaitLoadPose;
    }
    this._state = LoadStep.SetupEyeBlink;
  }

  // EyeBlink
  private async setupEyeBlink (): Promise<void> {
    if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
      this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
    }
    this._state = LoadStep.SetupBreath;
  }

  // Breath
  private setupBreath (): void {
    this._breath = CubismBreath.create();

    const breathParameters: csmVector<BreathParameterData> = new csmVector();
    breathParameters.pushBack(
      new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5)
    );
    breathParameters.pushBack(
      new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5)
    );
    breathParameters.pushBack(
      new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5)
    );
    breathParameters.pushBack(
      new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5)
    );
    breathParameters.pushBack(
      new BreathParameterData(
        CubismFramework.getIdManager().getId(
          CubismDefaultParameterId.ParamBreath
        ),
        0.5,
        0.5,
        3.2345,
        1
      )
    );

    this._breath.setParameters(breathParameters);
    this._state = LoadStep.LoadUserData;
  };

  // UserData
  public async loadUserData (): Promise<void> {
    if (this._modelSetting.getUserDataFile() != '') {
      const userDataFile = this._modelSetting.getUserDataFile();

      this._state = LoadStep.WaitLoadUserData;
      const model = await window.api.getModelData(this._modelHomeDir, userDataFile)
      const arrayBuffer = await (new Blob([model])).arrayBuffer()
      super.loadUserData(arrayBuffer, arrayBuffer.byteLength);

      // fetch(`${this._modelHomeDir}${userDataFile}`)
      //   .then(response => response.arrayBuffer())
      //   .then(arrayBuffer => {
      //     super.loadUserData(arrayBuffer, arrayBuffer.byteLength);
      //
      //     this._state = LoadStep.SetupEyeBlinkIds;
      //
      //     // callback
      //     setupEyeBlinkIds();
      //   });
      //
      // this._state = LoadStep.WaitLoadUserData;
    }
    this._state = LoadStep.SetupEyeBlinkIds;
  }

  // EyeBlinkIds
  private setupEyeBlinkIds (): void {
    const eyeBlinkIdCount: number =
      this._modelSetting.getEyeBlinkParameterCount();

    for (let i = 0; i < eyeBlinkIdCount; ++i) {
      this._eyeBlinkIds.pushBack(
        this._modelSetting.getEyeBlinkParameterId(i)
      );
    }

    this._state = LoadStep.SetupLipSyncIds;
  }

  // LipSyncIds
  private setupLipSyncIds (): void {
    const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();

    for (let i = 0; i < lipSyncIdCount; ++i) {
      this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
    }
    this._state = LoadStep.SetupLayout;
  }

  // Layout
  private setupLayout (): void {
    const layout: csmMap<string, number> = new csmMap<string, number>();

    if (this._modelSetting == null || this._modelMatrix == null) {
      CubismLogError('Failed to setupLayout().');
      return;
    }

    this._modelSetting.getLayoutMap(layout);
    this._modelMatrix.setupFromLayout(layout);
    this._state = LoadStep.LoadMotion;
  }

  // Motion
  private async loadCubismMotion (): Promise<void> {
    this._state = LoadStep.WaitLoadMotion;
    this._model.saveParameters();
    this._allMotionCount = 0;
    this._motionCount = 0;
    const group: string[] = [];

    const motionGroupCount: number = this._modelSetting.getMotionGroupCount();
    console.log('motionGroupCount', motionGroupCount, group)

    // モーションの総数を求める
    for (let i = 0; i < motionGroupCount; i++) {
      group[i] = this._modelSetting.getMotionGroupName(i);
      this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
    }

    // モーションの読み込み
    for (let i = 0; i < motionGroupCount; i++) {
      await this.preLoadMotionGroup(group[i]);
    }

    // モーションがない場合
    if (motionGroupCount == 0) {
      this._state = LoadStep.LoadTexture;

      // 全てのモーションを停止する
      this._motionManager.stopAllMotions();

      this._updating = false;
      this._initialized = true;

      this.createRenderer();
      await this.setupTextures();
      this.getRenderer().startUp(gl);
    }
  }

  /**
   * テクスチャユニットにテクスチャをロードする
   */
  private async setupTextures(): Promise<void> {
    // iPhoneでのアルファ品質向上のためTypescriptではpremultipliedAlphaを採用
    const usePremultiply = true;

    if (this._state == LoadStep.LoadTexture) {
      // テクスチャ読み込み用
      const textureCount: number = this._modelSetting.getTextureCount();

      for (
        let modelTextureNumber = 0;
        modelTextureNumber < textureCount;
        modelTextureNumber++
      ) {
        // テクスチャ名が空文字だった場合はロード・バインド処理をスキップ
        if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
          console.log('getTextureFileName null');
          continue;
        }

        // WebGLのテクスチャユニットにテクスチャをロードする
        const texturePath =
          this._modelSetting.getTextureFileName(modelTextureNumber);
        // texturePath = this._modelHomeDir + texturePath;

        const textureImage = await window.api.getModelData(this._modelHomeDir, texturePath)
        const url = URL.createObjectURL(new Blob([textureImage]))

        // ロード完了時に呼び出すコールバック関数
        const onLoad = (textureInfo: TextureInfo): void => {
          this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);

          this._textureCount++;

          if (this._textureCount >= textureCount) {
            // ロード完了
            this._state = LoadStep.CompleteSetup;
          }
        };

        // 読み込み
        LAppDelegate.getInstance()
          .getTextureManager()
          .createTextureFromPngFile(url, usePremultiply, onLoad);
        this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
      }

      this._state = LoadStep.WaitLoadTexture;
    }
  }

  /**
   * レンダラを再構築する
   */
  public reloadRenderer(): void {
    this.deleteRenderer();
    this.createRenderer();
    this.setupTextures();
  }

  /**
   * 更新
   */
  public update(): void {
    if (this._state != LoadStep.CompleteSetup) return;

    const deltaTimeSeconds: number = LAppPal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    this._dragManager.update(deltaTimeSeconds);
    this._dragX = this._dragManager.getX();
    this._dragY = this._dragManager.getY();

    // モーションによるパラメータ更新の有無
    let motionUpdated = false;

    //--------------------------------------------------------------------------
    this._model.loadParameters(); // 前回セーブされた状態をロード
    if (this._motionManager.isFinished()) {
      // モーションの再生がない場合、待機モーションの中からランダムで再生する
      this.startRandomMotion(
        window.model.MOTION_GROUP_IDLE,
        window.model.PRIORITY_IDLE
      );
    } else {
      motionUpdated = this._motionManager.updateMotion(
        this._model,
        deltaTimeSeconds
      ); // モーションを更新
    }
    this._model.saveParameters(); // 状態を保存
    //--------------------------------------------------------------------------

    // まばたき
    if (!motionUpdated) {
      if (this._eyeBlink != null) {
        // メインモーションの更新がないとき
        this._eyeBlink.updateParameters(this._model, deltaTimeSeconds); // 目パチ
      }
    }

    if (this._expressionManager != null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 表情でパラメータ更新（相対変化）
    }

    // ドラッグによる変化
    // ドラッグによる顔の向きの調整
    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30); // -30から30の値を加える
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
    this._model.addParameterValueById(
      this._idParamAngleZ,
      this._dragX * this._dragY * -30
    );

    // ドラッグによる体の向きの調整
    this._model.addParameterValueById(
      this._idParamBodyAngleX,
      this._dragX * 10
    ); // -10から10の値を加える

    // ドラッグによる目の向きの調整
    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1から1の値を加える
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

    // 呼吸など
    if (this._breath != null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds);
    }

    // 物理演算の設定
    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    // リップシンクの設定
    if (this._lipsync) {
      let value = 0.0; // リアルタイムでリップシンクを行う場合、システムから音量を取得して、0~1の範囲で値を入力します。

      this._wavFileHandler.update(deltaTimeSeconds);
      value = this._wavFileHandler.getRms();

      for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
        this._model.addParameterValueById(this._lipSyncIds.at(i), value, 0.8);
      }
    }

    // ポーズの設定
    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }

    this._model.update();
  }

  /**
   * 引数で指定したモーションの再生を開始する
   * @param group モーショングループ名
   * @param no グループ内の番号
   * @param priority 優先度
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
   * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
   */
  public startMotion(
    group: string,
    no: number,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (priority == window.model.PRIORITY_FORCE) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        LAppPal.printMessage("[APP]can't start motion.");
      }
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);

    // ex) idle_0
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
    let autoDelete = false;

    if (motion == null) {
      window.api.getModelData(this._modelHomeDir, motionFileName)
        .then(async model => {
          const arrayBuffer = await (new Blob([model])).arrayBuffer()
          motion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            null as any,
            onFinishedMotionHandler
          );
          let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
            group,
            no
          );

          if (fadeTime >= 0.0) {
            motion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
          if (fadeTime >= 0.0) {
            motion.setFadeOutTime(fadeTime);
          }

          motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
          autoDelete = true; // 終了時にメモリから削除
        })

      // fetch(`${this._modelHomeDir}${motionFileName}`)
      //   .then(response => response.arrayBuffer())
      //   .then(arrayBuffer => {
      //     motion = this.loadMotion(
      //       arrayBuffer,
      //       arrayBuffer.byteLength,
      //       null as any,
      //       onFinishedMotionHandler
      //     );
      //     let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
      //       group,
      //       no
      //     );
      //
      //     if (fadeTime >= 0.0) {
      //       motion.setFadeInTime(fadeTime);
      //     }
      //
      //     fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
      //     if (fadeTime >= 0.0) {
      //       motion.setFadeOutTime(fadeTime);
      //     }
      //
      //     motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
      //     autoDelete = true; // 終了時にメモリから削除
      //   });
    } else {
      motion.setFinishedMotionHandler(onFinishedMotionHandler as any);
    }

    //voice
    const voice = this._modelSetting.getMotionSoundFileName(group, no);
    if (voice.localeCompare('') != 0) {
      let path = voice;
      path = this._modelHomeDir + path;
      this._wavFileHandler.start(path);
    }

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]start motion: [${group}_${no}`);
    }
    return this._motionManager.startMotionPriority(
      motion,
      autoDelete,
      priority
    );
  }

  /**
   * ランダムに選ばれたモーションの再生を開始する。
   * @param group モーショングループ名
   * @param priority 優先度
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
   * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
   */
  public startRandomMotion(
    group: string,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting.getMotionCount(group) == 0) {
      return InvalidMotionQueueEntryHandleValue;
    }

    const no: number = Math.floor(
      Math.random() * this._modelSetting.getMotionCount(group)
    );

    return this.startMotion(group, no, priority, onFinishedMotionHandler);
  }

  /**
   * 引数で指定した表情モーションをセットする
   *
   * @param expressionId 表情モーションのID
   */
  public setExpression(expressionId: string): void {
    const motion: ACubismMotion = this._expressions.getValue(expressionId);

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]expression: [${expressionId}]`);
    }

    if (motion != null) {
      this._expressionManager.startMotionPriority(
        motion,
        false,
        window.model.PRIORITY_FORCE,
      );
    } else {
      if (this._debugMode) {
        LAppPal.printMessage(`[APP]expression[${expressionId}] is null`);
      }
    }
  }

  /**
   * ランダムに選ばれた表情モーションをセットする
   */
  public setRandomExpression(): void {
    if (this._expressions.getSize() == 0) {
      return;
    }

    const no: number = Math.floor(Math.random() * this._expressions.getSize());

    for (let i = 0; i < this._expressions.getSize(); i++) {
      if (i == no) {
        const name: string = this._expressions._keyValues[i].first;
        this.setExpression(name);
        return;
      }
    }
  }

  /**
   * イベントの発火を受け取る
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0} is fired on LAppModel!!', eventValue.s);
  }

  /**
   * 当たり判定テスト
   * 指定ＩＤの頂点リストから矩形を計算し、座標をが矩形範囲内か判定する。
   *
   * @param hitArenaName  当たり判定をテストする対象のID
   * @param x             判定を行うX座標
   * @param y             判定を行うY座標
   */
  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    // 透明時は当たり判定無し。
    if (this._opacity < 1) {
      return false;
    }

    const count: number = this._modelSetting.getHitAreasCount();

    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }

    return false;
  }

  /**
   * モーションデータをグループ名から一括でロードする。
   * モーションデータの名前は内部でModelSettingから取得する。
   *
   * @param group モーションデータのグループ名
   */
  public async preLoadMotionGroup(group: string): Promise<void> {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i);

      // ex) idle_0
      const name = `${group}_${i}`;
      if (this._debugMode) {
        LAppPal.printMessage(
          `[APP]load motion: ${motionFileName} => [${name}]`
        );
      }

      const model = await window.api.getModelData(this._modelHomeDir, motionFileName)
      const arrayBuffer = await (new Blob([model])).arrayBuffer()
      const tmpMotion: CubismMotion = this.loadMotion(
        arrayBuffer,
        arrayBuffer.byteLength,
        name
      );

      let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
      if (fadeTime >= 0.0) {
        tmpMotion.setFadeInTime(fadeTime);
      }

      fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
      if (fadeTime >= 0.0) {
        tmpMotion.setFadeOutTime(fadeTime);
      }
      tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

      if (this._motions.getValue(name) != null) {
        ACubismMotion.delete(this._motions.getValue(name));
      }

      this._motions.setValue(name, tmpMotion);

      this._motionCount++;
      if (this._motionCount >= this._allMotionCount) {
        this._state = LoadStep.LoadTexture;

        // 全てのモーションを停止する
        this._motionManager.stopAllMotions();

        this._updating = false;
        this._initialized = true;

        this.createRenderer();
        await this.setupTextures();
        this.getRenderer().startUp(gl);
      }
      // fetch(`${this._modelHomeDir}${motionFileName}`)
      //   .then(response => response.arrayBuffer())
      //   .then(arrayBuffer => {
      //     const tmpMotion: CubismMotion = this.loadMotion(
      //       arrayBuffer,
      //       arrayBuffer.byteLength,
      //       name
      //     );
      //
      //     let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
      //     if (fadeTime >= 0.0) {
      //       tmpMotion.setFadeInTime(fadeTime);
      //     }
      //
      //     fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
      //     if (fadeTime >= 0.0) {
      //       tmpMotion.setFadeOutTime(fadeTime);
      //     }
      //     tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
      //
      //     if (this._motions.getValue(name) != null) {
      //       ACubismMotion.delete(this._motions.getValue(name));
      //     }
      //
      //     this._motions.setValue(name, tmpMotion);
      //
      //     this._motionCount++;
      //     if (this._motionCount >= this._allMotionCount) {
      //       this._state = LoadStep.LoadTexture;
      //
      //       // 全てのモーションを停止する
      //       this._motionManager.stopAllMotions();
      //
      //       this._updating = false;
      //       this._initialized = true;
      //
      //       this.createRenderer();
      //       this.setupTextures();
      //       this.getRenderer().startUp(gl);
      //     }
      //   });
    }
  }

  /**
   * すべてのモーションデータを解放する。
   */
  public releaseMotions(): void {
    this._motions.clear();
  }

  /**
   * 全ての表情データを解放する。
   */
  public releaseExpressions(): void {
    this._expressions.clear();
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   */
  public doDraw(): void {
    if (this._model == null) return;

    // キャンバスサイズを渡す
    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    this.getRenderer().setRenderState(frameBuffer, viewport);
    this.getRenderer().drawModel();
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   */
  public draw(matrix: CubismMatrix44): void {
    if (this._model == null) {
      return;
    }

    // 各読み込み終了後
    if (this._state == LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix);

      this.getRenderer().setMvpMatrix(matrix);

      this.doDraw();
    }
  }

  /**
   * コンストラクタ
   */
  public constructor() {
    super();

    this._modelSetting = null as any;
    this._modelHomeDir = null as any;
    this._userTimeSeconds = 0.0;

    this._eyeBlinkIds = new csmVector<CubismIdHandle>();
    this._lipSyncIds = new csmVector<CubismIdHandle>();

    this._motions = new csmMap<string, ACubismMotion>();
    this._expressions = new csmMap<string, ACubismMotion>();

    this._hitArea = new csmVector<csmRect>();
    this._userArea = new csmVector<csmRect>();

    this._idParamAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleX
    );
    this._idParamAngleY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleY
    );
    this._idParamAngleZ = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleZ
    );
    this._idParamEyeBallX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallX
    );
    this._idParamEyeBallY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallY
    );
    this._idParamBodyAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamBodyAngleX
    );

    this._state = LoadStep.LoadAssets;
    this._expressionCount = 0;
    this._textureCount = 0;
    this._motionCount = 0;
    this._allMotionCount = 0;
    this._wavFileHandler = new LAppWavFileHandler();
  }

  _modelSetting: ICubismModelSetting; // モデルセッティング情報
  _modelHomeDir: string; // モデルセッティングが置かれたディレクトリ
  _userTimeSeconds: number; // デルタ時間の積算値[秒]

  _eyeBlinkIds: csmVector<CubismIdHandle>; // モデルに設定された瞬き機能用パラメータID
  _lipSyncIds: csmVector<CubismIdHandle>; // モデルに設定されたリップシンク機能用パラメータID

  _motions: csmMap<string, ACubismMotion>; // 読み込まれているモーションのリスト
  _expressions: csmMap<string, ACubismMotion>; // 読み込まれている表情のリスト

  _hitArea: csmVector<csmRect>;
  _userArea: csmVector<csmRect>;

  _idParamAngleX: CubismIdHandle; // パラメータID: ParamAngleX
  _idParamAngleY: CubismIdHandle; // パラメータID: ParamAngleY
  _idParamAngleZ: CubismIdHandle; // パラメータID: ParamAngleZ
  _idParamEyeBallX: CubismIdHandle; // パラメータID: ParamEyeBallX
  _idParamEyeBallY: CubismIdHandle; // パラメータID: ParamEyeBAllY
  _idParamBodyAngleX: CubismIdHandle; // パラメータID: ParamBodyAngleX

  _state: number; // 現在のステータス管理用
  _expressionCount: number; // 表情データカウント
  _textureCount: number; // テクスチャカウント
  _motionCount: number; // モーションデータカウント
  _allMotionCount: number; // モーション総数
  _wavFileHandler: LAppWavFileHandler; //wavファイルハンドラ
}
