import Route from "@ioc:Adonis/Core/Route";

export default function complaint_categoryRoutes() {
    Route.group(() => {
        Route.get("/", "ComplaintCategoriesController.index");
        Route.post("/", "ComplaintCategoriesController.store");
        Route.get("/:id", "ComplaintCategoriesController.show");
        Route.put("/:id", "ComplaintCategoriesController.update");
        Route.delete("/:id", "ComplaintCategoriesController.destroy");
    }).prefix("complaint_categories");
}
