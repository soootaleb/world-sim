import { WSFBase, WSNumber } from "./models.mod.ts";

export class WSFLin extends WSFBase {

  private _factor: WSNumber;
  private _constant: WSNumber;

  public get factor(): WSNumber { return this._factor }
  public get constant(): WSNumber { return this._constant }

  constructor(factor: WSNumber | number, constant: WSNumber | number) {
    super({ factor, constant });
    this._factor = WSNumber.of(factor);
    this._constant = WSNumber.of(constant);
  }
  
  public int(x: WSNumber | number): WSNumber {
    const value = (x instanceof WSNumber ? x.val : x)
    return this.factor.f.div(2).mul(Math.pow(value, 2) + value);
  }

  public eval(x: WSNumber | number): WSNumber {
    const value = (x instanceof WSNumber ? x.val : x)
    return this.factor.f.mul(value).add(this.constant);
  }

  public delta(xa: WSNumber | number, xb?: WSNumber | number): WSNumber {
    const xavalue = (xa instanceof WSNumber ? xa.val : xa)
    const xbvalue = (xb instanceof WSNumber ? xb.val : (xb || xavalue + 1))
    return this.eval(xbvalue).sub(this.eval(xavalue));
  }

  public get inv(): WSFLin {
    return new WSFLin(this.factor.f.inv, WSNumber.of(-1 * this.constant.f.val / this.factor.f.val))
  }
}