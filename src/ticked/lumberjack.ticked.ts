import { EWSMType } from "../messages.ddapps.ts";
import { WSTickedComponent } from "../ticked-component.ddapps.ts";
import { WSM } from "../type.ddapps.ts";
import { WSWorld } from "../world.ddapps.ts";
import { WSTTree } from "./tree.ticked.ts";
import { WSTWaterSource } from "./water-source.ticked.ts";
import { WSNumber } from "../models/models.mod.ts";
import { WSApi } from "../api.ddapps.ts";
import { IWSState } from "../interface.ddapps.ts";

export class WSTLumberjack extends WSTickedComponent {

  private static DEATH_LIMIT = WSNumber.of(0.1); // Minimal proportion the tree needs to not die
  
  private health = WSNumber.random(0.2, 1.8); // Average health is 1
  private lifeGrowth = this.lin(this.health, WSNumber.ZERO); // Growth of the LIFE, not the age (age is linear & static for all jacks)
  private reproductionLatency = WSNumber.of(10);
  
  private age = WSNumber.ZERO;

  private hunger = WSNumber.ZERO;
  private thirst = WSNumber.ZERO;
  
  private wood = WSNumber.ZERO;
  private water = WSNumber.ZERO;
  private fruits = WSNumber.ZERO;
  
  private currentRprProb = WSNumber.ZERO;
  private latestChild = WSNumber.ZERO;
  
  private deathLimit: WSNumber;
  private life: WSNumber;
  private growthTicksCap: WSNumber;
  private woodGatheringBaseFactor: WSNumber;
  private minHealthyLife: WSNumber;
  private baseReproductionFactor: WSNumber;
  private baseReproductionProbability: WSNumber;
  private baseReproductionMax: WSNumber;
  private woodAbundanceGatheringLimit: WSNumber;
  private fruitsAbundanceOverGatheringLimit: WSNumber;
  private waterAbundanceOverRefillingLimit: WSNumber;

  constructor(state: IWSState) {
    super(state);
    this.growthTicksCap = this.state.baseTicksGrowth.f.mul(this.health);

    this.deathLimit = this.maxLife.f.mul(WSTLumberjack.DEATH_LIMIT);
    this.life = this.deathLimit.f.mul(10);
    
    this.fruitsAbundanceOverGatheringLimit = this.defaults.fruitsAbundanceOverGatheringLimit;
    this.waterAbundanceOverRefillingLimit = this.defaults.waterAbundanceOverRefillingLimit;
    this.woodAbundanceGatheringLimit = this.defaults.woodAbundanceGatheringLimit;
    this.baseReproductionFactor = this.defaults.baseReproductionFactor;
    this.baseReproductionProbability = this.defaults.baseReproductionProbability;
    this.baseReproductionMax = this.defaults.baseReproductionMax;
    this.minHealthyLife = this.defaults.minHealthyLife;
    this.woodGatheringBaseFactor = this.defaults.woodGatheringBaseFactor;
    this.reproductionLatency = this.maxAge.f.div(this.baseReproductionMax);
  }

  public get tickLogInfos() {
    return {
      ...super.tickLogInfos,
      life: this.life.f, // Current health
      relativeLife: this.relativeLife.f,
      age: this.age.f, // Current age,
      health: this.health.f,

      wood: this.wood.f,
      water: this.water.f,
      fruits: this.fruits.f,

      hunger: this.hunger.f.div(this.maxLife),
      thirst: this.thirst.f.div(this.maxLife),

      rprprob: this.currentRprProb
    }
  }

  public get adult(): boolean { return this.relativeAge.sup(0.2) }
  public get growing(): boolean { return this.age.inf(this.maxAge) }
  public get relativeAge(): WSNumber { return this.age.f.div(this.maxAge) }
  public get relativeLife(): WSNumber { return this.life.f.div(this.maxLife) }
  public get maxLife(): WSNumber { return this.lifeGrowth.eval(this.growthTicksCap) } // [TODO] maxLife is not prop to age, should follow a normal (low maxLige when old)
  public get maxAge(): WSNumber { return this.growthTicksCap }
  public get healthy(): boolean { return this.relativeLife.sup(this.minHealthyLife) && !this.thirsty && !this.hungry }
  public get population(): WSNumber { return WSNumber.of(this.state.ticked.all(WSTLumberjack).length) }

