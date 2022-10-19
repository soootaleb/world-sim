
import { EWSMType, IWSMPayload } from "./messages.ddapps.ts";
import {
  EWSOpType,
  IWSRequestPayload,
  IWSResponsePayload,
} from "./operations.ddapps.ts";
import { IWSState } from "./interface.ddapps.ts";
import { Messenger } from "ddapps/messenger.ts";
import { EMType } from "ddapps/messages.ts";
import { M } from "ddapps/type.ts";
import { WSTTree } from "./ticked/tree.ticked.ts";
import { WSTWaterSource } from "./ticked/water-source.ticked.ts";
import { WSTickedComponent } from "./ticked-component.ddapps.ts";
import { WSM } from "./type.ddapps.ts";
import { WSApi } from "./api.ddapps.ts";
import { WSTLumberjack } from "./ticked/lumberjack.ticked.ts";
import { WSNumber } from "./models/models.mod.ts";
import { WSTExchange } from "./ticked/exchange.ticked.ts";

export class WSWorld extends Messenger<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload,
  IWSState
> {

  public static ENTITIES: {
    [key: string]: {
      type: { new(state: IWSState): WSTickedComponent },
      amount: WSNumber,
      delay?: WSNumber,
      max?: WSNumber
    }
  } = {
      exchange: { type: WSTExchange, amount: WSNumber.ONE },
      sources: { type: WSTWaterSource, amount: WSNumber.of(4) },
      trees: { type: WSTTree, amount: WSNumber.of(40) }, // [WARN] Add delay if sources are not created full , delay: WSTWaterSource.GROWTH_TICKS_CAP.f },
      jacks: {
        type: WSTLumberjack,
        amount: WSNumber.of(4),
        delay: WSNumber.of(400) // [FIXME] Should depend on state.baseTicksGrowth
      }
    }

  private create<T extends WSTickedComponent>(amount: WSNumber, type: (new (state: IWSState) => T), delay?: WSNumber): void {

    const limit = Object.values(WSWorld.ENTITIES)
      .find((entity) => entity.type === type)
      ?.max

    setTimeout(() => {
      for (let index = 0; index < amount.val; index++) {
        if (!limit || limit.sup(this.state.ticked.all(type).length)) {
          this.state.ticked.all(type).push(new type(this.state));
          this.sendLog(`WSWorld::Create::Success::${type.name}::#${index}`)
        } else {
          this.sendLog(`WSWorld::Create::Error::${type.name}::LimitReached`)
        }
      }
    }, delay ? delay.mul(1000).div(this.state.ticksPerSecond).val : 0);
  }

  protected [EWSMType.Tick](message: WSM<EWSMType.Tick>) {
    const waters = this.state.ticked.all(WSTWaterSource);
    const trees = this.state.ticked.all(WSTTree);
    const jacks = this.state.ticked.all(WSTLumberjack).filter((j) => j.adult);

    const tick = message.payload.f;

    waters.forEach((w) => this.state.sim.details[`water-${w.id}`] = w.tickLogInfos["water"].round.val);
    trees.forEach((t) => this.state.sim.details[`tree-${t.id}`] = t.tickLogInfos["wood"].round.val);

    this.state.sim.sum = {
      "water-water": Math.round(waters.map(ws => ws.tickLogInfos.water).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val),
      "water-relage": waters.reduce((acc, curr) => acc.add(curr.relativeAge), WSNumber.ZERO).mul(100).round.val,
      "trees-wood": trees.map(o => o.tickLogInfos.wood).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
      "trees-fruits": trees.map(o => o.tickLogInfos.fruits).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
      "jacks-wood": jacks.map(o => o.tickLogInfos.wood).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
      "jacks-fruits": jacks.map(o => o.tickLogInfos.fruits).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
      "jacks-water": jacks.map(o => o.tickLogInfos.water).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
      "jacks-hunger": jacks.map(o => o.tickLogInfos.hunger).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
      "jacks-thirst": jacks.map(o => o.tickLogInfos.thirst).reduce((prev, curr) => prev.add(curr), WSNumber.ZERO).round.val,
    }

    const lifeRelSum = jacks
      .filter((jack) => jack.adult)
      .map(o => o.tickLogInfos.relativeLife)
      .reduce((prev, curr) => prev.add(curr), WSNumber.ZERO)
      .mul(100)
      .val

    const adults = trees.filter((tree) => tree.adult)

    this.state.sim.avg = {
      "water-relage": Math.round(this.state.sim.sum["water-relage"] / waters.length),
      "trees-rprprob": adults.reduce((acc, curr) => acc.add(curr.tickLogInfos.rprprob), WSNumber.ZERO).div(adults.length).mul(100).round.val,
      "trees-water-abundance": adults.reduce((acc, curr) => acc.add(curr.waterAbundance(tick)), WSNumber.ZERO).div(adults.length).mul(100).round.val,
      "trees-fruits-saturation": adults.reduce((acc, curr) => acc.add(curr.fruitsSaturation), WSNumber.ZERO).div(adults.length).mul(100).round.val,
      "trees-relage": trees[0]?.relativeAge.f.mul(100).round.val || 0,
      "trees-wood": Math.round(this.state.sim.sum["trees-wood"] / trees.length),
      "jacks-fruits-abundance": jacks[0]?.fruitsAbundance(message.payload).mul(100).round.val,
      "jacks-water-abundance": jacks[0]?.waterAbundance(message.payload).mul(100).round.val,
      "jacks-fruits": Math.round(this.state.sim.sum["jacks-fruits"] / jacks.length),
      "jacks-water": Math.round(this.state.sim.sum["jacks-water"] / jacks.length),
      "jacks-wood": Math.round(this.state.sim.sum["jacks-wood"] / jacks.length),
      "jacks-rprprob": jacks.filter((jack) => jack.canReproduce(message.payload)).reduce((acc, curr) => acc.add(curr.tickLogInfos.rprprob), WSNumber.ZERO).div(jacks.length).mul(100).round.val,
      "jacks-hunger": Math.round(this.state.sim.sum["jacks-hunger"] * 100 / jacks.length),
      "jacks-thirst": Math.round(this.state.sim.sum["jacks-thirst"] * 100 / jacks.length),
      "jacks-rellife": Math.round(lifeRelSum / jacks.length),
      "exchange-qty": this.state.exchange.bids.length - this.state.exchange.asks.length
    }

    this.state.sim.qty = {
      "water": waters.length,
      "trees": trees.length,
      "jacks": jacks.length
    }

    for (const watcher of this.state.watchers) {
      this.send(EMType.ClientNotification, {
        token: watcher.token,
        type: EWSOpType.GetState,
        payload: {
          tick: message.payload.val,
          tf: this.state.ticksPerSecond.val,
          state: this.state.sim
        },
        timestamp: Date.now()
      }, watcher.source)
    }
  }

  protected override[EMType.InitialMessage](_message: M<EMType.InitialMessage>) {
    for (const key in WSWorld.ENTITIES) {
      const amount = WSNumber.of(this.state.ticked.all(WSWorld.ENTITIES[key].type).length);
      this.state.ticked.del(WSWorld.ENTITIES[key].type, amount);
    }

    for (const key in WSWorld.ENTITIES) {
      this.create(WSWorld.ENTITIES[key].amount, WSWorld.ENTITIES[key].type, WSWorld.ENTITIES[key].delay);
    }

    if (this.args.run) {
      this.state.run = true;
    }
  }

  protected [EWSMType.Chop](message: WSM<EWSMType.Chop>) {
    const ticked = this.state.ticked
      .all(WSTTree)
      .find((ticked) => ticked.id.startsWith(message.payload));

    if (ticked) {
      const choped = ticked.chop();
      this.response(EWSOpType.Chop, choped.val);
    } else {
      this.sendLog(`WSWorld::Chop::Error::EntityNotFound::${message.payload}`)
      this.response(EWSOpType.EntityNotFound, message.payload)
    }
  }

  protected [EWSMType.Dead](message: WSM<EWSMType.Dead>) {
    const type = this.state.ticked.remove(message.payload);

    if (type) {
      this.sendLog(`WSWorld::Dead::${type.name}::${message.payload}`)
    } else {
      this.sendLog(`WSWorld::Dead::Error::NotFound::${message.payload}`)
    }
  }

  protected [EWSMType.Create](message: WSM<EWSMType.Create>) {

    const type = WSApi.TYPES_MAP[message.payload.type];

    if (type) {
      this.create(message.payload.amount, type)
      if (message.source === WSApi.name) this.response(EWSOpType.Create, [])
    } else if (message.source === WSApi.name) {
      this.response(EWSOpType.CreateError, `WSWorld::Create::Error::InvalidObjectType::${message.payload.type}`)
    } else {
      this.sendLog(`WSWorld::Create::Error::InvalidObjectType::${message.payload.type}`)
    }
  }

  protected [EWSMType.Delete](message: WSM<EWSMType.Create>) {

    const type = WSApi.TYPES_MAP[message.payload.type];

    if (type) {
      this.state.ticked.del(type, message.payload.amount)
      if (message.source === WSApi.name) this.response(EWSOpType.Delete, null)
    } else if (message.source === WSApi.name) {
      this.response(EWSOpType.DeleteError, `WSWorld::Delete::InvalidObjectType::${message.payload.type}`)
    } else {
      this.sendLog(`WSWorld::Delete::InvalidObjectType::${message.payload.type}`)
    }
  }
}
