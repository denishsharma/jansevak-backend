import Route from "@ioc:Adonis/Core/Route";

export default function authRoutes() {
    Route.group(() => {
        Route.post("/updatePassword", "UsersController.updatePassword");
        Route.post("/updateEmail", "UsersController.updateEmail");
    }).prefix("/user");
}
