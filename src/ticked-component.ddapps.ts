
import { EWSMType, IWSMPayload } from "./messages.ddapps.ts";
import {
  IWSRequestPayload,
  IWSResponsePayload,
} from "./operations.ddapps.ts";
import { IWSState } from "./interface.ddapps.ts";
import { Messenger } from "ddapps/messenger.ts";
import { WSWorld } from "./world.ddapps.ts";
import { WSFLin, WSNumber } from "./models/models.mod.ts";
import { WSM } from "./type.ddapps.ts";

export class WSTickedComponent extends Messenger<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload,
  IWSState
> {

  private _id = Math.random().toString(36).substring(2);

  public get tickLogInfos(): { [key: string]: number | boolean | string | WSNumber } {
    return {
      id: this._id
    };
  }

  public get id(): string {
    return this._id;
  }

  protected invertLog(tick: WSNumber): WSNumber {
    return WSNumber.of(Math.round(1 / Math.log(tick.f.inc.val)));
  }

  protected lin(x: WSNumber | number, y: WSNumber | number): WSFLin {
    return new WSFLin(x, y);
  }

  protected get dead(): boolean {
    return false;
  }

  protected [EWSMType.Tick](message: WSM<EWSMType.Tick>) {
    const infos = Object.entries(this.tickLogInfos)
      .map(([info, value]) => `${info}:${value}`)
      .filter(([info, _value]) => info !== "id")
      .join("::");
    if (this.state.log.debug) {
      this.sendLog(`${this.constructor.name.substring(0, 6)}::${this.id.substring(0, 3)}::Tick::${message.payload}::${infos}`)
    }
    if (this.dead) this.send(EWSMType.Dead, this.id, WSWorld)
  }
}
