// import { WSN } from "../type.ddapps.ts";


// export class WSNumber extends Number {

//   constructor(v: WSN) {
//     super(v);
//   }

//   public get val(): number {
//     return this.valueOf();
//   }

//   /**
//    * Inverse, 1 / WSNumber
//    */
//   public get inv(): WSNumber {
//     return WSNumber.of(1 / this.val);
//   }

//   /**
//    * Increment, WSNumber + 1
//    */
//   public get inc(): WSNumber {
//     return this.add(1);
//   }

//   /**
//    * Decrement, WSNumber - 1
//    */
//   public get dec(): WSNumber {
//     return this.sub(1);
//   }

//   public get double(): WSNumber {
//     return this.mul(2);
//   }

//   public get square(): WSNumber {
//     return this.pow(2);
//   }

//   public get sqrt(): WSNumber {
//     return WSNumber.of(Math.sqrt(this.val));
//   }

//   /**
//    * WSNumber is zero
//    */
//   public get zero(): boolean {
//     return this.val === 0;
//   }

//   public get round(): WSNumber {
//     return WSNumber.of(Math.round(this.val))
//   }

//   public get half(): WSNumber {
//     return WSNumber.of(this.val / 2);
//   }

//   public get abs(): WSNumber {
//     return WSNumber.of(Math.abs(this.val));
//   }

//   public get pos(): boolean {
//     return this.val >= 0;
//   }

//   public get spos(): boolean {
//     return this.val > 0;
//   }

//   public get neg(): boolean {
//     return this.val <= 0;
//   }

//   public get sneg(): boolean {
//     return this.val < 0;
//   }

//   public pow(v: WSN): WSNumber {
//     return WSNumber.of(Math.pow(this.val, v.valueOf()))
//   }

//   public div(v: WSN): WSNumber {
//     return WSNumber.of(this.val / v.valueOf());
//   }

//   public mul(v: WSN): WSNumber {
//     return WSNumber.of(this.val * v.valueOf());
//   }

//   public add(v: WSN): WSNumber {
//     return WSNumber.of(this.val + v.valueOf());
//   }

//   public sub(v: WSN): WSNumber {
//     return WSNumber.of(this.val - v.valueOf());
//   }

//   public inf(v: WSN): boolean {
//     return this.val < v.valueOf();
//   }

//   public infeq(v: WSN): boolean {
//     return this.val <= v.valueOf();
//   }

//   public sup(v: WSN): boolean {
//     return this.val > v.valueOf();
//   }

//   public supeq(v: WSN): boolean {
//     return this.val >= v.valueOf();
//   }

//   /**
//    * Returns the lowest value between WSNumber and another given
//    * Returns the instance if equal
//    * @param v to compare to
//    * @returns the lowest value
//    */
//   public min(v: WSN): WSNumber {
//     return this.infeq(v) ? WSNumber.of(v) : this;
//   }

//   /**
//    * Returns the greatest value between WSNumber and another given
//    * Returns the instance if equal
//    * @param v to compare to
//    * @returns the greatest value
//    */
//   public max(v: WSN): WSNumber {
//     return this.supeq(v) ? WSNumber.of(v) : this;
//   }

//   public static of(v: WSN): WSNumber {
//     return new WSNumber(v);
//   }

//   public static get ONE(): WSNumber {
//     return WSNumber.of(1);
//   }

//   public static get ZERO(): WSNumber {
//     return WSNumber.of(0);
//   }

//   public static random(min: WSN = WSNumber.ZERO, max: WSN = WSNumber.ONE): WSNumber {
//     const rnd = WSNumber.of(Math.random());
//     const range = max.valueOf() - min.valueOf();
//     return rnd.mul(range).add(min);
//   }
// }