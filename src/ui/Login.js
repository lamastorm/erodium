export class Login {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.createUI();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'loginOverlay';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '1000';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';

        this.container.innerHTML = `
            <h1 style="margin-bottom: 2rem;">Erodium MMORPG</h1>
            <div id="googleBtn"></div>
            <div id="usernameForm" style="display:none; text-align:center;">
                <p>Choose your username:</p>
                <input type="text" id="usernameInput" placeholder="Username" style="padding: 10px; font-size: 16px; margin-bottom: 10px;">
                <br>
                <button id="submitUsername" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Start Game</button>
            </div>
            <p id="loginStatus" style="margin-top: 1rem; color: #aaa;"></p>
        `;

        document.body.appendChild(this.container);

        // Initialize Google Button
        // Wait for script to load
        const interval = setInterval(() => {
            if (window.google) {
                clearInterval(interval);
                window.google.accounts.id.initialize({
                    client_id: '715880740963-ucde4m53hrtct7dm04u3nlhr81a1l1au.apps.googleusercontent.com',
                    callback: (response) => this.handleCredentialResponse(response)
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('googleBtn'),
                    { theme: 'outline', size: 'large' }
                );
            }
        }, 100);

        // Username submit handler
        document.getElementById('submitUsername').onclick = () => this.submitUsername();
    }

    async handleCredentialResponse(response) {
        document.getElementById('loginStatus').innerText = 'Verifying...';

        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                if (data.needsUsername) {
                    this.showUsernameForm();
                } else {
                    this.startGame(data);
                }
            } else {
                document.getElementById('loginStatus').innerText = 'Login Failed: ' + data.message;
            }
        } catch (err) {
            console.error(err);
            document.getElementById('loginStatus').innerText = 'Error connecting to server';
        }
    }

    showUsernameForm() {
        document.getElementById('googleBtn').style.display = 'none';
        document.getElementById('usernameForm').style.display = 'block';
        document.getElementById('loginStatus').innerText = '';
    }

    async submitUsername() {
        const username = document.getElementById('usernameInput').value;
        const token = localStorage.getItem('token');
        if (!username || !token) return;

        try {
            const res = await fetch('/api/auth/username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer ' + token // Ideally use header
                },
                body: JSON.stringify({ username, token }) // Sending token in body as per route
            });
            const data = await res.json();

            if (data.success) {
                this.startGame(data);
            } else {
                document.getElementById('loginStatus').innerText = data.message;
            }
        } catch (err) {
            document.getElementById('loginStatus').innerText = 'Error instantiating user';
        }
    }

    startGame(userData) {
        this.container.style.display = 'none';
        if (this.game) {
            // Pass user data to game (e.g. for socket connection)
            this.game.start(userData);
        }
    }

    show() {
        this.container.style.display = 'flex';
    }
}
