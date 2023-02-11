import Route from "@ioc:Adonis/Core/Route";

export default function complaintRoutes() {
    Route.group(() => {

        Route.get('/', 'ComplaintsController.index');
        Route.post('/', 'ComplaintsController.store');
        Route.get('/:id', 'ComplaintsController.show');
        Route.post('update/:id', 'ComplaintsController.update');
        Route.post('delete/:id', 'ComplaintsController.destroy');

    }).prefix("/complaint");
}
