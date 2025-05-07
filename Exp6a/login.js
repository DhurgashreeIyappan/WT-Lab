const http = require('http');
const querystring = require('querystring');
const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("student").collection("values");
  }
  return db;
}

async function registerUser(username, password) {
  const users = await connectDB();
  const existing = await users.findOne({ username });

  if (existing) return false; 

  await users.insertOne({ username, password });
  return true;
}

async function checkLogin(username, password) {
  const users = await connectDB();
  const user = await users.findOne({ username });
  return user && user.password === password;
}

async function updatePassword(username, newPassword) {
  const users = await connectDB();
  const result = await users.updateOne({ username }, { $set: { password: newPassword } });
  return result.modifiedCount > 0;
}

async function deleteUser(username) {
  const users = await connectDB();
  const result = await users.deleteOne({ username });
  return result.deletedCount > 0;
}

http.createServer(async (req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk.toString());

  req.on('end', async () => {
    const data = querystring.parse(body);
    const { username, password, newPassword } = data;

    if (req.method === 'POST' && req.url === '/register') {      
      if (!username || !password) return sendResponse(res, 400, "Username and password required.");
      const success = await registerUser(username, password);
      sendResponse(res, success ? 201 : 409, success ? "User registered successfully!" : "Username already exists.");
    
    } else if (req.method === 'POST' && req.url === '/login') {
      if (!username || !password) return sendResponse(res, 400, "Username and password required.");
      const success = await checkLogin(username, password);
      sendResponse(res, success ? 200 : 401, success ? `Welcome, ${username}!` : "Login failed.");
    
    } else if (req.method === 'POST' && req.url === '/update_password') { 
      if (!username || !password || !newPassword) return sendResponse(res, 400, "Username, current password, and new password required.");
      const loginSuccess = await checkLogin(username, password);
      if (!loginSuccess) return sendResponse(res, 401, "Incorrect username or password.");
      const success = await updatePassword(username, newPassword);
      sendResponse(res, success ? 200 : 500, success ? "Password updated successfully!" : "Error updating password.");
    
    } else if (req.method === 'POST' && req.url === '/delete_user') { 
      if (!username) return sendResponse(res, 400, "Username required.");
      const success = await deleteUser(username);
      sendResponse(res, success ? 200 : 404, success ? "User deleted successfully!" : "User not found.");
    
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
        <body>
          <h2>User Management</h2>
          <form id="userForm" method="post">
          <label>Username: <input type="text" name="username" required></label><br>
          <label>Password: <input type="password" name="password" required></label><br>
          <label>New Password (to update): <input type="password" name="newPassword"></label><br>

          <button type="submit" formaction="/login">Login</button>
          <button type="submit" formaction="/register">Register</button>
          <button type="submit" formaction="/update_password">Update Password</button>
          <button type="submit" formaction="/delete_user">Delete User</button>
        </form>
        </body>
        </html>
      `);
    }
  });
}).listen(8080, () => console.log('Server running on port 8080'));

function sendResponse(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(`<h1>${message}</h1>`);
}
