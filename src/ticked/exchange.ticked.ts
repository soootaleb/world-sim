import { EWSMType } from "../messages.ddapps.ts";
import { WSTickedComponent } from "../ticked-component.ddapps.ts";
import { WSM } from "../type.ddapps.ts";
import { IWSState } from "../interface.ddapps.ts";
import { WSTLumberjack } from "./lumberjack.ticked.ts";

export class WSTExchange extends WSTickedComponent {
  
  constructor(state: IWSState) {
    super(state);
  }

  public get tickLogInfos() {
    return {
      ...super.tickLogInfos
    }
  }

  protected override[EWSMType.Tick](message: WSM<EWSMType.Tick>) {
    super.Tick(message);

    this.state.exchange.asks.forEach((ask, index) => {
      const who = this.state.ticked.all(WSTLumberjack).find((jack) => jack.id === ask.who)

      if (who) {
        const ibid = this.state.exchange.bids.findIndex((bid) => {
          return bid.resource === ask.resource
              && bid.price.val === ask.price.val
              && this.state.ticked
                  .all(WSTLumberjack)
                  .find((jack) => jack.id === bid.who)
                  ?.spend(ask.price)
        })
  
        if (ibid > -1) {
          this.state.exchange.bids.splice(ibid, 1)
          this.state.exchange.asks.splice(index, 1)
  
          who.earn(ask.price)
        }
      } else {
        this.state.exchange.asks.splice(index, 1)
      }

    })

    this.state.exchange.bids.forEach((bid, index) => {
      const who = this.state.ticked.all(WSTLumberjack).find((jack) => jack.id === bid.who)

      if (who) {
        const iask = this.state.exchange.asks.findIndex((ask) => {
          return ask.resource === bid.resource
              && ask.price.val === bid.price.val
              && who.spend(ask.price)
        })

        
        if (iask > -1) {

          const ask = this.state.exchange.asks[iask]

          this.state.ticked
            .all(WSTLumberjack)
            .find((jack) => jack.id === ask.who)
            ?.earn(ask.price)

          this.state.exchange.bids.splice(index, 1)
          this.state.exchange.asks.splice(iask, 1)
  
        }
      } else {
        this.state.exchange.bids.splice(index, 1)
      }

    })
  }
  
  protected [EWSMType.Ask](message: WSM<EWSMType.Ask>) {
    this.state.exchange.asks.push(message.payload)
  }
  
  protected [EWSMType.Bid](message: WSM<EWSMType.Bid>) {
    this.state.exchange.bids.push(message.payload)
  }
}