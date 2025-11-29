const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createArticleSchema, updateArticleSchema } = require("../validations/article");

router.post("/", auth, validate(createArticleSchema), articleController.create);
router.get("/", auth, articleController.list);
router.get("/:id", articleController.get);
router.put("/:id", auth, validate(updateArticleSchema), articleController.update);
router.delete("/:id", auth, articleController.remove);

module.exports = router;
