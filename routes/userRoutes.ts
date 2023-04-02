import Route from "@ioc:Adonis/Core/Route";

export default function userRoutes() {
    Route.group(() => {
        Route.post("/update/password", "UsersController.updatePassword");
        Route.post("/update/email", "UsersController.updateEmail");

        Route.group(() => {
            Route.post("/create", "UsersController.newNagarik");

            Route.get("/list/all", "UsersController.getAllNagariks");
            Route.get("/list/ward/:wardId", "UsersController.getWardNagariks");
            Route.get("/list/assigned/:assignedToId", "UsersController.getAssignedNagariks");
        }).prefix("/nagarik");

        Route.group(() => {
            Route.get("/list", "UsersController.getJansevaks");
            Route.post("/create", "UsersController.newJansevak");

            Route.get("/list/all", "UsersController.getAllJansevaks");
            Route.get("/list/ward/:wardId", "UsersController.getWardJansevaks");
            Route.get("/list/assigned/:assignedToId", "UsersController.getAssignedJansevak");
        }).prefix("/jansevak");

        Route.get("/fid/:fid", "UsersController.getUserByFid");
    }).prefix("/user");
}
