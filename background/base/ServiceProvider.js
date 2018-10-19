const ProviderList = [];
const ServiceProvider = class {

  static get list() {
    return ProviderList;
  }

  static get(id) {
    return ProviderList.find(provider => provider.id === id);
  }

  constructor(id) {
    this.id = id;

    ProviderList.push(this);
  }


  getURL(service) {}

  generate(mode, value) {}
};

App.register('ServiceProvider', ServiceProvider);
