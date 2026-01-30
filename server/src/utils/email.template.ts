export const otpTemplate = (otp: Number) => `
    <div style= "font-family : Arial">
    <h2>Email Verification</h2>
    <p>Your otp is :</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
    </div>
`;

export const forgotPasswordTemplate = (resetLink: string) => `
    <div style="font-family: Arial; max-width: 500px;">
        <h2>Reset your password</h2>
        <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Reset password</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
        <p style="color: #64748b; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br/>${resetLink}</p>
    </div>
`;

export const sendToAdminTemplate = (user: { _id: string, username: string; email: string; role: string }) => `
    <div style= "font-family : Arial">
        <h2>New User Registration Pending Approval</h2>
        <p>A new user has registered and is pending your approval:</p>
            <ul>
                <li><strong>UserId:</strong> ${user._id}</li>
                <li><strong>Username:</strong> ${user.username}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role}</li>
            </ul>
        <p>Please review and approve the account at your earliest convenience.</p>
    </div>
`;