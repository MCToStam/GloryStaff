let clientInstance = null;

module.exports = {
  setClient(client) {
    clientInstance = client;
  },

  getClient() {
    if (!clientInstance) return false;
    return clientInstance;
  },
};
