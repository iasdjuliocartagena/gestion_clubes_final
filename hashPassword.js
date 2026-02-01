const bcrypt = require("bcrypt");

const password = process.argv[2];

if (!password) {
  console.log("Uso: node hashPassword.js TU_CONTRASEÑA");
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log("Password hasheada:\n", hash);
});
