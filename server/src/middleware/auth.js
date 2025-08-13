// Minimal auth/session helpers. In dev you can stub req.user.
module.exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};

module.exports.setUserSession = (req, user) => {
  req.session.user = { id: user.id, email: user.email, name: user.name };
};
