import { IWSState } from "./interface.ddapps.ts";
import { WSNumber } from "./models/models.mod.ts";
import { WSTickedComponent } from "./ticked-component.ddapps.ts";
import { TWSTicked } from "./type.ddapps.ts";

export class TickedMap extends Map<TWSTicked, Array<WSTickedComponent>> {
  
  public all<T extends WSTickedComponent>(type: { new (state: IWSState): T }): T[] {
    if (!this.has(type)) {
      this.set(type, []);
    }
    return this.get(type) as T[];
  }

  public remove(id: string): TWSTicked | null {
    for (const [type, comps] of this.entries()) {
      const comp = comps.find((cmp) => cmp.id === id)
      if (comp) {
        const remains = this.all(type).filter((cmp) => cmp.id != id)
        this.set(type, remains);
        comp.shutdown();
        return type;
      }
    }
    return null;
  }

  public del<T extends WSTickedComponent>(type: { new (state: IWSState): T }, amount: WSNumber) {
    const ids = this.all(type).map((o) => o.id);
    ids.sort();
    ids.slice(0, amount.val).forEach((id) => this.remove(id));
  }

  public dead(): boolean {
    return [...this.values()].map((l) => l.length).reduce((p, a) => p + a, 0) === 0;
  }
}