#Service, Group;

const UserList = [];

const User = class {

  static get list() {
    return UserList;
  }

  static find(search) {
    search = search.toLowerCase();
    return UserList.filter(user => user.uniqueID.toLowerCase().indexOf(search) > -1 || user.cache.username.toLowerCase().indexOf(search) > -1 || user.services.find(service => service.cache.username.toLowerCase().indexOf(search) > -1) || false);
  }

  static of(groupName) {
    return UserList.filter(user => user.groups.find(group => group.is(groupName)) || false);
  }

  static for(provider) {
    return UserList.filter(user => user.services.find(service => (service.provider === provider || service.provider.id === provider)) || false);
  }

  static async get(uniqueID) {
    if(typeof uniqueID === 'string') {
      return UserList.find(user => user.uniqueID === uniqueID);
    }

    if(uniqueID instanceof User && uniqueID.registered) {
      return uniqueID;
    }

    throw new Error(`User "${uniqueID}" doesn't exist.`);
  }

  static has(username) {
    if(typeof username === 'string') {
      return UserList.find(user => user.username === username) !== 'undefined';
    }

    return UserList.indexOf(username) > -1;
  }

  static async remove(user) {
    try {
      (await User.get(user)).remove();
      return true;
    } catch(e) {
      return false;
    }
  }

  constructor() {
    this.uniqueID = '';
    this.groups = [];
    this.services = [];

    this.cache = {
      username: '',
      avatar: '',
      url: false,
      options: 5
    };
  }

  get index() {
    return UserList.indexOf(this);
  }

  get registered() {
    return this.index > -1;
  }

  register() {
    if(this.index === -1) {
      UserList.push(this);
    }

    return this;
  }

  remove() {
    if(this.index > -1) {
      UserList.splice(this.index, 1);
    }

    return this.index === -1;
  }

  set storage(storage) {
    this.uniqueID = storage.uniqueID;
    Object.assign(this.cache, storage.cache);
    this.groups.push.apply(this.groups, storage.groups.map(group => Group.get(group)));
    this.services.push.apply(this.services, storage.services.map(storage => new Service(this, storage)));
  }

  get storage() {
    return {
      uniqueID: this.uniqueID,
      groups: this.groups.map(group => group.name),
      cache: Object.assign({}, this.cache),
      services: this.services.map(service => service.storage)
    };
  }

  open(index = -1) {
    (index === -1 && this.services.length === 1) && (index = 0);

    if(index > -1) {
      return this.services[index].open();
    }
  }

};

App.register('User', User);
