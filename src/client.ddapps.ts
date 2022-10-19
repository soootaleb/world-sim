
import { Client } from "ddapps/client.ts";
import { EMType } from "ddapps/messages.ts";
import { EOpType } from "ddapps/operation.ts";
import { IWSMPayload } from "./messages.ddapps.ts";
import {
  EWSOpType,
  IWSRequestPayload,
  IWSResponsePayload,
} from "./operations.ddapps.ts";
import { WSM } from "./type.ddapps.ts";

export class WSClient extends Client<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload
> {

  private trc = "";

  constructor(
    addr: string = Client.DEFAULT_SERVER_ADDR,
    port: number = Client.DEFAULT_SERVER_PORT,
    trace = false
  ) {
    super(addr, port, trace);

    if (trace) {
      this.listen(EOpType.Trace, (message) => {
        this.trc += message.payload.payload + " -> "
        console.clear();
        console.log("[Trace]", this.trc)
      })
    }
  }

  protected override [EMType.ClientResponse](message: WSM<EMType.ClientResponse>) {
    super.ClientResponse(message);
    if (this.trc.length) {
      console.clear();
      console.log("[Trace]", this.trc + "Client")
    }
  }

  public run(yes?: boolean) {
    return this.send(EWSOpType.Run, yes === undefined ? null : yes);
  }

  public throw(message: string) {
    return this.send(EWSOpType.Throw, message);
  }

  public reset() {
    return this.send(EWSOpType.Reset, null);
  }

  public stfrequency(v: number) {
    return this.send(EWSOpType.SetTicksFrequency, v);
  }

  public chop(tree: string) {
    return this.send(EWSOpType.Chop, tree);
  }

  public create(type: string, amount = 1) {
    return this.send(EWSOpType.Create, {
      type: type,
      amount: amount
    });
  }

  public delete(type: string, amount = 1) {
    return this.send(EWSOpType.Delete, {
      type: type,
      amount: amount
    });
  }
  
  public watch() {
    return this.send(EWSOpType.GetState, null);
  }
  
  public unwatch() {
    return this.send(EWSOpType.UnGetState, null);
  }
  
  public tick(amount: number) {
    return this.send(EWSOpType.Tick, amount);
  }
  
  public config(type: string, param: string, value: number, prop = 1) {
    return this.send(EWSOpType.Config, { type, param, value, prop });
  }
  
  public ask(resource: 'wood' | 'water' | 'fruit', price: number, amount: number) {
    return this.send(EWSOpType.CreateAsk, { resource, price, amount });
  }
  
  public bid(resource: 'wood' | 'water' | 'fruit', price: number, amount: number) {
    return this.send(EWSOpType.CreateBid, { resource, price, amount });
  }
}
