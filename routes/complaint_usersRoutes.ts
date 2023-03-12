import Route from "@ioc:Adonis/Core/Route";

export default function complaint_usersRoutes() {
    Route.group(() => {
        Route.get("/", "ComplaintUsersController.index");
        Route.post("/", "ComplaintUsersController.store");
        Route.get("/:id", "ComplaintUsersController.show");
        Route.put("/:id", "ComplaintUsersController.update");
        Route.delete("/:id", "ComplaintUsersController.destroy");
    }).prefix("complaint_users");
}
