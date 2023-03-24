import Route from "@ioc:Adonis/Core/Route";

export default function authRoutes() {
    Route.group(() => {
        Route.post("/update/password", "UsersController.updatePassword");
        Route.post("/update/email", "UsersController.updateEmail");

        Route.group(() => {
            Route.post("/create", "UsersController.newNagarik");
        }).prefix("/nagarik");

        Route.group(() => {
            Route.get("/list", "UsersController.getJansevaks");
            Route.post("/create", "UsersController.newJansevak");
        }).prefix("/jansevak");
    }).prefix("/user");
}
