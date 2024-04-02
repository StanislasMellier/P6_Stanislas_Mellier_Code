const dotenv = require('dotenv');
const fs = require('fs');
const Sauce = require('../models/sauceModel');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then((sauces) => {
            res.status(200).send(sauces)
        })
        .catch((error) => { res.status(400).json({ error }) });
};
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => { res.status(200).json(sauce) })
        .catch((error) => { res.status(404).json({ error }) });
};
exports.createSauce = (req, res, next) => {
    const sauceObj = JSON.parse(req.body.sauce)
    const sauce = new Sauce({
        ...sauceObj,
        likes: 0,
        dislikes: 0,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => { res.status(201).json({ message: "Sauce enregistré." }) })
        .catch((error) => res.status(400).json({ error }))
};
exports.modifySauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (!sauce) {
                return res.status(404).json({ error: new Error('Sauce non trouvé.') });
            }
            if (sauce.userId !== req.auth.userId) {
                return res.status(403).json({ error: new Error('unauthorized request.') })
            }
            const sauceObj = req.file ? {
                ...JSON.parse(req.body.sauce),
                imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            } : { ...req.body };

            if (req.file) {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, (err) => { if (err) { throw err } });
            }

            Sauce.updateOne({ _id: req.params.id }, { ...sauceObj, _id: req.params.id })
                .then(() => { res.status(200).json({ message: 'Sauce modifié.' }) })
                .catch((error) => { res.status(400).json({ error }) })
        }).catch((error) => { res.status(500).json({ error }) });
};
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (!sauce) {
                return res.status(404).json({ error: new Error('Sauce non trouvé.') });
            }
            if (sauce.userId !== req.auth.userId) {
                return res.status(403).json({ error: new Error('unauthorized request.') })
            }
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => { res.status(200).json({ message: 'Sauce supprimé.' }) })
                    .catch((error) => { res.status(400).json({ error }) })
            });
        }).catch((error) => { res.status(500).json({ error }) });
};
exports.sendLikeStatus = (req, res, next) => {
    if (!req.body || req.body.like == undefined || !req.body.userId) {
        return res.status(400).json({ error: new Error('Bad Request') });
    }
    if (req.body.userId != req.auth.userId) {
        return res.status(403).json({ error: new Error('unauthorized request.') })
    }
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            const like = req.body.like;
            const userId = req.body.userId;

            switch (like) {
                case 1:
                    if (sauce.usersLiked.indexOf(userId) == -1) {
                        sauce.likes += 1;
                        sauce.usersLiked.push(userId)
                    }
                    break;
                case 0:
                    if (sauce.usersLiked.indexOf(userId) != -1) {
                        sauce.likes -= 1;
                        let pos = sauce.usersLiked.indexOf(userId);
                        sauce.usersLiked.splice(pos, 1)
                    } else if (sauce.usersDisliked.indexOf(userId) != -1) {
                        sauce.dislikes -= 1;
                        let pos = sauce.usersDisliked.indexOf(userId);
                        sauce.usersDisliked.splice(pos, 1)
                    }
                    break;
                case -1:
                    if (sauce.usersDisliked.indexOf(userId) == -1) {
                        sauce.dislikes += 1;
                        sauce.usersDisliked.push(userId)
                    }
                    break;
            }
            Sauce.updateOne({ _id: req.params.id }, sauce)
                .then(() => { res.status(200).json({ message: 'Like status mis à jour' }) })
                .catch((error) => { res.status(400).json({ error }) })
        })
        .catch((error) => { res.status(404).json({ error }) });
};
