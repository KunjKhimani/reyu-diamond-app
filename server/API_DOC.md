# Reyu Diamond App - API Documentation

This document provides a comprehensive overview of the REST API endpoints for the Reyu Diamond App backend.

## Base URL
`{{BACKEND_URL}}/api`

---

## 🔐 Authentication & Profile
**Base Route:** `/auth`

| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user and send verification OTP. | `registerSchema` |
| `POST` | `/login` | Authenticate user and return JWT token. | `loginSchema` |
| `POST` | `/logout` | Invalidate current session (client-side token removal). | `protect` |
| `POST` | `/verify-otp` | Verify user's email via OTP. | `verifyOtpSchema` |
| `POST` | `/resend-otp` | Resend verification OTP to email. | `resendOtpSchema` |
| `POST` | `/forget-password` | Send password reset link to email. | `forgetPasswordSchema` |
| `POST` | `/reset-password` | Reset password using token from email. | `resetPasswordSchema` |
| `GET` | `/profile` | Retrieve the authenticated user's profile. | `protect` |
| `PUT` | `/profile` | Update user profile information (username, FCM token). | `protect`, `updateProfileSchema` |

---

## 🛡️ Admin Management
**Base Route:** `/admin`
*Requires `isAdmin` and `authMiddleware`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/kyc/:userId` | Review (Approve/Reject) a user's KYC submission. |
| `GET` | `/kycs` | List all KYC submissions. |
| `PATCH` | `/users/:userId/status` | Update a user's account status (Activate/Deactivate). |
| `GET` | `/users` | Retrieve all registered users. |
| `GET` | `/bids/:auctionId/:userId` | Get specific auction bids by a user. |
| `GET` | `/bids/:userId` | Get all bids belonging to a specific user. |
| `GET` | `/ratings-and-badges` | View all user ratings and badges. |

---

## 💎 Inventory (Diamonds)
**Base Route:** `/inventory`

| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create a new diamond inventory item with images/video. | `protect`, `kycVerifiedOnly`, `upload`, `createInventorySchema` |
| `GET` | `/` | Retrieve all available diamond inventories. | Public |
| `GET` | `/:id` | Get details of a specific diamond inventory. | Public |
| `PUT` | `/:id` | Update diamond details. | `protect`, `kycVerifiedOnly`, `updateInventorySchema` |
| `DELETE` | `/:id` | Remove a diamond from inventory (Owner/Admin only). | `protect`, `kycVerifiedOnly`, `ownerOrAdmin` |

---

## 🔨 Auctions & Bids
**Base Routes:** `/auction`, `/bid`
*Most actions require `kycVerifiedOnly`*

### Auctions
| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/:inventoryId` | Start an auction for an inventory item. | `ownerOrAdmin`, `createAuctionSchema` |
| `GET` | `/` | List all active auctions. | `protect` |
| `GET` | `/:auctionId` | Get detailed information about an auction. | `protect` |
| `PUT` | `/:auctionId` | Update auction parameters (Start/End time, Price). | `ownerOrAdmin`, `updateAuctionSchema` |
| `DELETE` | `/:auctionId` | Cancel/Delete an auction. | `ownerOrAdmin` |

### Bids
| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/:auctionId` | Place a bid on an active auction. | `createBidSchema` |
| `GET` | `/:auctionId` | Get all bids for a specific auction. | `protect` |
| `GET` | `/:auctionId/my-bid` | Retrieve the authenticated user's bid for an auction. | `protect` |
| `PATCH` | `/:bidId/status` | Update bid status (Accept/Reject). | `updateBidStatusSchema` |

---

## 🤝 Deals & Disputes
**Base Route:** `/deal`

| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/:bidId` | Initialize a deal based on an accepted bid. | `protect`, `kycVerifiedOnly` |
| `GET` | `/:dealId` | View specific deal details. | `canAccessDeal` |
| `GET` | `/` | List all deals related to the user. | `protect` |
| `PATCH` | `/:dealId` | Update deal progress/status. | `canAccessDeal`, `updateDealStatusSchema` |
| `POST` | `/:dealId/pdf` | Generate and download deal invoice/receipt. | `canAccessDeal` |
| `PATCH` | `/:dealId/cancel` | Cancel an ongoing deal. | `canAccessDeal` |
| `PATCH` | `/:dealId/dispute` | Raise a formal dispute for a deal. | `raiseDisputeSchema` |
| `PATCH` | `/:dealId/resolve-dispute` | Resolve a dispute (Admin only). | `isAdmin`, `resolveDisputeSchema` |

