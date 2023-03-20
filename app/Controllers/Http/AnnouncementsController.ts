import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Announcement from "App/Models/Announcement";
import { getLoggedInUser } from "App/Helpers/Authentication";
import Responses, { ResponseCodes } from "App/Helpers/Responses";
import slugify from "slugify";
import { string } from "@ioc:Adonis/Core/Helpers";
import Attachment from "App/Models/Attachment";
import { PolymorphicType } from "App/Helpers/Polymorphism";
import ValidationException from "App/Exceptions/ValidationException";
import { validator } from "@ioc:Adonis/Core/Validator";
import CreateAnnouncementValidator, { CreateAnnouncementSchema } from "App/Validators/CreateAnnouncementValidator";
import UnknownErrorException from "App/Exceptions/UnknownErrorException";
import console from "console";
import { DateTime } from "luxon";

export default class AnnouncementsController {
    /**
     * Get all announcements or announcements matching the given criteria
     * @param response
     * @param request
     * @param auth
     * @param bouncer
     */
    public async index({ response, request, auth, bouncer }: HttpContextContract) {
        const { withArchived, withUnpublished, p, sd, ed } = request.qs();
        let allowed: boolean = false;

        if (withArchived || withUnpublished) {
            // check if user is authenticated
            const user = await getLoggedInUser(auth);
            if (!user) return Responses.sendUnauthenticatedResponse(response);

            // check if user is authorized to write announcements
            allowed = await bouncer.forUser(user).with("AnnouncementPolicy").allows("canWriteAnnouncement");
        }

        const announcements = await Announcement.query().if(allowed && withArchived, (query) => {
            query.withTrashed();
        }).if(allowed && !withUnpublished, (query) => {
            query.whereNotNull("published_at");
        }).if(p, (query) => {
            query.where("published_at", ">=", DateTime.now().minus({ days: p }).toISO());
        }).if(!p && sd && ed, (query) => {
            query.whereBetween("published_at", [DateTime.fromFormat(sd, "yyyy-MM-dd").toISO(), DateTime.fromFormat(ed, "yyyy-MM-dd").toISO()]);
        }).orderBy("published_at", "desc");

        // check if announcements exist
        if (!announcements.length) return response.status(404).send(Responses.createResponse(null, [ResponseCodes.DATA_NOT_FOUND], "No announcements found"));

        const serializedAnnouncements = await Promise.all(announcements.map(async (announcement) => {
            return Object.assign(announcement.serialize({
                fields: { pick: ["subject", "content", "slug", "published_at"] },
            }), { cover_url: (await announcement.coverUrl()) });
        }));

        // return response
        return response.status(201).send(Responses.createResponse(serializedAnnouncements, [ResponseCodes.SUCCESS_WITH_DATA], "Announcement fetched successfully"));
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
        if (!user) return Responses.sendUnauthenticatedResponse(response);

        // check if user is authorized to create announcement
        const allows = await bouncer.forUser(user).with("AnnouncementPolicy").allows("canWriteAnnouncement");
        if (!allows) return Responses.sendUnauthorizedResponse(response);

        const { form: _formRaw } = request.only(["form"]);
        const _form = JSON.parse(_formRaw);
        const cover = request.file("cover");

        let validatedData: CreateAnnouncementSchema;
        try {
            validatedData = await validator.validate({
                schema: CreateAnnouncementValidator.schema,
                data: {
                    form: _form,
                    cover,
                },
            });
        } catch (e) {
            throw new ValidationException(e.message, e.messages);
        }

        // create announcement
        const announcement = await Announcement.create({
            userId: user.id,
            slug: slugify(`${validatedData.form.subject} ${string.generateRandom(4)}`, { lower: true, strict: true }),
            subject: validatedData.form.subject,
            content: validatedData.form.content,
            isPublished: validatedData.form.publish,
            publishedAt: validatedData.form.publish ? DateTime.now() : null,
        });

        // create cover image attachment
        if (validatedData.cover) {
            try {
                await validatedData.cover.moveToDisk("./");
                await Attachment.create({
                    clientName: validatedData.cover.clientName,
                    fileName: validatedData.cover.fileName,
                    filePath: validatedData.cover.filePath,
                    fileType: validatedData.cover.extname,
                    mimeType: validatedData.cover.type + "/" + validatedData.cover.subtype,
                    referenceType: PolymorphicType.Announcement,
                    referenceId: announcement.id,
                });
            } catch (e) {
                throw new UnknownErrorException(e.message, e.messages);
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
     * @param request
     * @param bouncer
     * @param auth
     */
    public async show({ response, params, request, bouncer, auth }: HttpContextContract) {
        // Get slug from params
        const { slug } = params;
        if (!slug) return Responses.sendInvalidRequestResponse(response, "Slug is required");

        let allowed: boolean = false;
        if (!!request.header("Authorization")) {
            // check if user is authenticated
            const user = await getLoggedInUser(auth);
            if (user) {
                // check if user is authorized to write announcements
                allowed = await bouncer.forUser(user).with("AnnouncementPolicy").allows("canWriteAnnouncement");
            }
        }

        // Find announcement by slug
        const announcement = await Announcement.query().withTrashed().where("slug", slug).if(!allowed, (query) => {
            query.whereNotNull("published_at");
            query.whereNull("deleted_at");
        }).first();
        if (!announcement) return Responses.sendNotFoundResponse(response, "Announcement not found");

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
