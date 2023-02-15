import Route from "@ioc:Adonis/Core/Route";

export default function authRoutes() {
    Route.group(() => {
        Route.post("/update-password", "UsersController.updatePassword");
        Route.post("/update-email", "UsersController.updateEmail");
    }).prefix("/user");
}
