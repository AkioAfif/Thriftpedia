const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const isObjectIdString = (value) =>
  typeof value === 'string' && OBJECT_ID_RE.test(value);

const hasOnlyKeys = (object, allowedKeys) =>
  Object.keys(object).every((key) => allowedKeys.includes(key));

module.exports = { isObjectIdString, hasOnlyKeys };
