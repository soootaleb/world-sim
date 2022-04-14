import { Command } from "cliffy";
import * as c from "std/fmt/colors.ts";
import { EOpType } from "ddapps/operation.ts";
import { WSClient } from "../../src/client.ddapps.ts";
import { EWSOpType, IWSResponsePayload } from "../../src/operations.ddapps.ts";

export const run = new Command()
  .description("Start and run simulation")
  .version("0.2.0")
  .option("-y --yes [yes:boolean]", "If you want to force a value")
  .action(async ({ address, port, trace, yes }: {
    address: string;
    port: number;
    trace: boolean;
    yes?: boolean
  }) => {

    let trc = "";

    await new WSClient(address, port, trace).co
      .then((ops) => {

        if (trace) {
          ops.listen(EOpType.Trace, (message) => {
            trc += message.payload.payload + " -> "
            console.clear();
            console.log("[Trace]", trc)
          })
        }

        return ops.run(yes);
      }).then(response => {

        if (trace) {
          console.clear();
          console.log("[Trace]", trc + "Client")
        }

        const payload = response.payload.payload as IWSResponsePayload[EWSOpType.Config]

        if (payload) {
          console.log(c.green(`WSCLI::Run::${payload}`));
        } else {
          console.log(c.red(`WSCLI::Run::${payload}`));
        }

        Deno.exit(0);
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  });