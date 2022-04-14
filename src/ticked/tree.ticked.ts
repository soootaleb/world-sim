import { IWSState } from "../interface.ddapps.ts";
import { EWSMType } from "../messages.ddapps.ts";
import { WSFLogistic } from "../models/flogistic.model.ts";
import { WSNumber } from "../models/models.mod.ts";
import { WSTickedComponent } from "../ticked-component.ddapps.ts";
import { WSM } from "../type.ddapps.ts";
import { WSWorld } from "../world.ddapps.ts";
import { WSTWaterSource } from "./water-source.ticked.ts";


export class WSTTree extends WSTickedComponent {

  public static DEATH_LIMIT = WSNumber.of(0.1); // Minimal proportion the tree needs to not die
  public static MIN_HEALTHY_LIFE = WSNumber.of(0.2); // Minimal proportion the tree needs to not die

  public wood;
  public deathLimit;
  public baseFlrFactor;
  public baseReproductionFactor;
  public growthTicksCap;

  public health = WSNumber.random(0.2, 1.8); // Average health is 1
  public growth = this.lin(this.health, WSNumber.ZERO);

  public fruits = WSNumber.ZERO;
  public currentRprProb = WSNumber.ZERO;

  constructor(state: IWSState) {
    super(state);
    
    this.growthTicksCap = this.state.baseTicksGrowth.f.mul(2).mul(this.health);

    this.baseFlrFactor = this.defaults.baseFlrFactor;
    this.baseReproductionFactor = this.defaults.baseReproductionFactor;
    this.deathLimit = this.maxWood.f.mul(WSTTree.DEATH_LIMIT);
    this.wood = this.deathLimit.f.mul(1.1);
  }

  private get defaults() {
    return this.state.defaults.tree;
  }

  public override get tickLogInfos() {
    return {
      ...super.tickLogInfos,
      wood: this.wood.f,
      fruits: this.fruits.f,
      rprprob: this.currentRprProb
    }
  }

  public get relativeAge(): WSNumber {
    return this.wood.f.div(this.maxWood);
  }

  public get maxWood(): WSNumber {
    return this.growth.eval(this.growthTicksCap);
  }

  public get maxFruits(): WSNumber {
    return this.maxWood.f.square;
  }

  protected override get dead(): boolean {
    return this.wood.inf(this.deathLimit) || this.wood.supeq(this.maxWood);
  }

  private get healthy(): boolean {
    return this.wood.sup(WSTTree.MIN_HEALTHY_LIFE);
  }

  public get adult(): boolean {
    return this.relativeAge.sup(0.3);
  }

  public get fruitsSaturation(): WSNumber {
    return this.fruits.f.div(this.maxFruits);
  }

  public baseNeed(tick: WSNumber): WSNumber {
    return this.growth.delta(tick);
  }

  public waterAbundance(tick: WSNumber): WSNumber {
    const sources = this.state.ticked.all(WSTWaterSource);

    const total = sources.map((ws) => ws.tickLogInfos.water)
      .reduce((acc, curr) => acc.add(curr), WSNumber.ZERO);

    const needed = this.baseNeed(tick).mul(this.population.double)

    return WSNumber.ONE.sub(needed.div(total)).min(0);
  }

  private get population(): WSNumber {
    return WSNumber.of(this.state.ticked.all(WSTTree).length);
  }

  protected override[EWSMType.Tick](message: WSM<EWSMType.Tick>) {
    super.Tick(message);

    const tick = WSNumber.of(message.payload);

    const baseNeed = this.baseNeed(tick);
    let remainingNeed = baseNeed.f;

    const sources = this.state.ticked.all(WSTWaterSource)
    sources.sort((wsa, wsb) => wsb.tickLogInfos.water.f.sub(wsa.tickLogInfos.water).val) // Go for biggest source first
      .find((source) => {
        const sucked = source.suck(remainingNeed.f.div(sources.length));
        remainingNeed = remainingNeed.sub(sucked).min(0);
        return remainingNeed.neg;
      })

    const satisfaction = WSNumber.ONE.sub(remainingNeed.div(this.baseNeed(tick)));

    const waterGrowthFactor = satisfaction.f.sub(0.5).double;
    const growth = this.baseNeed(tick).mul(waterGrowthFactor);

    this.wood.add(growth).max(this.maxWood).min(0);

    // Loose fruits when need is not fullfiled
    if (growth.sneg) {
      this.fruits.add(growth).min(0);
    } else if (growth.spos && this.adult) {

      const rprcap = this.baseReproductionFactor.f
        .mul(this.health)
        .mul(this.waterAbundance(tick).pow(this.population))
        .mul(this.fruitsSaturation);

      this.currentRprProb.set(rprcap);

      if (this.healthy && WSNumber.random().inf(rprcap)) {
        this.send(EWSMType.Create, {
          type: "tree",
          amount: WSNumber.ONE
        }, WSWorld);
      }

      const flwcap = this.baseFlrFactor.f.mul(this.health);
      const flw = WSNumber.random().inf(flwcap)

      if (flw) {
        const ffruits = new WSFLogistic(this.maxFruits, WSNumber.ONE.half.half, this.health);
        const fruits = ffruits.eval(this.fruitsSaturation);
        this.fruits.set(fruits);
      }

    } else if (this.adult) {
      this.currentRprProb.set(0);
    }
  }

  public chop(amount: WSNumber = WSNumber.ONE): WSNumber {
    const choped = this.health.f.mul(amount).max(this.wood);
    this.wood.sub(choped);
    return choped;
  }

  public gather(amount: WSNumber = WSNumber.ONE): WSNumber {
    const gathered = this.health.f.mul(amount).max(this.fruits);
    this.fruits.sub(gathered);
    return gathered;
  }
}