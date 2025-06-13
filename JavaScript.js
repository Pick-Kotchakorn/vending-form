// แทนที่ URL นี้ด้วย Web App URL ที่ได้จาก Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyv9kt4vMRf8GRllGqZ8XxMQYl6cRQymAf7ZkrHqeiaORh7TEZkUvSOjxRhMtOSvr7Hfw/exec';

document.getElementById('vendingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // แสดงสถานะการโหลด
    document.getElementById('loading').style.display = 'block';
    
    // รวบรวมข้อมูลจากฟอร์ม
    const formData = {
        vendingCount: document.getElementById('vendingCount').value,
        location: document.getElementById('location').value,
        contactName: document.getElementById('contactName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        businessType: document.getElementById('businessType').value,
        budget: document.getElementById('budget').value,
        timeline: document.getElementById('timeline').value,
        additionalInfo: document.getElementById('additionalInfo').value,
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value
    };
    
    // ส่งข้อมูลไป Google Sheet ผ่าน Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // สำคัญ! เพื่อหลีกเลี่ยง CORS issues
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(() => {
        // เนื่องจากใช้ no-cors จะไม่ได้รับ response กลับมา
        // แต่ถ้าไม่มี error แสดงว่าส่งสำเร็จ
        document.getElementById('loading').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        
        // เลื่อนไปที่ข้อความสำเร็จ
        document.getElementById('successMessage').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
        // รีเซ็ตฟอร์มหลังจากแสดงข้อความสำเร็จ
        setTimeout(function() {
            document.getElementById('vendingForm').reset();
            document.getElementById('successMessage').style.display = 'none';
        }, 5000);
    })
    .catch(error => {
        document.getElementById('loading').style.display = 'none';
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
    });
});

// ฟังก์ชันจัดรูปแบบเบอร์โทรศัพท์
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 10) {
        value = value.substring(0, 10);
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    e.target.value = value;
});

// ฟังก์ชันแชร์โลเคชั่น
document.getElementById('shareLocationBtn').addEventListener('click', function() {
    const btn = this;
    const locationInput = document.getElementById('location');
    const locationStatus = document.getElementById('locationStatus');
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');

    if (!navigator.geolocation) {
        showLocationStatus('error', '❌ เบราว์เซอร์ของคุณไม่รองรับการแชร์โลเคชั่น');
        return;
    }

    // แสดงสถานะการโหลด
    btn.classList.add('loading');
    btn.innerHTML = '<span class="icon">⏳</span>';
    showLocationStatus('loading', '📍 กำลังค้นหาตำแหน่งของคุณ...');

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // เก็บพิกัด
            latInput.value = lat;
            lngInput.value = lng;

            // แปลงพิกัดเป็นที่อยู่
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=th`)
                .then(response => response.json())
                .then(data => {
                    let address = '';
                    if (data.locality) {
                        address += data.locality;
                    }
                    if (data.city && data.city !== data.locality) {
                        address += (address ? ', ' : '') + data.city;
                    }
                    if (data.principalSubdivision) {
                        address += (address ? ', ' : '') + data.principalSubdivision;
                    }
                    if (data.countryName) {
                        address += (address ? ', ' : '') + data.countryName;
                    }

                    if (address) {
                        locationInput.value = address;
                        showLocationStatus('success', `✅ ตำแหน่งปัจจุบัน: ${address}`);
                    } else {
                        locationInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        showLocationStatus('success', '✅ ได้พิกัดแล้ว แต่ไม่สามารถแปลงเป็นที่อยู่ได้');
                    }
                })
                .catch(error => {
                    // หากแปลงที่อยู่ไม่ได้ ใช้พิกัดแทน
                    locationInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    showLocationStatus('success', '✅ ได้พิกัดแล้ว: ' + locationInput.value);
                })
                .finally(() => {
                    btn.classList.remove('loading');
                    btn.innerHTML = '<span class="icon">🎯</span>';
                });
        },
        function(error) {
            btn.classList.remove('loading');
            btn.innerHTML = '<span class="icon">🎯</span>';
            
            let errorMsg = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '❌ คุณปฏิเสธการแชร์โลเคชั่น กรุณาอนุญาตในเบราว์เซอร์';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '❌ ไม่สามารถหาตำแหน่งของคุณได้';
                    break;
                case error.TIMEOUT:
                    errorMsg = '❌ หมดเวลาในการค้นหาตำแหน่ง';
                    break;
                default:
                    errorMsg = '❌ เกิดข้อผิดพลาดในการค้นหาตำแหน่ง';
                    break;
            }
            showLocationStatus('error', errorMsg);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 นาที
        }
    );
});

function showLocationStatus(type, message) {
    const locationStatus = document.getElementById('locationStatus');
    locationStatus.className = `location-status ${type}`;
    locationStatus.textContent = message;
    
    if (type === 'success') {
        setTimeout(() => {
            locationStatus.style.display = 'none';
        }, 5000);
    }
}

// การตรวจสอบฟอร์ม
const inputs = document.querySelectorAll('input[required], select[required]');
inputs.forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value.trim() === '') {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '#27ae60';
        }
    });
});
