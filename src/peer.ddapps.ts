
import { Peer } from "ddapps/peer.ts";
import { IWSMPayload } from "./messages.ddapps.ts";
import {
  IWSRequestPayload,
  IWSResponsePayload,
} from "./operations.ddapps.ts";
import { IWSState } from "./interface.ddapps.ts";

export class WSPeer extends Peer<
  IWSRequestPayload,
  IWSResponsePayload,
  IWSMPayload,
  IWSState
> { }
