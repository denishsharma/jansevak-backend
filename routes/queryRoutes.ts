import Route from "@ioc:Adonis/Core/Route";

export default function queryRoutes() {
    Route.group(() => {
        Route.get("/category/list", "QueriesController.listCategories");
        Route.post("/category/create", "QueriesController.createCategory");
        Route.post("/category/archive", "QueriesController.archiveCategory");

        Route.post("/create", "QueriesController.createQuery");
        Route.get("/list/my", "QueriesController.getMyQueries");

        Route.get("/show/:id", "QueriesController.showQuery");
        Route.get("/show/:id/info", "QueriesController.getQueryInfo");
        Route.get("/show/:id/attachments", "QueriesController.getQueryAttachments");
        Route.get("/show/:id/comments", "QueriesController.getQueryComments");

        Route.get("/on-behalf/list", "QueriesController.getOnBehalfOfList");

        Route.post("/comment/regular", "QueriesController.addRegularComment");
        Route.post("/comment/log", "QueriesController.addLogComment");
    }).prefix("/query");
}
