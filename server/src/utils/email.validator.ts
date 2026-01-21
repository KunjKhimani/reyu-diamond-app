import validator from "validator";

const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export default isValidEmail;
