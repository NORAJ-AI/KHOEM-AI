const canvas = document.createElement("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
document.body.innerHTML = "";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 35,
  speed: 5
};

const keys = {};

addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function update() {
  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
  if (keys["d"] || keys["arrowright"]) player.x += player.speed;

  player.x = Math.max(player.size, Math.min(canvas.width-player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height-player.size, player.y));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(player.x-player.size/2, player.y-player.size/2,
               player.size, player.size);

  ctx.fillStyle = "white";
  ctx.font = "24px sans-serif";
  ctx.fillText("KHOEM-AI", 20, 40);

  ctx.font = "16px sans-serif";
  ctx.fillText("WASD / Arrow Keys - Move", 20, 68);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
