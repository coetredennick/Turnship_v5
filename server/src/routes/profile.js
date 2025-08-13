const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');


router.get('/', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.session.user.id } });
  res.json(profile || {});
});

router.put('/', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const data = req.body || {};
  const saved = await prisma.profile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });
  res.json(saved);
});

module.exports = router;
