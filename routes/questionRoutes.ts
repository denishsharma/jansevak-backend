import Route from "@ioc:Adonis/Core/Route";

export default function questionRoutes() {
    Route.group(() => {

        Route.get('/', 'QuestionsController.index');
        Route.post('/', 'QuestionsController.store');
        Route.get('/:id', 'QuestionsController.show');
        Route.post('update/:id', 'QuestionsController.update');
        Route.post('delete/:id', 'QuestionsController.destroy');
    }).prefix("/question");
}
