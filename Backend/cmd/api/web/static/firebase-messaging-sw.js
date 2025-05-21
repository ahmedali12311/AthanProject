importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyD4RuYF5IqsqAk3s1PyDtX4BGigTQgpxHg",
    authDomain: "athan-b2a8a.firebaseapp.com",
    projectId: "athan-b2a8a",
    storageBucket: "athan-b2a8a.firebasestorage.app",
    messagingSenderId: "49520982293",
    appId: "1:49520982293:web:ac36801f3b4ee2b04c111c",
    measurementId: "G-3HDEKFG1QJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});