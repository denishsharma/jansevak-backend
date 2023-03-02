import Route from "@ioc:Adonis/Core/Route";

export default function announcementsRoutes() {
    Route.group(() => {

        Route.get('/', 'AnnouncementsController.index');
        Route.post('/', 'AnnouncementsController.store');
        Route.get('/:id', 'AnnouncementsController.show');
        Route.post('update/:id', 'AnnouncementsController.update');
        Route.post('delete/:id', 'AnnouncementsController.destroy');
    }).prefix("/announcement");
}
