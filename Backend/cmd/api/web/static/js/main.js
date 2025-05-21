// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4RuYF5IqsqAk3s1PyDtX4BGigTQgpxHg",
  authDomain: "athan-b2a8a.firebaseapp.com",
  projectId: "athan-b2a8a",
  storageBucket: "athan-b2a8a.firebasestorage.app",
  messagingSenderId: "49520982293",
  appId: "1:49520982293:web:ac36801f3b4ee2b04c111c",
  measurementId: "G-3HDEKFG1QJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Fetch sections and populate dropdown
async function fetchSections() {
    try {
        const response = await fetch('/sections/list');
        if (!response.ok) throw new Error('Failed to fetch sections');
        const data = await response.json();
        const sectionSelect = document.getElementById('section');
        data.sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            sectionSelect.appendChild(option);
        });
    } catch (error) {
        showError('Error fetching sections: ' + error.message);
    }
}

// Fetch prayer times for selected section
async function fetchPrayerTimes() {
    const sectionId = document.getElementById('section').value;
    const subscribeBtn = document.getElementById('subscribe-btn');
    const prayerList = document.getElementById('prayer-list');
    const sectionName = document.getElementById('section-name');
    prayerList.innerHTML = '';
    sectionName.textContent = '';
    subscribeBtn.disabled = !sectionId;

    if (!sectionId) return;

    try {
        const response = await fetch(`/prayer-times?section_id=${sectionId}`);
        if (!response.ok) throw new Error('Failed to fetch prayer times');
        const data = await response.json();
        const prayerTimes = data.prayer_times[0];
        sectionName.textContent = prayerTimes.name;
        const times = [
            { name: 'Fajr First', time: prayerTimes.fajr_first_time },
            { name: 'Fajr Second', time: prayerTimes.fajr_second_time },
            { name: 'Sunrise', time: prayerTimes.sunrise_time },
            { name: 'Dhuhr', time: prayerTimes.dhuhr_time },
            { name: 'Asr', time: prayerTimes.asr_time },
            { name: 'Maghrib', time: prayerTimes.maghrib_time },
            { name: 'Isha', time: prayerTimes.isha_time }
        ];
        times.forEach(prayer => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${prayer.name}</span><span>${prayer.time}</span>`;
            prayerList.appendChild(li);
        });
    } catch (error) {
        showError('Error fetching prayer times: ' + error.message);
    }
}

// Subscribe to notifications
async function subscribeToNotifications() {
    const sectionId = document.getElementById('section').value;
    if (!sectionId) {
        showError('Please select a section');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') throw new Error('Notification permission denied');

        const token = await messaging.getToken({ vapidKey: 'BP6kd-OMOJtTItcHpMP9FLSWgN4IU8I5rZMq0EKmp-YZhw6jHQl5D_mxxmxxZ4Sq2aQB79OJ6iDY5XrLP-UbMDk' });
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `token=${encodeURIComponent(token)}§ion_id=${sectionId}`
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to subscribe');
        showError(data.message, false);
    } catch (error) {
        showError('Error subscribing to notifications: ' + error.message);
    }
}

// Show error or success message
function showError(message, isError = true) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.color = isError ? 'red' : 'green';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchSections();
    fetchPrayerTimes();
});