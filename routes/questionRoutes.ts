import Route from "@ioc:Adonis/Core/Route";

export default function questionRoutes() {
    Route.group(() => {
        Route.get("/list-all", "QuestionsController.index");
        Route.get("/show/:slug", "QuestionsController.show");
        Route.post("/create", "QuestionsController.create");
        Route.post("/update", "QuestionsController.update");
        Route.post("/archive", "QuestionsController.archive");
    }).prefix("/question");
}
