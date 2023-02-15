/*
|--------------------------------------------------------------------------
| AdonisJs Server
|--------------------------------------------------------------------------
|
| The contents in this file is meant to bootstrap the AdonisJs application
| and start the HTTP server to accept incoming connections. You must avoid
| making this file dirty and instead make use of `lifecycle hooks` provided
| by AdonisJs service providers for custom code.
|
*/

import "reflect-metadata";
import { createServer } from "https";
import sourceMapSupport from "source-map-support";
import { Ignitor } from "@adonisjs/core/build/standalone";
import { readFileSync } from "fs";
import console from "console";

const key = readFileSync(`${__dirname}/ssl/private.key`);
const cert = readFileSync(`${__dirname}/ssl/certificate.crt`);

console.log(__dirname);

sourceMapSupport.install({ handleUncaughtExceptions: false });

new Ignitor(__dirname)
    .httpServer()
    .start((handler) => {
        return createServer(
            { key, cert },
            handler,
        );
    }).then(() => {});
