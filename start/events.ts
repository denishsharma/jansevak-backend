/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import "App/Events/AuthEvents";
import "App/Events/UserEvents";
import Event from "@ioc:Adonis/Core/Event";

Event.on("db:query", ({ sql, bindings }) => {
    console.log(sql, bindings);
});
