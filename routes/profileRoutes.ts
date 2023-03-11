import Route from "@ioc:Adonis/Core/Route";

export default function profileRoutes() {
    Route.group(() => {
        Route.post("/update/:userToUpdateId", "ProfilesController.updateProfile");
    }).prefix("/profile");
}
