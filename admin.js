const ADMIN_USER = "admin";
const ADMIN_PASS = "showflix123";

function checkAdmin(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="ShowFlix Admin"');
    return res.status(401).send("Admin login required");
  }

  const decoded = Buffer.from(
    auth.split(" ")[1],
    "base64"
  ).toString();

  const [user, pass] = decoded.split(":");

  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    res.setHeader("WWW-Authenticate", 'Basic realm="ShowFlix Admin"');
    return res.status(401).send("Wrong admin username or password");
  }

  next();
}

module.exports = {
  checkAdmin,
  ADMIN_USER,
  ADMIN_PASS
};
