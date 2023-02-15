import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Announcement from "App/Models/Announcement";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import slugify from "slugify";
import { string } from "@ioc:Adonis/Core/Helpers";
import Attachment from "App/Models/Attachment";
import { PolymorphicType } from "App/Helpers/Polymorphism";

export default class AnnouncementsController {
    public async index({}: HttpContextContract) {
        return Announcement.all();
    }

    /**
     * Create announcement
     * @param request
     * @param auth
     * @param bouncer
     * @param response
     */
    public async create({ request, auth, bouncer, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // check if user is authorized to create announcement
        const allows = await bouncer.forUser(user).with("AnnouncementPolicy").allows("canCreateAnnouncement");
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get subject and content from request
        const { subject, content } = request.only(["subject", "content"]);

        // check if subject and content are not empty
        if (!subject || !content) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // get cover image from request
        const coverImage = request.file("cover_image", {
            size: "2mb",
            extnames: ["jpg", "png", "jpeg", "gif"],
        });

        // cover image is optional
        let coverImageAttachment: boolean = false;

        // if cover image is provided, move it to disk
        if (coverImage) {
            // check if cover image is valid
            if (!coverImage.isValid) {
                return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
            }

            // move cover image to disk
            await coverImage.moveToDisk("./");
            coverImageAttachment = true;
        }

        // create announcement and return response
        const announcement = await Announcement.create({
            userId: user.id,
            subject,
            content,
            slug: slugify(`${subject} ${string.generateRandom(4)}`, { lower: true, strict: true }),
        });

        // if cover image is provided, create attachment and attach with announcement
        if (coverImageAttachment && coverImage) {
            const attachment = await Attachment.create({
                clientName: coverImage.clientName,
                fileName: coverImage.fileName,
                filePath: coverImage.filePath,
                fileType: coverImage.extname,
                mimeType: coverImage.type + "/" + coverImage.subtype,
                referenceType: PolymorphicType.Announcement,
                referenceId: announcement.id,
            });

            // if attachment is not created, return error
            if (!attachment) {
                return response.status(500).send(Responses.createResponse({}, [ResponseCodes.UNKNOWN_ERROR], "Unknown error"));
            }
        }

        // return response
        return response.status(201).send(Responses.createResponse(Object.assign(announcement.serialize({
            fields: { pick: ["subject", "content", "slug", "published_at"] },
        }), { cover_url: (await announcement.coverUrl()) }), [ResponseCodes.SUCCESS_WITH_DATA], "Announcement created successfully"));
    }

    /**
     * Show announcement by slug
     * @param response
     * @param params
     */
    public async show({ response, params }: HttpContextContract) {
        // Get slug from params
        const { slug } = params;

        // Find announcement by slug
        const announcement = await Announcement.findBy("slug", slug);

        // If announcement is not found, return error
        if (!announcement) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Announcement not found"));
        }

        // return response
        return response.status(200).send(Responses.createResponse(Object.assign(announcement.serialize({
            fields: { pick: ["subject", "content", "slug", "published_at"] },
        }), { cover_url: (await announcement.coverUrl()) }), [ResponseCodes.SUCCESS_WITH_DATA], "Announcement fetched successfully"));
    }

    /**
     * Update announcement
     * @param request
     * @param auth
     * @param bouncer
     * @param response
     */
    public async update({ request, auth, bouncer, response }: HttpContextContract) {
        // check if user is authenticated
        const user = await getLoggedInUser(auth);

        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // get slug from request
        const { slug } = request.only(["slug"]);

        // check if slug is not empty
        if (!slug) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
        }

        // find announcement by slug
        const announcement = await Announcement.findBy("slug", slug);

        // if announcement is not found, return error
        if (!announcement) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Announcement not found"));
        }

        // check if user is authorized to create announcement
        const allows = await bouncer.forUser(user).with("AnnouncementPolicy").allows("canUpdateAnnouncement", announcement);
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        // get subject and content from request
        const { subject, content } = request.only(["subject", "content"]);

        // update announcement and save
        await announcement.merge({ subject, content }).save();

        // get cover image from request
        const coverImage = request.file("cover_image", {
            size: "2mb",
            extnames: ["jpg", "png", "jpeg", "gif"],
        });

        // cover image is optional
        let coverImageAttachment: boolean = false;

        // check if there is existing cover image
        const existingCoverImage = await announcement.getCoverAttachment();

        // if cover image is provided, move it to disk
        if (coverImage) {
            // check if cover image is valid
            if (!coverImage.isValid) {
                return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Invalid request"));
            }

            // if there is existing cover image, delete it
            if (existingCoverImage) {
                await existingCoverImage.deleteFile();
            }

            // move cover image to disk
            await coverImage.moveToDisk("./");
            coverImageAttachment = true;
        }

        // if cover image is provided, create attachment and attach with announcement
        if (coverImageAttachment && coverImage) {
            const attachment = await Attachment.create({
                clientName: coverImage.clientName,
                fileName: coverImage.fileName,
                filePath: coverImage.filePath,
                fileType: coverImage.extname,
                mimeType: coverImage.type + "/" + coverImage.subtype,
                referenceType: PolymorphicType.Announcement,
                referenceId: announcement.id,
            });

            // if attachment is not created, return error
            if (!attachment) {
                return response.status(500).send(Responses.createResponse({}, [ResponseCodes.UNKNOWN_ERROR], "Unknown error"));
            }
        }

        // return response
        return response.status(201).send(Responses.createResponse(Object.assign(announcement.serialize({
            fields: { pick: ["subject", "content", "slug", "published_at"] },
        }), { cover_url: (await announcement.coverUrl()) }), [ResponseCodes.SUCCESS_WITH_DATA], "Announcement created successfully"));
    }

    /**
     * Archive announcement
     * @param request
     * @param auth
     * @param bouncer
     * @param response
     */
    public async archive({ request, auth, bouncer, response }: HttpContextContract) {
        // Check if user is authenticated
        const user = await getLoggedInUser(auth);

        // If user is not authenticated, return error
        if (!user) {
            return response.status(401).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHENTICATED], "User not authenticated"));
        }

        // Get slug from request
        const { slug, is_archived } = request.only(["slug", "is_archived"]);

        // Find announcement by slug
        const announcement = await Announcement.withTrashed().where("slug", slug).first();

        // If announcement is not found, return error
        if (!announcement) {
            return response.status(404).send(Responses.createResponse({}, [ResponseCodes.DATA_NOT_FOUND], "Announcement not found"));
        }

        // Check if user is authorized to archive announcement
        const allows = await bouncer.forUser(user).with("AnnouncementPolicy").allows("canArchiveAnnouncement", announcement);
        if (!allows) {
            return response.status(403).send(Responses.createResponse({}, [ResponseCodes.USER_NOT_AUTHORIZED], "User not authorized"));
        }

        const announcementIsAlreadyArchived = announcement.deletedAt !== null;

        // Check if announcement is already archived
        if (announcementIsAlreadyArchived && is_archived) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Announcement is already archived"));
        } else if (!announcementIsAlreadyArchived && !is_archived) {
            return response.status(400).send(Responses.createResponse({}, [ResponseCodes.INVALID_REQUEST], "Announcement is already restored"));
        }

        // Archive or restore announcement
        if (is_archived && !announcementIsAlreadyArchived) {
            await announcement.delete();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Announcement archived successfully"));
        } else if (!is_archived && announcementIsAlreadyArchived) {
            await announcement.restore();
            return response.status(200).send(Responses.createResponse({}, [ResponseCodes.SUCCESS_WITH_NO_DATA], "Announcement restored successfully"));
        }
    }
}
