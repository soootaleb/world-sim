import { EWSOpType, IWSResponsePayload } from "../../src/operations.ddapps.ts";
import * as c from "std/fmt/colors.ts";
import { plot } from "plot";
import { Command } from "cliffy";
import { WSClient } from "../../src/client.ddapps.ts";
import { state } from "../../src/state.ddapps.ts";

export const watch = new Command()
  .description("Watch sim state")
  .version("0.2.0")
  .option("--stats, <stats:string>", "Select stats", { default: [...Object.keys(state.sim)].join(",") })
  .action(async ({ address, port, trace, stats }: {
    address: string;
    port: number;
    trace: boolean;
    stats: string
  }) => {

    const history: { [key: string]: number[] } = {};

    await new WSClient(address, port, trace).co.then((ops) => ops.run(true));
    
    await new WSClient(address, port, trace).co
      .then((ops) => {

        ops.listen(EWSOpType.GetState, (message) => {

          const mpayload = message.payload.payload as IWSResponsePayload[EWSOpType.GetState];
          const statistics = stats.split(",");

          console.clear();

          console.log(`\t ${c.bold("Tick")} ${mpayload.tick}`);

          statistics.forEach((stat) => {

            const payload = mpayload.state[stat];

            const keys = [...Object.keys(payload).filter((k) => {
              if (stat === "qty") {
                return true;
                // return k.startsWith("trees") || k.startsWith("jacks")
              } else if (stat === "sum") {
                return k.startsWith("trees") || k.startsWith("water-water") || k.startsWith("jacks-wood")
                // return k.startsWith("trees-fruits") || k.startsWith("jacks")
              } else {
                return k.startsWith("jacks")
              }
            })]
  
            for (const key of keys) {
              if (!history[key]) history[key] = new Array(150).fill(0);
              if (payload[key]) {
                history[key].push(payload[key])
              } else {
                history[key] = history[key].slice(1)
                history[key].push(0)
              }
              history[key] = history[key].slice(history[key].length - 300);
            }
  
            const colors = ["blue", "green", "red", "magenta", "yellow", "cyan", "white"]

            const values: number[][] = [];
            let legend = `\t${c.bold(stat)} -`;
  
            colors.forEach((color, index) => {
              if (keys[index]) {
                const k = keys[index];
                // deno-lint-ignore no-explicit-any
                legend += ` ${(c as any)[color](k)}`
                if (history[k].length) {
                  values[index] = history[k];
                } else {
                  values[index] = [0];
                }
                // deno-lint-ignore no-explicit-any
                legend += (c as any)[color](` (${c.bold(values[index][values[index].length - 1].toString())})`)
              }
            });
            
            if (values.length) {
              console.log("\n");
              console.log(legend);
              console.log(plot(values, {
                height: Math.round(50 / statistics.length),
                colors: colors,
                min: 0
              }));
            }
  
          })
        })

        return ops.watch();
      }).then(response => {
        console.dir(response);
        Deno.exit(0);
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  });