  protected get defaults() { return this.state.defaults.jack; }
  protected override get dead(): boolean { return this.relativeLife.inf(WSTLumberjack.DEATH_LIMIT) || this.age.supeq(this.maxAge) }

  public get thirsty(): boolean {
    return this.thirst.f.div(this.maxLife).sup(0.5);
  }

  public get hungry(): boolean {
    return this.hunger.f.div(this.maxLife).sup(0.8);
  }

  protected override[EWSMType.Tick](message: WSM<EWSMType.Tick>) {
    super.Tick(message);

    const tick = WSNumber.of(message.payload);
    const waterAbundance = this.waterAbundance(tick);
    const fruitsAbundance = this.fruitsAbundance(tick);
    const woodAbundance = this.woodAbundance(tick);
    const waterNeed = this.waterNeed(tick);
    const fruitsNeed = this.fruitsNeed(tick);

    // This is jack's growth, linear with ticks
    // [TODO] May grow slower than one age per tick (use lin)
    this.age.add(1).max(this.maxAge);

    this.life.add(this.lifeVar(tick)).max(this.maxLife).min(0);

    if (WSNumber.random().inf(0.1)) this.wood.mul(0.90); // Wood decays when not used...

    this.ht();

    if (this.water.inf(waterNeed.f.double)) {
      this.water.add(this.refill(waterNeed.mul(5).mul(waterAbundance)));
      this.h();
    }

    if (this.fruits.inf(fruitsNeed.f.double)) {
      this.fruits.add(this.gather(fruitsNeed.mul(10).mul(this.fruitsAbundance(tick))));
      this.t();
    }

    if (fruitsAbundance.sup(this.fruitsAbundanceOverGatheringLimit) && this.fruits.inf(fruitsNeed.f.mul(20))) {
      this.fruits.add(this.gather(fruitsNeed.mul(5).mul(this.fruitsAbundance(tick))));
      this.t();
    }

    if (waterAbundance.sup(this.waterAbundanceOverRefillingLimit) && this.water.inf(waterNeed.f.mul(10))) {
      this.water.add(this.refill(waterNeed.mul(10).mul(waterAbundance)));
      this.h();
    }

    if (this.thirsty) { // If i'm thirsty
      const consumed = this.thirst.f.max(this.water); // I get water
      this.thirst.sub(consumed).min(0); // I drink so I reduce thirst
      this.water.sub(consumed).min(0); // And consume my stock
    }

    if (this.hungry) { // If i'm hungry
      const consumed = this.hunger.f.max(this.fruits); // I get fruits
      this.hunger.sub(consumed).min(0); // I eat so I reduce hunger
      this.fruits.sub(consumed).min(0); // And consume my stock
    }

    if (
      this.adult
      && this.healthy
      && woodAbundance.sup(this.woodAbundanceGatheringLimit)
      && WSNumber.random().inf(this.woodGatheringBaseFactor)
    ) {
      // Chop wood
      const wood = this.state.ticked.all(WSTTree)
        .filter((tree) => tree.adult)
        .map((tree) => tree.wood)
        .reduce((acc, curr) => acc.add(curr), WSNumber.ZERO)

      const objective = wood.div(this.population).mul(this.health);
      this.wood.add(this.chop(objective));

      // Consumes resources
      this.ht();
    }

    if (this.canReproduce(tick)) {
      const rprcap = this.baseReproductionFactor.f
        .mul(this.health)
        .mul(fruitsAbundance.f.pow(this.population))
        .mul(waterAbundance.f.pow(this.population))

      this.currentRprProb.set(rprcap);

      if (WSNumber.random().infeq(rprcap)) {
        const mate = this.state.ticked.all(WSTLumberjack)
          .sort((wsa, wsb) => wsb.tickLogInfos.life.f.sub(wsa.tickLogInfos.life).val) // Go for biggest source first
          .filter((jack) => jack.id !== this.id) // Don't fuck yourself
          .find((jack) => jack.reproduce(tick));
        if (mate) {
          this.sendLog(`WSTLumberjack::FuckedWith::${mate.id}`)
        }
      }
    }
  }


  private ht(): void {
    this.h();
    this.t();
  }

  private h(): void { this.hunger.add(this.maxLife.f.mul(0.05)).max(this.maxLife) }
  private t(): void { this.thirst.add(this.maxLife.f.mul(0.1)).max(this.maxLife) }

