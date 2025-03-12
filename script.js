const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

let selectedBall = null;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// Constants for physics
const MAX_VELOCITY = 15;
const MIN_VELOCITY = 0.01;

class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = (Math.random() - 0.5) * 8;
        this.mass = radius;
        this.restitution = 0.8;
    }

    limitVelocity() {
        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (speed > MAX_VELOCITY) {
            const scale = MAX_VELOCITY / speed;
            this.dx *= scale;
            this.dy *= scale;
        }
        
        if (Math.abs(this.dx) < MIN_VELOCITY) this.dx = 0;
        if (Math.abs(this.dy) < MIN_VELOCITY) this.dy = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        if (this === selectedBall) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    }

    containsPoint(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    resolveCollision(otherBall) {
        const dx = otherBall.x - this.x;
        const dy = otherBall.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        if (distance > this.radius + otherBall.radius) return;

        const nx = dx / distance;
        const ny = dy / distance;

        const rx = this.dx - otherBall.dx;
        const ry = this.dy - otherBall.dy;

        const velAlongNormal = rx * nx + ry * ny;

        if (velAlongNormal > 0) return;

        const combinedRestitution = Math.min(this.restitution, otherBall.restitution);

        const j = -(1 + combinedRestitution) * velAlongNormal;
        const impulseScalar = j / (1/this.mass + 1/otherBall.mass);

        const maxImpulse = MAX_VELOCITY * Math.max(this.mass, otherBall.mass);
        const clampedImpulse = Math.min(Math.abs(impulseScalar), maxImpulse) * Math.sign(impulseScalar);

        const impulseX = nx * clampedImpulse;
        const impulseY = ny * clampedImpulse;

        if (this !== selectedBall) {
            this.dx -= impulseX / this.mass;
            this.dy -= impulseY / this.mass;
            this.limitVelocity();
        }
        if (otherBall !== selectedBall) {
            otherBall.dx += impulseX / otherBall.mass;
            otherBall.dy += impulseY / otherBall.mass;
            otherBall.limitVelocity();
        }

        const percent = 0.6;
        const slop = 0.01;
        const penetration = (this.radius + otherBall.radius - distance);
        
        if (penetration > slop) {
            const correction = (penetration * percent) / (1/this.mass + 1/otherBall.mass);
            const correctionX = nx * correction;
            const correctionY = ny * correction;

            if (this !== selectedBall) {
                this.x -= correctionX / this.mass;
                this.y -= correctionY / this.mass;
            }
            if (otherBall !== selectedBall) {
                otherBall.x += correctionX / otherBall.mass;
                otherBall.y += correctionY / otherBall.mass;
            }
        }
    }

    update(balls) {
        // Always draw the ball, even if selected
        if (this === selectedBall) {
            this.draw();
            return;
        }

        this.dx *= 0.99;
        this.dy *= 0.99;

        this.x += this.dx;
        this.y += this.dy;

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = -this.dx * this.restitution;
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx = -this.dx * this.restitution;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = -this.dy * this.restitution;
        } else if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.dy = -this.dy * this.restitution;
        }

        this.limitVelocity();

        balls.forEach(ball => {
            if (ball !== this) {
                this.resolveCollision(ball);
            }
        });

        this.draw();
    }
}

// Mouse event handlers
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    for (const ball of balls) {
        if (ball.containsPoint(mouseX, mouseY)) {
            selectedBall = ball;
            isDragging = true;
            lastMousePos = { x: mouseX, y: mouseY };
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !selectedBall) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedBall.x = mouseX;
    selectedBall.y = mouseY;

    selectedBall.dx = (mouseX - lastMousePos.x) * 2;
    selectedBall.dy = (mouseY - lastMousePos.y) * 2;
    
    selectedBall.limitVelocity();

    lastMousePos = { x: mouseX, y: mouseY };
});

canvas.addEventListener('mouseup', () => {
    if (selectedBall) {
        selectedBall.dx *= 1.5;
        selectedBall.dy *= 1.5;
        selectedBall.limitVelocity();
    }
    selectedBall = null;
    isDragging = false;
});

const balls = [
    new Ball(100, 100, 20, 'red'),
    new Ball(700, 100, 20, 'blue'),
    new Ball(300, 500, 20, 'green'),
    new Ball(500, 300, 20, 'orange'),
    new Ball(200, 400, 20, 'white'),
    new Ball(600, 200, 20, 'green'),
    new Ball(400, 100, 20, 'green'),
    new Ball(150, 300, 20, 'green'),
    new Ball(650, 450, 20, 'green')
];

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    balls.forEach(ball => ball.update(balls));
    requestAnimationFrame(animate);
}

animate(); 