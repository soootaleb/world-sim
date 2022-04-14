import { Command } from "cliffy";
import { EOpType } from "ddapps/operation.ts";
import { WSClient } from "../../src/client.ddapps.ts";

export const chop = new Command()
  .description("Chop some wood")
  .version("0.2.0")
  .option("-i, --id <id:string>", "Value to set")
  .action(async ({ address, port, id, trace }: {
    address: string;
    port: number;
    id: string;
    trace: boolean;
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

        return ops.chop(id);
      }).then(response => {

        if (trace) {
          console.clear();
          console.log("[Trace]", trc + "Client")
        }

        console.dir(response);
        Deno.exit(0);
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  });