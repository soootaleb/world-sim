
import { DDAPPS } from "ddapps/ddapps.ts";
import { state } from "./src/state.ddapps.ts";
import { IWSState } from "./src/interface.ddapps.ts";
import { IWSRequestPayload, IWSResponsePayload } from "./src/operations.ddapps.ts";
import { IWSMPayload } from "./src/messages.ddapps.ts";
import { WSPeer } from "./src/peer.ddapps.ts";
import { WSApi } from "./src/api.ddapps.ts";
import { WSTicker } from "./src/ticker.ddapps.ts";
import { WSWorld } from "./src/world.ddapps.ts";
import { Logger } from "ddapps/logger.ts";
import { WSM } from "./src/type.ddapps.ts";
import { EMType } from "ddapps/messages.ts";

new DDAPPS<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload,
  IWSState
>().use(WSPeer)
  .use(WSApi)
  .use(WSTicker)
  .use(WSWorld)
  .use(
    class WSLogger extends Logger<
      IWSRequestPayload,
      IWSResponsePayload,
      IWSMPayload,
      IWSState
    > {
      protected override get filters(): ((message: WSM<keyof IWSMPayload>) => boolean)[] {
        return [
          ...super.filters,
    
          (message) => {
            if (message.type === EMType.LogMessage) {
              const msg = message as WSM<EMType.LogMessage>;
              return !msg.payload.message.includes("::SuckedFrom::")
            } else {
              return true;
            }
          },

        ];
      }
    }
  ).run(state);
