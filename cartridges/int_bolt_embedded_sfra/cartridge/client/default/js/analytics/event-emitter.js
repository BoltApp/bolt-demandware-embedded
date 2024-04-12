'use strict';

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);

        return () => {
            this.events[eventName] = this.events[eventName].filter(l => l !== listener);
        };
    }

    once(eventName, listener) {
        const off = this.on(eventName, data => {
            off();
            listener(data);
        });
    }

    emit(eventName, data) {
        const listeners = this.events[eventName];
        if (listeners) {
            listeners.forEach(listener => {
                listener(data);
            });
        }
    }
}

module.exports = new EventEmitter();
