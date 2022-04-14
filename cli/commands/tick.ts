import { Command } from "cliffy";
import { EOpType } from "ddapps/operation.ts";
import { WSClient } from "../../src/client.ddapps.ts";
import { EWSOpType, IWSResponsePayload } from "../../src/operations.ddapps.ts";

export const tick = new Command()
  .description("Add some")
  .version("0.2.0")
  .option("-n --n <n:number>", "How many tick to send", { default: 1 })
  .action(async ({ address, port, trace, n }: {
    address: string;
    port: number;
    trace: boolean;
    n: number
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

        return ops.tick(n);
      }).then(response => {

        if (trace) {
          console.clear();
          console.log("[Trace]", trc + "Client")
        }

        const payload = response.payload.payload as IWSResponsePayload[EWSOpType.Tick]

        console.log(`WSCLI::Tick::${payload}`);

        Deno.exit(0);
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  });