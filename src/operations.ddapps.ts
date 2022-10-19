
import { IRequestPayload, IResponsePayload } from "ddapps/operation.ts";
import { TWSSimState } from "./type.ddapps.ts";

export enum EWSOpType { 
  Chop = "Chop",
  Run = "Run",
  Throw = "Throw",
  Tick = "Tick",
  Reset = "Reset",
  Delete = "Delete",
  Create = "Create",
  Config = "Config",
  GetState = "GetState",
  UnGetState = "UnGetState",
  CreateAsk = "CreateAsk",
  CreateBid = "CreateBid",
  CreateError = "CreateError",
  DeleteError = "DeleteError",
  EntityNotFound = "EntityNotFound",
  SetTicksFrequency = "SetTicksFrequency",
}

export interface IWSRequestPayload extends IRequestPayload {
  [EWSOpType.Throw]: string;
  [EWSOpType.Reset]: null;
  [EWSOpType.Tick]: number;

  [EWSOpType.Run]: boolean | null;

  [EWSOpType.Config]: {
    type: string;
    param: string;
    value: number;
    prop: number;
  }

  [EWSOpType.Delete]: {
    type: string;
    amount: number
  };

  [EWSOpType.Create]: {
    type: string;
    amount: number
  };

  [EWSOpType.CreateAsk]: {
    resource: 'wood' | 'water' | 'fruit',
    price: number,
    amount: number
  };

  [EWSOpType.CreateBid]: {
    resource: 'wood' | 'water' | 'fruit',
    price: number,
    amount: number
  };

  [EWSOpType.Chop]: string;
  [EWSOpType.GetState]: null;
  [EWSOpType.UnGetState]: null;
  [EWSOpType.SetTicksFrequency]: number;
}

export interface IWSResponsePayload extends IResponsePayload {
  [EWSOpType.Throw]: string;
  [EWSOpType.Reset]: boolean;
  [EWSOpType.Tick]: number;
  [EWSOpType.Run]: boolean;
  [EWSOpType.Chop]: number;
  [EWSOpType.Create]: string[];
  [EWSOpType.Delete]: null;
  [EWSOpType.CreateError]: string;
  [EWSOpType.DeleteError]: string;
  [EWSOpType.GetState]: {
    tick: number,
    state: TWSSimState
  };
  [EWSOpType.UnGetState]: null;
  [EWSOpType.EntityNotFound]: string;
  [EWSOpType.Config]: {
    success: boolean,
    message: string
  };
  [EWSOpType.SetTicksFrequency]: number;
  [EWSOpType.CreateAsk]: {
    who: string
  };

  [EWSOpType.CreateBid]: {
    who: string
  };
}
