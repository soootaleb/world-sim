

export class WSNumber {

  private _value: number

  constructor(v: number | WSNumber) {
    if (v instanceof WSNumber) {
      this._value = v.val;
    } else {
      this._value = v;
    }
  }

  public get f(): WSNumber {
    return WSNumber.of(this._value);
  }

  public get val(): number {
    return this._value;
  }

  /**
   * WSNumber is zero
   */
  public get zero(): boolean {
    return this.val === 0;
  }

  public get pos(): boolean {
    return this.val >= 0;
  }

  public get spos(): boolean {
    return this.val > 0;
  }

  public get neg(): boolean {
    return this.val <= 0;
  }

  public get sneg(): boolean {
    return this.val < 0;
  }

  /**
   * Inverse, 1 / WSNumber
   */
  public get inv(): this {
    this._value = 1 / this._value;
    return this;
  }

  public get inc(): this {
    this._value++;
    return this;
  }

  /**
   * Decrement, WSNumber - 1
   */
  public get dec(): this {
    this._value--;
    return this;
  }

  public get double(): this {
    this._value *= 2
    return this;
  }

  public get square(): this {
    this._value = this._value * this._value;
    return this;
  }

  public get round(): this {
    this._value = Math.round(this._value)
    return this;
  }

  public get half(): this {
    this._value = this._value / 2;
    return this;
  }

  public get abs(): this {
    this._value = Math.abs(this._value);
    return this;
  }

  public get sqrt(): this {
    this._value = Math.pow(this._value, 1/2);
    return this;
  }

  public pow(v: WSNumber | number): this {
    this._value = Math.pow(this._value, (v instanceof WSNumber ? v.val : v));
    return this;
  }

  public div(v: WSNumber | number): this {
    this._value = this._value / (v instanceof WSNumber ? v.val : v);
    return this;
  }

  public mul(v: WSNumber | number): this {
    this._value = this._value * (v instanceof WSNumber ? v.val : v);
    return this;
  }

  public add(v: WSNumber | number): this {
    this._value = this._value + (v instanceof WSNumber ? v.val : v);
    return this;
  }

  public sub(v: WSNumber | number): this {
    this._value = this._value - (v instanceof WSNumber ? v.val : v);
    return this;
  }

  public inf(v: WSNumber | number): boolean {
    return this._value < (v instanceof WSNumber ? v.val : v);
  }

  public infeq(v: WSNumber | number): boolean {
    return this._value <= (v instanceof WSNumber ? v.val : v);
  }

  public sup(v: WSNumber | number): boolean {
    return this._value > (v instanceof WSNumber ? v.val : v);
  }

  public supeq(v: WSNumber | number): boolean {
    return this._value >= (v instanceof WSNumber ? v.val : v);
  }

  /**
   * Lower bounds a value to a min (returns the min if `this` is lower than the min)
   * @param v to compare to
   * @returns the lowest value to get
   */
  public min(v: WSNumber | number): this {
    const value = (v instanceof WSNumber ? v.val : v)
    if (this._value < value) {
      this._value = value;
    }
    return this;
  }

  /**
   * Upper bounds a value to a max (returns the max if `this` is greater than the max)
   * @param v to compare to
   * @returns the greatest value
   */
  public max(v: WSNumber | number): this {
    const value = (v instanceof WSNumber ? v.val : v)
    if (this._value > value) {
      this._value = value;
    }
    return this;
  }

  public set(v: WSNumber | number): this {
    this._value = (v instanceof WSNumber ? v.val : v);
    return this;
  }

  public static of(v: WSNumber | number | string): WSNumber {
    return new WSNumber((v instanceof WSNumber ? v.val : (typeof v === "string" ? parseFloat(v) : v)));
  }

  public static get ONE(): WSNumber {
    return WSNumber.of(1);
  }

  public static get ZERO(): WSNumber {
    return WSNumber.of(0);
  }
  
  public static get E(): WSNumber {
    return WSNumber.of(Math.E);
  }

  public static random(min: WSNumber | number = WSNumber.ZERO, max: WSNumber | number = WSNumber.ONE): WSNumber {
    const rnd = Math.random();
    const range = (max instanceof WSNumber ? max.val : max) - (min instanceof WSNumber ? min.val : min);
    return WSNumber.of((rnd * range) + (min instanceof WSNumber ? min.val : min));
  }
}