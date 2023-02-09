import Route from "@ioc:Adonis/Core/Route";

export default function profileRoutes() {
    Route.group(() => {
        Route.post("/update/:userToUpdateId", "ProfilesController.update");
    }).prefix("/profile");
}
