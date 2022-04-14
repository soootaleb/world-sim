
import { M } from "ddapps/type.ts";
import { IWSRequestPayload, IWSResponsePayload } from "./operations.ddapps.ts";
import { IWSMPayload } from "./messages.ddapps.ts";
import { IWSState } from "./interface.ddapps.ts";
import { WSTickedComponent } from "./ticked-component.ddapps.ts";

// Use it to type the incoming message in your handlers
export type WSM<T extends keyof IWSMPayload> = M<
  T,
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload
>;

export type TWSTicked = { new (state: IWSState): WSTickedComponent }

export type TWSSimState = {
  [key: string]: { [key: string]: number }
  details: { [key: string]: number },
  avg: { [key: string]: number },
  sum: { [key: string]: number }
  qty: { [key: string]: number }
}