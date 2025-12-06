export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showBrowserNotification = (title, body, tag = null) => {
    if (Notification.permission === 'granted') {
        const options = {
            body,
            icon: '/logo192.png', // Assuming standard CRA logo or similar
            tag, // Use tag to prevent duplicate notifications
            renotify: true
        };
        new Notification(title, options);
    }
};
