import Route from "@ioc:Adonis/Core/Route";

export default function wardRoutes() {
    Route.group(() => {
        Route.get("/list", "WardsController.index");
        Route.post("/users", "WardsController.getUsers");
        Route.post("/create", "WardsController.create");
        Route.post("/update", "WardsController.update");
        Route.post("/archive", "WardsController.archive");

        Route.get("/post-office-list/:pincode", "PostOfficesController.show");
    }).prefix("/ward");
}
