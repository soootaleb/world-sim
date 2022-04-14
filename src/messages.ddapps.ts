
import { IWSRequestPayload, IWSResponsePayload } from "./operations.ddapps.ts"
import { IMPayload } from "ddapps/messages.ts"
import { WSNumber } from "./models/models.mod.ts";

/**
 * List of Messages available. Use it for a stronger typing.
 */
export enum EWSMType {
  Tick = "Tick",
  Chop = "Chop",
  Dead = "Dead",
  Create = "Create",
  Delete = "Delete",
  SendTick = "SendTick",
  SetTicksFrequency = "SetTicksFrequency",
}

/**
 * Type the payload of your messages
 */
export interface IWSMPayload extends IMPayload<IWSRequestPayload, IWSResponsePayload> {
  [EWSMType.Tick]: WSNumber;
  [EWSMType.Chop]: string;
  [EWSMType.Dead]: string;
  [EWSMType.Create]: {
    type: string,
    amount: WSNumber
  };
  [EWSMType.Delete]: {
    type: string,
    amount: WSNumber
  };
  [EWSMType.SendTick]: number;
  [EWSMType.SetTicksFrequency]: number;
}
