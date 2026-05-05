document.addEventListener('DOMContentLoaded', () => {
    initWheel();
    
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
});

// Navigation
function navigateTo(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');

    // Update bottom nav active state if navigating to home or redeem
    if (screenId === 'home-screen' || screenId === 'redeem-screen') {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (screenId === 'home-screen') {
            document.querySelectorAll('.nav-item')[0].classList.add('active');
        } else if (screenId === 'redeem-screen') {
            document.querySelectorAll('.nav-item')[1].classList.add('active');
        }
    }
}

// Wheel Setup
const slices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
let currentRotation = 0;
let isSpinning = false;

function initWheel() {
    const wheel = document.getElementById('spin-wheel');
    const numSlices = slices.length;
    const sliceAngle = 360 / numSlices;
    
    // Create conic gradient for the wheel
    let gradientParts = [];
    
    for (let i = 0; i < numSlices; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;
        const color = i % 2 === 0 ? '#1b64ff' : '#ffffff';
        gradientParts.push(`${color} ${startAngle}deg ${endAngle}deg`);
        
        // Add text element
        const sliceEl = document.createElement('div');
        sliceEl.className = 'slice-label';
        sliceEl.innerText = slices[i];
        
        // Text color contrast
        sliceEl.style.color = i % 2 === 0 ? '#ffffff' : '#1b64ff';
        
        // Position and rotate
        const rotation = startAngle + (sliceAngle / 2);
        sliceEl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) translateY(-100px)`;
        
        wheel.appendChild(sliceEl);
    }
    
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;
}

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    
    const wheel = document.getElementById('spin-wheel');
    
    // Random spins (5 to 10 full rotations) + random stop
    const extraSpins = Math.floor(Math.random() * 5) + 5;
    const randomDegree = Math.floor(Math.random() * 360);
    
    currentRotation += (extraSpins * 360) + randomDegree;
    
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    // Update chances UI visually just for demo
    setTimeout(() => {
        isSpinning = false;
        
        const chances = document.querySelectorAll('.chance-icon:not(.used)');
        if (chances.length > 0) {
            chances[0].classList.add('used');
            chances[0].innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        
        // Calculate which slice won (for demo, just alert or add balance)
        // Normalize rotation
        const normalizedRot = currentRotation % 360;
        // Pointer is at top (0 deg). Conic gradient starts at top (0 deg).
        // Since wheel rotates clockwise, the slice at top is 360 - normalizedRot.
        const pointerAngle = (360 - normalizedRot) % 360;
        const sliceIndex = Math.floor(pointerAngle / (360 / slices.length));
        const wonAmount = slices[sliceIndex];
        
        setTimeout(() => {
            const balanceEl = document.getElementById('balance-amount');
            const currentBalance = parseInt(balanceEl.innerText);
            balanceEl.innerText = currentBalance + wonAmount;
            alert(`You won ${wonAmount} coins!`);
        }, 300);
        
    }, 3000); // 3s matches CSS transition
}
