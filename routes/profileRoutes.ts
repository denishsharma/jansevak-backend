import Route from "@ioc:Adonis/Core/Route";

export default function profileRoutes() {
    Route.group(() => {
        Route.post("/update/:id", "ProfilesController.updateProfile");

        Route.get("/show/:id?", "ProfilesController.showProfile");
    }).prefix("/profile");
}