---

## 📝 Requirements
**Base Route:** `/requirements`
*Allows users to post what they are looking for*

| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Post a new diamond requirement. | `createRequirementSchema` |
| `PUT` | `/:id` | Edit an existing requirement. | `ownerOrAdmin`, `updateRequirementSchema` |
| `GET` | `/` | List all requirements (Admin only). | `isAdmin` |
| `GET` | `/my-requirement` | List the authenticated user's requirements. | `protect` |
| `DELETE` | `/:id` | Remove a requirement. | `ownerOrAdmin` |

---

## 🆔 KYC (Know Your Customer)
**Base Route:** `/kyc`

| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/submit` | Submit identity documents for verification. | `authMiddleware`, `upload.any()`, `submitKycSchema` |

---

## 💳 Payments (Stripe)
**Base Route:** `/stripe`

| Method | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- |
| `POST` | `/onboard` | Link user account with Stripe for payouts. | `protect` |
| `POST` | `/payment-intent` | Initiate a payment for a deal. | `initiatePaymentSchema` |
| `POST` | `/release-payment` | Release funds from escrow to seller. | `releaseEscrowSchema` |
| `POST` | `/refund-escrow` | Refund funds from escrow to buyer. | `refundEscrowSchema` |
| `POST` | `/buyer-confirm` | Buyer confirms receipt of goods. | `buyerConfirmDeliverySchema` |
| `POST` | `/webhook` | Stripe event handlers (internal use). | Public/Stripe IP |

---

## 💬 Communication
**Routes:** `/chat`, `/message`, `/notifications`

### Chat & Messaging (REST API)
| Method | Route | Endpoint | Description | Middleware/Validation |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/chat` | `/conversations` | Start a new chat conversation. | `protect`, `kycVerifiedOnly`, `createConversationSchema` |
| `GET` | `/chat` | `/conversations` | Get all user conversations. | `protect`, `kycVerifiedOnly` |
| `PUT` | `/chat` | `/conversations/:id/read` | Mark a conversation as read. | `protect`, `kycVerifiedOnly` |
| `POST` | `/message` | `/` | Send a message (Text/Media). | `protect`, `kycVerifiedOnly`, `upload.any()`, `sendMessageSchema` |
| `GET` | `/message` | `/:conversationId` | Get messages for a specific chat conversation. | `protect`, `kycVerifiedOnly` |
| `DELETE`| `/message` | `/:messageId` | Delete a specific message. | `protect`, `kycVerifiedOnly` |

### Chat & Messaging (WebSocket)
**Connection URL:** `<BACKEND_URL>` (Using Socket.IO)

*Authentication:* Pass the JWT token either in `auth.token` or `headers.authorization` during the initial handshake.

| Event (Emit/On) | Payload | Description |
| :--- | :--- | :--- |
| `connection` | N/A | Connect to the WebSocket server. User automatically joins a personal room `(userId)`. |
| `join_conversation` | `conversationId` (string) | Join a specific chat room to receive its real-time messages. |
| `leave_conversation`| `conversationId` (string) | Leave a specific chat room. |
| `disconnect` | N/A | Disconnect from the WebSocket server. |

### Notifications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/notifications` | Get user notifications. |
| `PATCH` | `/:notificationId/read` | Mark one notification as read. |
| `PATCH` | `/read-all` | Mark all notifications as read. |

---

## 📈 Analytics & Marketing
**Base Routes:** `/analytics`, `/advertisement`

### Analytics (Admin)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard` | Overall system statistics. |
| `GET` | `/revenue` | Financial/Revenue growth analytics. |

### Advertisements
| Method | Endpoint | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List all approved advertisements. | `protect` |
| `POST` | `/` | Create a new advertisement. | `owner` (of inventory item) |
| `PATCH` | `/:id/status` | Approve/Reject advertisement. | `isAdmin` |

