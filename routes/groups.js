// routes/groups.js (exemple corrigé)
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const validateObjectId = require('../middleware/validateObjectId');

router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.put('/:id', validateObjectId, groupController.updateGroup);
router.delete('/:id', validateObjectId, groupController.deleteGroup);
router.get('/groups/:id', async (req, res) => {
    try {
      const group = await Group.findOne({ id_groupe: req.params.id });
      if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });router.get('/', (req, res) => {
    res.json({ message: 'Liste des groupes' });
  });
module.exports = router;