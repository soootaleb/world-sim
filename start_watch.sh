#!/bin/bash

pkill deno

deno task start &

# ./ws &

sleep 0.3

deno task cli -- watch --stats qty,sum,avg