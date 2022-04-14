import { Command } from "cliffy";
import * as c from "std/fmt/colors.ts";
import { EOpType } from "ddapps/operation.ts";
import { WSClient } from "../../src/client.ddapps.ts";
import { EWSOpType, IWSResponsePayload } from "../../src/operations.ddapps.ts";


export const config = new Command()
.description("Create an entity")
.version("0.2.0")
.option("-w --what <what:string>", "type:param:value[:prop=1]")
.action(async ({ address, port, trace, what }: {
  address: string;
  port: number;
  trace: boolean;
  what: string
}) => {

  let trc = "";

  const [type, param, value, prop] = what.split(":")

  await new WSClient(address, port, trace).co
    .then((ops) => {

      if (trace) {
        ops.listen(EOpType.Trace, (message) => {
          trc += message.payload.payload + " -> "
          console.clear();
          console.log("[Trace]", trc)
        })
      }

      ops.listen(EWSOpType.Config, (message) => {
        const payload = message.payload.payload as IWSResponsePayload[EWSOpType.Config]
        console.log(payload.message);
      })

      return ops.config(type, param, parseFloat(value), parseFloat(prop || "1"));
    }).then(response => {

      if (trace) {
        console.clear();
        console.log("[Trace]", trc + "Client")
      }

      const payload = response.payload.payload as IWSResponsePayload[EWSOpType.Config]

      if (payload.success) {
        console.log(c.green(payload.message))
      } else {
        console.log(c.red(payload.message))
      }

      Deno.exit(0);
    }).catch((err) => {
      console.error(err);
      Deno.exit(1);
    });
});
