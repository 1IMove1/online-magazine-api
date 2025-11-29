const Joi = require("joi");

const createArticleSchema = Joi.object({
  title: Joi.string().min(3).required(),
  content: Joi.string().min(10).required(),
  published: Joi.boolean().optional(),
});

const updateArticleSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  content: Joi.string().min(10).optional(),
  published: Joi.boolean().optional(),
});

module.exports = { createArticleSchema, updateArticleSchema };
