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
import familyRoutes from "../routes/familyRoutes";
import wardRoutes from "../routes/wardRoutes";
import announcementRoutes from "../routes/announcementRoutes";
import questionRoutes from "../routes/questionRoutes";
import queryRoutes from "../routes/queryRoutes";
import certRoutes from "../routes/certRoutes";
import groupRoutes from "../routes/groupRoutes";
import statisticRoutes from "../routes/statisticRoutes";
import feedbackRoutes from "../routes/feedbackRoutes";

Route.get("/", async () => {
    return { hello: "world" };
});

Route.group(() => {
    authRoutes();
    userRoutes();
    permissionRoutes();
    profileRoutes();
    wardRoutes();
    announcementRoutes();
    questionRoutes();
    familyRoutes();
    queryRoutes();
    certRoutes();
    groupRoutes();
    statisticRoutes();
    feedbackRoutes();
}).prefix("/api/");

