/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from "@ioc:Adonis/Core/Route";

import permissionRoutes from "../routes/permissionRoutes";
import authRoutes from "../routes/authRoutes";
import userRoutes from "../routes/userRoutes";
import profileRoutes from "../routes/profileRoutes";

Route.get("/", async () => {
    return { hello: "world" };
});

Route.group(() => {

    Route.group(() => {
        Route.get('/', 'AnnouncementsController.index');
        Route.post('/', 'AnnouncementsController.store');
        Route.get('/:id', 'AnnouncementsController.show');
        Route.post('update/:id', 'AnnouncementsController.update');
        Route.post('delete/:id', 'AnnouncementsController.destroy');
    }).prefix('announcements');

    Route.group(() => {
        Route.get('/', 'QuestionsController.index');
        Route.post('/', 'QuestionsController.store');
        Route.get('/:id', 'QuestionsController.show');
        Route.post('update/:id', 'QuestionsController.update');
        Route.post('delete/:id', 'QuestionsController.destroy');
    }).prefix('question');

    Route.group(() => {
        Route.get('/', 'PostsController.index');
        Route.post('/', 'PostsController.store');
        Route.get('/:id', 'PostsController.show');
        Route.post('update/:id', 'PostsController.update');
        Route.post('delete/:id', 'PostsController.destroy');
    }).prefix('post');

}).prefix('api/v1');
// .middleware('auth:jwt');




Route.group(() => {
    authRoutes();
    userRoutes();
    permissionRoutes();
    profileRoutes();
}).prefix("/api/");

