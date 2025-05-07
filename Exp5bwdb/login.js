const http = require('http');

const users = []; 

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });

    if (req.method === 'GET') {
        if (req.url === '/') {
            return res.end(`
                <h2>Sign Up</h2>
                <form action="/signup">
                    <input type="text" name="username" placeholder="Username" required>
                    <br>
                    <input type="password" name="password" placeholder="Password" required>
                    <br>
                    <button type="submit">Sign Up</button>
                </form>
            `);
        }

        if (req.url.startsWith('/signup')) {
            const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const username = query.get('username');
            const password = query.get('password');

            if (username && password) {
                users.push({ username, password });
                return res.end('<h2>Sign Up Successful</h2><a href="/login">Login Here</a>');
            }
            return res.end('<h2>Invalid Input</h2><a href="/">Go Back</a>');
        }

        if (req.url === '/login') {
            return res.end(`
                <h2>Login</h2>
                <form method="POST">
                    <input type="text" name="username" placeholder="Username" required>
                    <br>
                    <input type="password" name="password" placeholder="Password" required>
                    <br>
                    <button type="submit">Login</button>
                </form>
            `);
        }
    }

    if (req.method === 'POST' && req.url === '/login') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const username = params.get('username');
            const password = params.get('password');
            const user = users.find(u => u.username === username && u.password === password);

            res.end(user ? '<h2>Login Successful</h2>' : '<h2>Login Failed</h2>');
        });
    }
});

server.listen(8080, () => console.log('Server running on port 8080'));
