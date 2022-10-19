import { ddappsctl } from "ddapps/cli/cli.ts";
import { chop } from "./commands/chop.ts";
import { create } from "./commands/create.ts";
import { del } from "./commands/delete.ts";
import { watch } from "./commands/watch.ts";
import { config } from "./commands/config.ts";
import { run } from "./commands/run.ts";
import { tick } from "./commands/tick.ts";
import { exchange } from "./commands/exchange.ts";

import { Command } from "cliffy";
import { EWSOpType } from "../src/operations.ddapps.ts";
import { WSClient } from "../src/client.ddapps.ts";
import { IWSResponsePayload } from "../src/operations.ddapps.ts";
import { EOpType } from "../../ddapps/src/operation.ts";

export const sint = new Command()
  .description("Add some")
  .version("0.2.0")
  .option("-f --frequency <frequency:number>", "How many tick per second")
  .action(async ({ address, port, trace, frequency }: {
    address: string;
    port: number;
    trace: boolean;
    frequency: number
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

        return ops.stfrequency(frequency);
      }).then(response => {

        if (trace) {
          console.clear();
          console.log("[Trace]", trc + "Client")
        }

        const payload = response.payload.payload as IWSResponsePayload[EWSOpType.SetTicksFrequency]

        console.log(`WSCLI::SetTicksFrequency::${payload}`);

        Deno.exit(0);
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  });

await ddappsctl
  .command("chop", chop)
  .command("create", create)
  .command("delete", del)
  .command("watch", watch)
  .command("config", config)
  .command("run", run)
  .command("tick", tick)
  .command("sint", sint)
  .command("exchange", exchange)
  .parse(Deno.args);
