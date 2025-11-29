module.exports = {
  getMe: async (req, res) => {
    const user = req.user.toObject();
    delete user.password;
    delete user.confirmationToken;
    res.json(user);
  },
  updateMe: async (req, res) => {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;
    Object.assign(req.user, updates);
    await req.user.save();
    const user = req.user.toObject();
    delete user.password;
    delete user.confirmationToken;
    res.json(user);
  },
};
