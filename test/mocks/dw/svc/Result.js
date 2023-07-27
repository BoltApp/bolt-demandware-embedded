const OK = 0;
const ERROR = 1;
const SERVICE_UNAVAILABLE = 2;

class Result {
    constructor(obj) {
        this.object = obj || {};
        this.error = obj.error || undefined;
        this.errorMessage = obj.errorMessage || '';
        this.mockResult = obj.mockResult || false;
        this.msg = obj.msg || 'msg';
        this.ok = obj.ok || true;
        this.status = obj.status || OK;
        this.unavailableReason = obj.unavailableReason || 'unavailable reason';
    }

    getError() {
        return this.error;
    }
    getErrorMessage() {
        return this.errorMessage;
    }
    getMsg() {
        return this.msg;
    }
    getObject() {
        return this.object;
    }
    getStatus() {
        return this.status;
    }
    getUnavailableReason() {
        return this.unavailableReason;
    }
    isOk() {
        return this.ok;
    }
    isMockResult() {
        return this.mockResult;
    }
    toString() {
        return '';
    }
}

module.exports = {
    OK: OK,
    ERROR: ERROR,
    SERVICE_UNAVAILABLE: SERVICE_UNAVAILABLE,
    Result: Result
};
