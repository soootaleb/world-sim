
import { of } from "ddapps/state.ts";
import { IWSState } from "./interface.ddapps.ts";
import { IWSRequestPayload, IWSResponsePayload } from "./operations.ddapps.ts";
import { EWSMType, IWSMPayload } from "./messages.ddapps.ts";
import { TickedMap } from "./ticked-map.ddapps.ts";
import { WSNumber } from "./models/models.mod.ts";

const base = of<IWSRequestPayload, IWSResponsePayload, IWSMPayload>();

export const state: IWSState = {
  ...base,

  log: {
    ...base.log,
    exclude: [
      ...base.log.exclude,
      EWSMType.Dead,
      EWSMType.Tick,
      EWSMType.Create
    ]
  },

  tick: WSNumber.ZERO,
  baseTicksGrowth: WSNumber.of(100),
  ticksPerSecond: WSNumber.of(10),

  run: false,

  ticked: new TickedMap(),

  watchers: [],

  sim: {
    details: {},
    avg: {},
    sum: {},
    qty: {}
  },

  defaults: {
    tree: {
      baseReproductionFactor: WSNumber.of(0.5),
      baseFlrFactor: WSNumber.of(0.8),
    },
    jack: {
      woodGatheringBaseFactor: WSNumber.of(0.5),
      woodAbundanceGatheringLimit: WSNumber.of(0.8),
      fruitsAbundanceOverGatheringLimit: WSNumber.of(0.5),
      minHealthyLife: WSNumber.of(0.5),
      waterAbundanceOverRefillingLimit: WSNumber.of(0.3),
      baseReproductionFactor: WSNumber.of(0.9),
      baseReproductionProbability: WSNumber.of(0.5),
      baseReproductionMax: WSNumber.of(10),
    }
  }
};