  public canReproduce(tick: WSNumber): boolean {
    return this.adult && this.healthy && tick.f.sub(this.latestChild).supeq(this.reproductionLatency)
  }

  private baseNeed(tick: WSNumber): WSNumber {
    return this.lifeGrowth.delta(tick);
  }

  public fruitsNeed(tick: WSNumber): WSNumber {
    return this.baseNeed(tick);
  }

  public waterNeed(tick: WSNumber): WSNumber {
    return this.baseNeed(tick);
  }

  private lifeVar(tick: WSNumber): WSNumber {
    const needFactor = (this.thirsty || this.hungry) ? -1 : 1;
    return this.baseNeed(tick).mul(needFactor)
    // .mul(this.thirsty ? 2 : 1)
    // .mul(this.hungry ? 1.5 : 1);
  }

  public fruitsAbundance(tick: WSNumber): WSNumber {
    const trees = this.state.ticked.all(WSTTree);

    const total = trees.map((ws) => ws.tickLogInfos.fruits)
      .reduce((acc, curr) => acc.add(curr), WSNumber.ZERO);

    const needed = this.fruitsNeed(tick).mul(this.population.mul(4.5)).mul(this.population.double);

    return WSNumber.ONE.sub(needed.div(total)).min(0);
  }

  public waterAbundance(tick: WSNumber): WSNumber {
    const sources = this.state.ticked.all(WSTWaterSource);

    const total = sources.map((ws) => ws.tickLogInfos.water)
      .reduce((acc, curr) => acc.add(curr), WSNumber.ZERO);

    const needed = this.waterNeed(tick).mul(this.population.mul(4.5).double);

    return WSNumber.ONE.sub(needed.div(total)).min(0);
  }

  public woodAbundance(_tick: WSNumber): WSNumber {
    const trees = this.state.ticked.all(WSTTree);

    return trees.map((tree) => tree.relativeAge)
      .reduce((acc, curr) => acc.add(curr), WSNumber.ZERO)
      .div(trees.length);
  }

  public reproduce(tick: WSNumber): boolean {
    if (this.canReproduce(tick)) {

      const chance = WSNumber.random()

      this.ht();

      if (chance.infeq(this.baseReproductionProbability)) {
        this.send(EWSMType.Create, {
          type: Object.entries(WSApi.TYPES_MAP).find(([_key, type]) => type === WSTLumberjack)?.[0] as string,
          amount: WSNumber.ONE
        }, WSWorld);
        this.latestChild = tick;
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  private refill(amount: WSNumber): WSNumber {
    let filled = WSNumber.ZERO;

    this.state.ticked.all(WSTWaterSource)
      .sort((wsa, wsb) => wsb.tickLogInfos.water.f.sub(wsa.tickLogInfos.water).val) // Go for biggest source first
      .find((source) => {
        const sucked = source.suck(amount.f.mul(this.health).sub(filled));
        filled = filled.add(sucked);
        if (filled.supeq(amount)) return amount;
      });

    this.sendLog(`WSTLumberjack::${this.id}::Gather::${filled.val}`);

    return filled;
  }

  private gather(amount: WSNumber): WSNumber {
    let gathered = WSNumber.ZERO;

    const trees = this.state.ticked.all(WSTTree)
      .sort((wsa, wsb) => wsb.tickLogInfos.fruits.f.sub(wsa.tickLogInfos.fruits).val) // Go for biggest source first

    for (const tree of trees) {
      const found = tree.gather(amount.f.mul(this.health).div(trees.length));
      gathered = gathered.add(found);
      if (gathered.supeq(amount)) return amount;
    }

    this.sendLog(`WSTLumberjack::${this.id}::Gather::${gathered.val}`);

    return gathered;
  }

  private chop(amount: WSNumber): WSNumber {
    let gathered = WSNumber.ZERO;

    const trees = this.state.ticked.all(WSTTree)
      .sort((wsa, wsb) => wsb.tickLogInfos.wood.f.sub(wsa.tickLogInfos.wood).val) // Go for biggest source first
      .filter((tree) => tree.adult)

    for (const tree of trees) {
      const found = tree.chop(amount.f.mul(this.health).div(trees.length));
      gathered = gathered.add(found);
      if (gathered.supeq(amount)) return amount;
    }

    this.sendLog(`WSTLumberjack::${this.id}::Chop::${gathered.val}`);

    return gathered;
  }
}