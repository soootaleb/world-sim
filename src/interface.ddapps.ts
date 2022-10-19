import { IWSRequestPayload, IWSResponsePayload } from "./operations.ddapps.ts";
import { IWSMPayload } from "./messages.ddapps.ts";
import { IState } from "ddapps/interface.ts";
import { TickedMap } from "./ticked-map.ddapps.ts";
import { TWSSimState } from "./type.ddapps.ts";
import { WSNumber } from "./models/models.mod.ts";

export interface IWSState extends
  IState<
    IWSRequestPayload,
    IWSResponsePayload,
    IWSMPayload
  > {
  tick: WSNumber;
  baseTicksGrowth: WSNumber;
  ticksPerSecond: WSNumber;

  run: boolean; // Run the sim, send ticks

  ticked: TickedMap;

  watchers: {
    token: string;
    source: string;
  }[];

  sim: TWSSimState;

  defaults: {
    tree: { [key: string]: WSNumber };
    jack: { [key: string]: WSNumber };
  };

  exchange: {
    asks: {
      resource: "wood" | "water" | "fruit";
      price: WSNumber;
      who: string;
    }[];
    bids: {
      resource: "wood" | "water" | "fruit";
      price: WSNumber;
      who: string;
    }[];
  };
}
