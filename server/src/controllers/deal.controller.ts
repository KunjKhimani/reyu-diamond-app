import type { Request, Response } from "express";
import sendResponse from "../utils/api.response.js";
import {
  createDealService,
  getDealByIdService,
  getallDealsService,
  updateDealStatusService,
  dealDownloadService
} from "../services/deal.service.js";
import { uploadBufferToCloudinary } from "../services/cloudinary.service.js";
import { htmlToPdfBuffer } from "../services/pdf.service.js";
import { getDealInvoiceHtml } from "../templates/deal-invoice.template.js";
import User from "../models/User.model.js";

export const dealCreation = async (req: Request, res: Response) => {
  try {
    const bidId = req.params.bidId as string;
    const userId = (req as any).user?.id as string | undefined;

    if (!bidId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Bid ID is required",
      });
    }

    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const deal = await createDealService(bidId, userId);

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Deal created successfully",
      data: deal,
    });
  } catch (error: any) {
    const msg = error?.message as string | undefined;

    switch (msg) {
        case "Invalid bid id":
            return sendResponse({
            res,
            statusCode: 400,
            success: false,
            message: msg,
            });

        case "Deal already exists for this bid":
            return sendResponse({
            res,
            statusCode: 409,
            success: false,
            message: msg,
            });

        case "Bid not found":
        case "Inventory not found":
            return sendResponse({
            res,
            statusCode: 404,
            success: false,
            message: msg,
            });

        case "You are not authorized to create a deal for this bid":
            return sendResponse({
            res,
            statusCode: 403,
            success: false,
            message: msg,
            });

        default:
            return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: "Failed to create deal",
            errors: msg ?? "Something went wrong",
            });
        }
    }
};

export const dealDetailsById = async (req: Request, res: Response) => {
  try {
    const dealId = req.params.dealId as string;
    const userId = (req as any).user?.id as string | undefined;
    const role = (req as any).userRole as "admin" | "user" | undefined;

    if (!dealId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Deal ID is required",
      });
    }

    if (!userId || !role) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const deal = await getDealByIdService(
      dealId,
      userId as string,
      role as "admin" | "user"
    );

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Deal fetched successfully",
      data: deal,
    });
  } catch (error: any) {
    const msg = error?.message as string | undefined;

    if (msg === "Invalid deal id") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: msg,
      });
    }

    if (msg === "Deal not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: msg,
      });
    }

    if (msg === "You are not authorized to view this deal") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: msg,
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch deal",
      errors: msg ?? "Something went wrong",
    });
  }
}

export const getAllBids = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    const role = (req as any).userRole as "admin" | "user" | undefined;

    if (!userId || !role) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const deals = await getallDealsService(userId as string, role as "admin" | "user");

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Deals fetched successfully",
      data: deals,
    });
  } catch (error: any) {
    const msg = error?.message as string | undefined;
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch deals",
      errors: msg ?? "Something went wrong",
    });
  }
};

export const updateDealStatus = async (req: Request, res: Response) => {
  try {    
    const dealId = req.params.dealId as string;
    const { status } = req.body;
    
    const userId = (req as any).user?.id as string | undefined;
    const role = (req as any).userRole as "admin" | "user" | undefined;

    if (!dealId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Deal ID is required",
      });
    }

    const allowedStatuses = [
      "CREATED",
      "PAYMENT_PENDING",
      "IN_ESCROW",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "DISPUTED",
      "CANCELLED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message:
          "Status is required and must be one of: " + allowedStatuses.join(", "),
      });
    }

    if (!userId || !role) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const updatedDeal = await updateDealStatusService(
      dealId,
      status as any,
      userId as string,
      role as "admin" | "user"
    );

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Deal status updated successfully",
      data: updatedDeal,
    });
  } catch (error: any) {
    const msg = error?.message as string | undefined;

    if (msg === "Invalid deal id") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: msg,
      });
    }

    if (msg === "Deal not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: msg,
      });
    }

    if (msg === "You are not authorized to update this deal") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: msg,
      });
    }

    if (msg === "Deal is already completed or cancelled and cannot be changed") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: msg,
      });
    }

    if (msg === "Only admin can change status of a disputed deal") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: msg,
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update deal status",
      errors: msg ?? "Something went wrong",
    });
  }
};

export const downloadPDF = async (req: Request, res: Response) => {
  try {
    const dealIdParam = req.params.dealId as string | string[] | undefined;
    const dealId = Array.isArray(dealIdParam) ? dealIdParam[0] : dealIdParam;
    const userId = (req as any).user?.id as string | undefined;
    const role = (req as any).userRole as "admin" | "user" | undefined;

    if (!dealId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Deal ID is required",
      });
    }

    const deal = await getDealByIdService(
      dealId,
      userId as string,
      role as "admin" | "user"
    );

    const html = getDealInvoiceHtml(deal);
    const pdfBuffer = await htmlToPdfBuffer(html);

    const cloudUrl = await uploadBufferToCloudinary(
      pdfBuffer,
      "deal-summaries",
      `deal-${deal._id}`
    );

    // Always use .pdf extension so OS and clients recognize the file type
    const safeId = String(deal._id).replace(/[^a-zA-Z0-9-]/g, "");
    const pdfFilename = `deal-${safeId}.pdf`;

    await dealDownloadService(deal, cloudUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfFilename}"; filename*=UTF-8''${encodeURIComponent(pdfFilename)}`
    );
    res.setHeader("X-Suggested-Filename", pdfFilename);
    res.setHeader("X-Deal-Pdf-Url", cloudUrl);
    res.status(200);
    return res.end(pdfBuffer, "binary");
  } catch (error: any) {
    const msg = error?.message as string | undefined;

    if (msg === "Invalid deal id") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: msg,
      });
    }
    if (msg === "Deal not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: msg,
      });
    }
    if (msg === "You are not authorized to view this deal") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: msg,
      });
    }
    console.log(error)
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to generate deal PDF",
      errors: msg ?? "Something went wrong",
    });
  }
};