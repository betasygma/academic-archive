const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let circleX = 200;
let circleY = 100;
let speedX = 2;
let speedY = 2;
let mouseX = 0;
let mouseY = 0;
let circleRadius = 50;

canvas.addEventListener("mousemove", function (event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    console.log(mouseX, mouseY);
});

function update() {
    circleX += speedX;
    circleY += speedY;

    // Bounce di batas kiri/kanan
    if (circleX + circleRadius >= canvas.width || circleX - circleRadius <= 0) {
        speedX *= -1;
    }
 
  // Bounce di batas atas/bawah
    if (circleY + circleRadius >= canvas.height || circleY - circleRadius <= 0) {
        speedY *= -1;
    }
}

function draw() {
    // line
    // ctx.beginPath();
    // ctx.moveTo(350, 350);
    // ctx.lineTo(200, 50);
    // ctx.strokeStyle = "black";
    // ctx.lineWidth = 3;
    // ctx.stroke();

    // rectangle
    ctx.fillStyle = "blue";
    ctx.fillRect(50, 50, 100, 100);

    ctx.fillStyle = "red";
    ctx.fillRect(500,500,50,50);

    // circle
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    // triangle
    ctx.beginPath();
    ctx.moveTo(300, 100);
    ctx.lineTo(200, 300);
    ctx.lineTo(400, 300);
    ctx.closePath();
    ctx.fillStyle = "green";
    ctx.fill();
}

function animate() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);
    update();
    draw();
    requestAnimationFrame(animate);
}

animate();