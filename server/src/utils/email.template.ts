export const otpTemplate = (otp: Number) => `
    <div style= "font-family : Arial">
    <h2>Email Verification</h2>
    <p>Your otp is :</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
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