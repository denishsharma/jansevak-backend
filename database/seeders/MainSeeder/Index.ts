import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import Application from "@ioc:Adonis/Core/Application";

export default class extends BaseSeeder {
    public async run() {
        await this.runSeeder(await import("../PermissionSeeder"));
        await this.runSeeder(await import("../WardSeeder"));
        await this.runSeeder(await import("../QueryCategorySeeder"));
        await this.runSeeder(await import("../QuestionSeeder"));
        await this.runSeeder(await import("../UserSeeder"));
    }

    private async runSeeder(Seeder: { default: typeof BaseSeeder }) {
        /**
         * Do not run when not in a environment specified in Seeder
         */
        if (
            (!Seeder.default.environment.includes("development") && Application.inDev)
            || (!Seeder.default.environment.includes("testing") && Application.inTest)
            || (!Seeder.default.environment.includes("production") && Application.inProduction)
        ) {
            return;
        }

        await new Seeder.default(this.client).run();
    }
}
