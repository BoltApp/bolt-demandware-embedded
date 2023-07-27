const Service = require('./Service');
const HTTPService = require('./HTTPService');

class LocalServiceRegistry {
    constructor() { }

    static createService(serviceId, configObj) {
        if (!serviceId) {
            throw new Error();
        }

        if (serviceId.toLowerCase().indexOf('bolt.http') > -1) {
            return new HTTPService(configObj);
        }

        return new Service(configObj);
    };
}

module.exports = LocalServiceRegistry;
