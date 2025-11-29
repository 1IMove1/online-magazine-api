module.exports = {
  confirmationEmail: (name, token) => `
    <h2>Welcome, ${name}!</h2>
    <p>Thank you for registering. Please confirm your email by clicking the link below:</p>
    <a href="${process.env.BASE_URL}/api/auth/confirm?token=${token}">Confirm Email</a>
  `,
};
