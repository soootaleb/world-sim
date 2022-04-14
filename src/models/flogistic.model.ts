import { WSFBase, WSNumber } from "./models.mod.ts";

export class WSFLogistic extends WSFBase {

  private _center: WSNumber;
  private _max: WSNumber;
  private _growth: WSNumber;

  public get center(): WSNumber { return this._center }
  public get max(): WSNumber { return this._max }
  public get growth(): WSNumber { return this._growth }

  constructor(max = WSNumber.ONE, center: WSNumber = WSNumber.ZERO.half, growth = WSNumber.ONE) {
    super({ center, max });
    this._center = WSNumber.of(center);
    this._max = WSNumber.of(max);
    this._growth = WSNumber.of(growth);
  }

  public eval(x: WSNumber): WSNumber {
    const exp = WSNumber.E.pow(this.growth.f.mul(-1).mul(x.f.sub(this.center)));
    const divider = WSNumber.ONE.add(exp);
    return this.max.f.div(divider);
  }

  public delta(xa: WSNumber, xb?: WSNumber): WSNumber {
    return this.eval((xb || xa.f.inc)).sub(this.eval(xa));
  }
}