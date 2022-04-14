
import { Api } from "ddapps/api.ts";
import { EMType } from "ddapps/messages.ts";
import { M } from "ddapps/type.ts";
import { IWSState } from "./interface.ddapps.ts";
import { EWSMType, IWSMPayload } from "./messages.ddapps.ts";
import {
  EWSOpType,
  IWSRequestPayload,
  IWSResponsePayload,
} from "./operations.ddapps.ts";
import { WSM } from "./type.ddapps.ts";
import { WSWorld } from "./world.ddapps.ts";
import { WSNumber } from "./models/models.mod.ts";
import { WSTWaterSource } from "./ticked/water-source.ticked.ts";
import { WSTTree } from "./ticked/tree.ticked.ts";
import { WSTLumberjack } from "./ticked/lumberjack.ticked.ts";
import { WSTickedComponent } from "./ticked-component.ddapps.ts";
import { WSTicker } from "./ticker.ddapps.ts";
import { EComponent } from "ddapps/enumeration.ts";

export class WSApi extends Api<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload,
  IWSState
> {

  public static TYPES_MAP: { [key: string]: (new (state: IWSState) => WSTickedComponent) } = {
    "ws": WSTWaterSource,
    "tree": WSTTree,
    "jack": WSTLumberjack
  }

  protected override [EMType.ClientRequest](message: M<EMType.ClientRequest> | WSM<EMType.ClientRequest>) {
    super.ClientRequest(message as M<EMType.ClientRequest>);
    switch (message.payload.type) {
      case EWSOpType.SetTicksFrequency: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.SetTicksFrequency];
        this.send(EWSMType.SetTicksFrequency, payload, WSTicker)
          .then((_message) => {
            this.response(EWSOpType.SetTicksFrequency, payload);
          });
        break;
      }
      case EWSOpType.Chop: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.Chop];
        this.send(EWSMType.Chop, payload, WSWorld)
        break;
      }
      case EWSOpType.Tick: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.Tick];
        this.send(EWSMType.SendTick, payload, WSTicker)
          .then(() => {
            this.response(EWSOpType.Tick, this.state.tick.val);
          })
        break;
      }
      case EWSOpType.Run: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.Run];
        this.state.run = payload === null ? !this.state.run : payload;
        this.response(EWSOpType.Run, this.state.run)
        break;
      }
      case EWSOpType.Reset: {
        this.send(EMType.InitialMessage, null, EComponent.ALL)
          .then((_message) => {
            this.response(EWSOpType.Reset, this.state.run);
          })
        break;
      }
      case EWSOpType.Create: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.Create];
        this.send(EWSMType.Create, {
          type: payload.type,
          amount: WSNumber.of(payload.amount)
        }, WSWorld)
        break;
      }
      case EWSOpType.GetState: {
        this.state.watchers.push({
          token: message.payload.token,
          source: message.source
        });
        break;
      }
      case EWSOpType.Throw: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.Throw];
        this.response(EWSOpType.Throw, payload);
        throw new Error(payload);
      }
      case EWSOpType.Delete: {
        const payload = message.payload.payload as IWSRequestPayload[EWSOpType.Delete];
        this.send(EWSMType.Delete, {
          type: payload.type,
          amount: WSNumber.of(payload.amount)
        }, WSWorld)
        break;
      }
      case EWSOpType.Config: {

        const { prop, param, value, type } = message.payload.payload as IWSRequestPayload[EWSOpType.Config];
        
        if (value === null) {
          this.response(EWSOpType.Config, {
            success: false,
            message: `WSApi::Config::${type}::Error::InvalidNullValue::${param}`,
          });
          break;
        }
        
        if (value < 0) {
          this.response(EWSOpType.Config, {
            success: false,
            message: `WSApi::Config::${type}::Error::NoAbuseAllowed::${param}`,
          });
          break;
        }

        const ttype = WSApi.TYPES_MAP[type];

        const entities = this.state.ticked.all(ttype);

        if (Reflect.has(this.state.defaults, type)) {
          const defaults = Reflect.get(this.state.defaults, type);
  
          // Change defaults only if you want all objects to be affected (prop === 1)
          if (Reflect.has(defaults, param) && prop === 1) {
            Reflect.set(defaults, param, WSNumber.of(value));
            this.notification(EWSOpType.Config, {
              success: true,
              message: `WSApi::Config::${ttype.name}::DefaultSet::${param}::${value}`,
            });
          } else if (prop === 1) {
            this.notification(EWSOpType.Config, {
              success: false,
              message: `WSApi::Config::${ttype.name}::DefaultNotFound::${param}`,
            });
          }
  
          for (let index = 0; index < entities.length; index++) {
            const entity = entities[index];
  
            if (index % (1 / prop) === 0 && Reflect.has(entity, param)) {
              Reflect.set(entity, param, WSNumber.of(value));
              this.sendLog(`WSApi::Config::Set::${type}::${param}::${value}::${prop}`)
            } else if (!Reflect.has(entity, param)) {
              this.response(EWSOpType.Config, {
                success: false,
                message: `WSApi::Config::${ttype.name}::PropertyNotFound::${param}`,
              });
            }
          }
  
          this.response(EWSOpType.Config, {
            success: true,
            message: `WSApi::Config::${ttype.name}::PropertySet::${param}::${value}`,
          });
        } else {
          this.response(EWSOpType.Config, {
            success: false,
            message: `WSApi::Config::InvalidObjectType::${type}`
          })
        }
        break;
      }
      default:
        break;
    }
  }
}
