import { Command } from "cliffy";
import * as c from "std/fmt/colors.ts";
import { EOpType } from "ddapps/operation.ts";
import { WSClient } from "../../src/client.ddapps.ts";
import { EWSOpType } from "../../src/operations.ddapps.ts";

export const del = new Command()
  .description("Create an entity")
  .version("0.2.0")
  .option("-w --what <what:string>", "type:amount")
  .action(async ({ address, port, trace, what }: {
    address: string;
    port: number;
    trace: boolean;
    what: string
  }) => {

    let trc = "";

    await new WSClient(address, port, trace).co
      .then((ops) => {

        const [type, amount] = what.split(":")

        if (trace) {
          ops.listen(EOpType.Trace, (message) => {
            trc += message.payload.payload + " -> "
            console.clear();
            console.log("[Trace]", trc)
          })
        }

        return ops.delete(type, parseFloat(amount));
      }).then(response => {

        if (trace) {
          console.clear();
          console.log("[Trace]", trc + "Client")
        }

        const [type, amount] = what.split(":")
        const responseType = response.payload.type;

        if (responseType === EWSOpType.Delete) {
          console.log(c.green(`CLI::Delete::OK::${type}::${amount}`))
        } else {
          console.log(c.red(`CLI::Delete::KO::${type}::${amount}::${response.payload.payload}`))
        }

        Deno.exit(0);
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  });