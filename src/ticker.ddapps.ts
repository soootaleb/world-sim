
import { EWSMType, IWSMPayload } from "./messages.ddapps.ts";
import {
  IWSRequestPayload,
  IWSResponsePayload,
} from "./operations.ddapps.ts";
import { IWSState } from "./interface.ddapps.ts";
import { Messenger } from "ddapps/messenger.ts";
import { EMType } from "ddapps/messages.ts";
import { M } from "ddapps/type.ts";
import { WSTickedComponent } from "./ticked-component.ddapps.ts";
import { WSWorld } from "./world.ddapps.ts";
import { WSNumber } from "./models/models.mod.ts";
import { WSM } from "./type.ddapps.ts";

export class WSTicker extends Messenger<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload,
  IWSState
> {

  private iinterval = -1;

  private interval(): void {
    clearInterval(this.iinterval);
    this.iinterval = setInterval(() => {
      if (this.state.run) {
        this.tick(1);
      }
    }, WSNumber.of(1000).div(this.state.ticksPerSecond).val);
  }

  protected [EMType.InitialMessage](_message: M<EMType.InitialMessage>) {
    this.state.tick.set(0);
    this.interval();
  }

  private tick(count: number) {
    for (let index = 0; index < count; index++) {
      this.state.tick.inc;
      this.send(EWSMType.Tick, this.state.tick.f, WSTickedComponent);
      this.send(EWSMType.Tick, this.state.tick.f, WSWorld);
    }
  }

  protected [EWSMType.SendTick](message: WSM<EWSMType.SendTick>) {
    this.tick(message.payload);
  }

  protected [EWSMType.SetTicksFrequency](message: WSM<EWSMType.SendTick>) {
    this.state.ticksPerSecond.set(message.payload);
    this.interval();
  }

  public override shutdown() {
    super.shutdown();
    clearInterval(this.iinterval);
  }
}
