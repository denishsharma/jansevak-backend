import Route from "@ioc:Adonis/Core/Route";

export default function wardRoutes() {
    Route.group(() => {
        Route.get("/list-all", "WardsController.index");
        Route.post("/create", "WardsController.create");
        Route.post("/get-users", "WardsController.getUsers");
        Route.post("/archive", "WardsController.archive");
    }).prefix("/ward");
}
