import Route from "@ioc:Adonis/Core/Route";

export default function permissionRoutes() {
    Route.group(() => {
        Route.get("/abs", async () => {
            return { hello: "world" };
        });

        Route.post("/assign", "PermissionsController.assignPermissionToUser");
    }).prefix("/permissions");
}
