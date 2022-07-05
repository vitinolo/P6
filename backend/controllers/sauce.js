const Sauce = require("../models/Sauce");
const fs = require("fs");

//création sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "sauce enregistrée !" }))
    .catch((error) => res.status(400).json({ error }));
};

//sélection une sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

//modifier une sauce
exports.modifySauce = (req, res, next) => {
  //si ma requête contient un fichier
  const sauceObject = req.file
    ? {
        //alors le fichier ressemble à ça: sinon (:) à ça:
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  //trouver l'ancienne image et la supprimer
  if (req.file) {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
            .then(() => {
              res.status(200).json({ message: "Sauce mise à jour!" });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        });
      })
      .catch((error) => {
        res.status(500).json({ error });
      });
    //la mettre à jour
  } else {
    Sauce.updateOne(
      { _id: req.params.id },
      { ...sauceObject, _id: req.params.id }
    )
      .then(() => res.status(200).json({ message: "Sauce mise à jour!" }))
      .catch((error) => res.status(400).json({ error }));
  }
};

//supprimer une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

//voir toutes les sauces
exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//création des likes, dislikes et modification
exports.createLike = (req, res) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      const userId = req.body.userId;
      const userWantsToLike = req.body.like == 1;
      const userWantsToDislike = req.body.like == -1;
      const userWantsToClear = req.body.like == 0;

      if (userWantsToDislike) {
        sauce.usersDisliked.push(userId);
      }
      if (userWantsToLike) {
        sauce.usersLiked.push(userId);
      }
      if (userWantsToClear) {
        if (sauce.usersLiked.includes(userId)) {
          const index = sauce.usersLiked.indexOf(userId);
          sauce.usersLiked.splice(index, 1);
        }
        if (sauce.usersDisliked.includes(userId)) {
          const index = sauce.usersDisliked.indexOf(userId);
          sauce.usersDisliked.splice(index, 1);
        }
      }
      sauce.likes = sauce.usersLiked.length;
      sauce.dislikes = sauce.usersDisliked.length;
      sauce.save();
      return sauce;
    })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => {
      res.status(500).json({ error });
    });
};