---

## 📜 System Logs (Admin)
**Base Route:** `/log`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin` | View administrative activity logs. |
| `GET` | `/system` | View system error and event logs. |
| `GET` | `/system/stats`| Summary of system performance and logs. |

---

---

## 📖 Module-wise Functionality Breakdown

### 1. 🔐 Authentication & Security Module
*   **Purpose**: Manages user lifecycle, security, and session integrity.
*   **Key Workflows**:
    *   **Secure Registration**: Uses password hashing and email-based OTP verification to prevent bot accounts.
    *   **JWT Session Management**: Issues signed tokens upon login/verification for stateless authorization.
    *   **Account Recovery**: Implements a standard forgot/reset password flow using time-sensitive signed links.
    *   **Profile Control**: Allows users to manage their identity (username) and register push notification tokens (FCM).

### 2. 🆔 KYC (Know Your Customer) Module
*   **Purpose**: Establishes trust and compliance within the marketplace.
*   **Key Workflows**:
    *   **Identity Submission**: Users upload government ID and business documents via a multi-part form.
    *   **Verification Guard**: Most marketplace actions (listing, bidding) are gated by `kycVerifiedOnly` middleware, ensuring only vetted users can trade.
    *   **Admin Audit**: Admins manually review submissions to approve or reject based on document validity.

### 3. 💎 Inventory Module
*   **Purpose**: The central repository for all diamond assets listed on the platform.
*   **Key Workflows**:
    *   **Rich Asset Upload**: Supports multiple images and video attachments per diamond entry.
    *   **Data Accuracy**: Validates diamond attributes (carat, color, clarity, etc.) against strict schemas.
    *   **Ownership Integrity**: Ensures only the original seller or an admin can modify/delete an inventory item.

### 4. 🔨 Auction & Bidding Module
*   **Purpose**: Facilitates dynamic price discovery and competitive buying.
*   **Key Workflows**:
    *   **Auction Creation**: Sellers convert their static inventory items into live auctions with reserve prices and durations.
    *   **Bidding Engine**: Buyers place bids which are tracked in real-time. Only KYC-verified buyers can participate.
    *   **Bid Management**: Sellers can accept a bid to lock in a price, which automatically halts the auction and initiates the Deal phase.

### 5. 🤝 Deal & Transaction Module
*   **Purpose**: Manages the post-auction workflow from agreement to final settlement.
*   **Key Workflows**:
    *   **Deal Initialization**: Triggered when a bid is accepted; it creates a formal contract between buyer and seller.
    *   **State Machine Management**: Tracks deal progress through various stages: `Pending`, `Paid`, `Shipped`, `Completed`, or `Disputed`.
    *   **PDF Documentation**: Automatically generates professional invoices/receipts for both parties.

### 6. 💳 Payment & Escrow Module (Stripe Integration)
*   **Purpose**: Provides secure, trustless financial transactions.
*   **Key Workflows**:
    *   **Buyer Escrow**: Funds are captured from the buyer via Stripe Payment Intents and held securely ('Escrow').
    *   **Seller Onboarding**: Uses Stripe Connect to verify seller bank accounts for payouts.
    *   **Conditional Release**: Funds are only released to the seller after the buyer confirms receipt, protecting both parties from fraud.

### 7. 💬 Communication & Notification Module
*   **Purpose**: Keeps users engaged and informed in real-time.
*   **Key Workflows**:
    *   **Real-time Chat**: Private messaging channels between buyers and sellers to discuss specifics.
    *   **Multimodal Notifications**: Combines in-app alerts with Firebase (FCM) push notifications for critical events (new bids, deal updates).
    *   **Read Tracking**: Ensures users stay updated by tracking message and notification read states.

### 8. 🛡️ Admin & Analytics Module
*   **Purpose**: Global oversight, platform maintenance, and business intelligence.
*   **Key Workflows**:
    *   **System Auditing**: Provides granular logs of every administrative and system-level event for security audits.
    *   **Business Intelligence**: Dahsboard stats and revenue analytics provide insights into platform growth and financial performance.
    *   **User Governance**: Admins can activate/deactivate accounts and resolve high-level disputes.
