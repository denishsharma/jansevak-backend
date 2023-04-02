import Route from "@ioc:Adonis/Core/Route";

export default function wardRoutes() {
    Route.group(() => {
        Route.get("/list", "WardsController.index");
        Route.get("/users/:wardId", "WardsController.getUsers");
        Route.post("/create", "WardsController.create");
        Route.post("/update/:wardId", "WardsController.update");
        Route.post("/archive/:wardId", "WardsController.archive");

        Route.get("/post-office-list/:pincode", "PostOfficesController.show");
    }).prefix("/ward");
}
