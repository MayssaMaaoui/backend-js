const Group = require('../models/Group');
const User = require('../models/User'); // Ajouté
const Counter = require('../models/Counter'); // Ajouté
exports.createGroup = async (req, res) => {
  try {
    // Trouver le dernier ID valide de manière sécurisée
    const lastGroup = await Group.findOne({ id_groupe: { $exists: true, $type: 'number' } })
                                  .sort({ id_groupe: -1 })
                                  .select('id_groupe');

    // Calculer le nouvel ID en toute sécurité
    const newId = lastGroup?.id_groupe ? lastGroup.id_groupe + 1 : 1;

    // Créer le groupe avec validation stricte
    const group = new Group({
      id_groupe: newId,
      name_groupe: req.body.name_groupe
    });

    await group.save();
    res.status(201).json(group);

  } catch (error) {
    res.status(400).json({
      message: "Erreur de création du groupe",
      details: error.errors || error.message
    });
  }
};
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().select('id_groupe name_groupe');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateGroup = async (req, res) => {
  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    // Vérifier les utilisateurs avec l'ID numérique
    const users = await User.find({ groupe: group.id_groupe });
    if (users.length > 0) {
      return res.status(400).json({ 
        message: 'Supprimez d\'abord les utilisateurs du groupe' 
      });
    }
    
    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Groupe supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }};