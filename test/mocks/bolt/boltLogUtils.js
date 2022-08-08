function getLogger() {
    return {
        debug() {},
        warn() {},
        info() {},
        error() {}
    };
}
module.exports = {
    getLogger: getLogger
};
