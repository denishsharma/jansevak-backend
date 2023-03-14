import { BasePolicy } from "@ioc:Adonis/Addons/Bouncer";
import User from "App/Models/User";
import { userHasPermissions } from "App/Helpers/Permissions";
import Announcement from "App/Models/Announcement";

export default class AnnouncementPolicy extends BasePolicy {

    /**
     * Check if the user can write the announcement
     * @param user
     */
    public async canWriteAnnouncement(user: User) {
        return await userHasPermissions(["WRITE_ANNOUNCEMENT"], user);
    }

    /**
     * Check if the user can update the announcement
     * @param user
     * @param announcement
     */
    public async canUpdateAnnouncement(user: User, announcement: Announcement) {
        // If the announcement is published, it cannot be updated
        if (announcement.isPublished) return false;

        // If the user does not have the permission to update announcements, it cannot be updated
        if (!await userHasPermissions(["CAN_UPDATE_ANNOUNCEMENT"], user)) return false;

        // It can be updated if the user is the author
        return announcement.userId === user.id;
    }

    /**
     * Check if the user can archive the announcement
     * @param user
     * @param announcement
     */
    public async canArchiveAnnouncement(user: User, announcement: Announcement) {
        // If the user does not have the permission to archive announcements, it cannot be archived
        if (!await userHasPermissions(["CAN_ARCHIVE_ANNOUNCEMENT"], user)) return false;

        // It can be archived if the user is the author
        return announcement.userId === user.id;
    }
}
