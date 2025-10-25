// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyCfDWAcSLtV9XKmbGkO17Lvbuhn_khGxFw",
  authDomain: "mini-transformer.firebaseapp.com",
  databaseURL: "https://mini-transformer-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "mini-transformer",
  storageBucket: "mini-transformer.appspot.com",
  messagingSenderId: "463743159361",
  appId: "1:463743159361"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ===== Login Form =====
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      // Login successful, redirect to dashboard
      window.location.href = "dashboard.html"; 
    })
    .catch(err => {
      alert("Login failed: " + err.message);
    });
});

// ===== Animated Background =====
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
for(let i=0;i<100;i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*2+1,
    dx: (Math.random()-0.5)*0.5,
    dy: (Math.random()-0.5)*0.5
  });
}

function animate(){
  ctx.fillStyle = "#001427";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "rgba(0,255,255,0.3)";
  for(let p of particles){
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = "rgba(0,255,255,0.7)";
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if(p.x<0 || p.x>canvas.width) p.dx*=-1;
    if(p.y<0 || p.y>canvas.height) p.dy*=-1;
  }
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', ()=>{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
