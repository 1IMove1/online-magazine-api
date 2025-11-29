const Joi = require("joi");
const userRegistrationSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .required(),
  
  email: Joi.string()
    .email() 
    .required(),
    
  password: Joi.string()
    .min(8)
    .required(),
});

const updateMeSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .optional(),
});


module.exports = { 
  userRegistrationSchema,
  updateMeSchema 
};