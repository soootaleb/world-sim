import { IWSState } from "../interface.ddapps.ts";
import { EWSMType } from "../messages.ddapps.ts";
import { WSNumber } from "../models/models.mod.ts";
import { WSTickedComponent } from "../ticked-component.ddapps.ts";
import { WSM } from "../type.ddapps.ts";


export class WSTWaterSource extends WSTickedComponent {

  private static DEATH_LIMIT = WSNumber.of(0.1); // Minimal proportion the source needs to not die

  private health = WSNumber.random(0.8, 1.2); // Average health is 1
  public growth = this.lin(this.health.f, 0);
  
  private water;
  private deathLimit;
  private growthTicksCap;

  constructor(state: IWSState) {
    super(state);
    this.growthTicksCap = this.state.baseTicksGrowth.f.mul(10).mul(this.health)

    this.deathLimit = this.maxWater.f.mul(WSTWaterSource.DEATH_LIMIT);
    this.water = this.maxWater; // [WARN] For dev purposes, should start from deathLimit (requires to put trees later in the sim)

  }

  public override get tickLogInfos() {
    return {
      ...super.tickLogInfos,
      water: this.water.f,
    }
  }

  public get relativeAge(): WSNumber {
    return this.water.f.div(this.maxWater);
  }

  public get maxWater(): WSNumber {
    return this.growth.eval(this.growthTicksCap);
  }

  protected override get dead(): boolean {
    return this.water.inf(this.deathLimit);
  }

  protected override[EWSMType.Tick](message: WSM<EWSMType.Tick>) {
    super.Tick(message);

    if (this.relativeAge.inf(1)) {
      const missingWater = this.maxWater.sub(this.water);
      const factor = WSNumber.ONE.sub(this.water.f.div(this.maxWater)).half;
      this.water.add(missingWater.mul(factor))
    }
  }

  public suck(amount: WSNumber): WSNumber {

    const sucked = amount.f.max(this.water); // Cannot suck more than there is water

    this.water.sub(sucked);

    return sucked;
  }
}