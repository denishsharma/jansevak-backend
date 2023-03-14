import Route from "@ioc:Adonis/Core/Route";

export default function announcementRoutes() {
    Route.group(() => {
        Route.get("/list", "AnnouncementsController.index");
        Route.get("/show/:slug", "AnnouncementsController.show");

        Route.post("/create", "AnnouncementsController.create");
        Route.post("/update", "AnnouncementsController.update");
        Route.post("/archive", "AnnouncementsController.archive");
    }).prefix("/announcement");
}
