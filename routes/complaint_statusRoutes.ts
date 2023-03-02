import Route from "@ioc:Adonis/Core/Route";

export default function complaint_statusRoutes() {
    Route.group(() => {

        Route.get('/', 'ComplaintStatusesController.index');
        Route.post('/', 'ComplaintStatusesController.store');
        Route.get('/:id', 'ComplaintStatusesController.show');
        Route.post('update/:id', 'ComplaintStatusesController.update');
        Route.post('delete/:id', 'ComplaintStatusesController.destroy');


    }).prefix("/complaint_status");
}
