import { Command } from "cliffy";
import { EOpType } from "ddapps/operation.ts";
import { WSClient } from "../../src/client.ddapps.ts";

export const exchange = new Command()
  .description("Interact with exchange")
  .version("0.1.0")
  .option("-o, --operation <operation:string>", "ask or bid")
  .option("-r, --resource <resource:string>", "wood or water or fruit")
  .option("-q, --quantity <quantity:number>", "number of items")
  .option("-d, --price <price:number>", "price of each item")
  .action(async ({ address, port, trace, operation, resource, quantity, price }: {
    address: string;
    port: number;
    trace: boolean;
    operation: 'ask' | 'bid';
    resource: 'wood' | 'water' | 'fruit';
    quantity: number;
    price: number
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

        if (operation === 'ask') {
          return ops.ask(resource, price, quantity)
        } else if (operation === 'bid') {
          return ops.bid(resource, price, quantity)
        } else {
          throw new Error("Bad operation, please use ask or bid");
        }

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