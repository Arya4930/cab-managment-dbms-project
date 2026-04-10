import express from "express";
import authRoutes from "./auth.js";
import bootstrapRoutes from "./bootstrap.js";
import bookingRoutes from "./bookings.js";
import cabRoutes from "./cabs.js";
import driverRoutes from "./drivers.js";
import earningsRoutes from "./earnings.js";
import feedbackRoutes from "./feedback.js";
import maintenanceRoutes from "./maintenance.js";
import paymentRoutes from "./payments.js";
import trackingRoutes from "./tracking.js";
import portalRoutes from "./portal.js";
import userRoutes from "./users.js";

const router = express.Router();

router.use(bootstrapRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(driverRoutes);
router.use(feedbackRoutes);
router.use(bookingRoutes);
router.use(maintenanceRoutes);
router.use(cabRoutes);
router.use(paymentRoutes);
router.use(earningsRoutes);
router.use(trackingRoutes);
router.use(portalRoutes);

export default router;
