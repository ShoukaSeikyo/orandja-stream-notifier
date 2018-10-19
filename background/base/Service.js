#ServiceProvider, Browser;

const Service = class {
  constructor(user, storage = null) {
    this.user = user;
    this.id = '';
    this.provider = null;

    this.cache = {
      username: '',
      avatar: ''
    };

    this.temp = {
      text: [],
      viewers: 0,
      startTime: -1,
      online: false,
      url: false
    };

    (storage !== null) && (this.storage = storage);
  }

  set storage(storage) {
    this.provider = ServiceProvider.get(storage.provider);
    this.id = storage.id;
    Object.assign(this.cache, storage.cache);
  }

  get storage() {
    return {
      provider: this.provider.id,
      id: this.id,
      cache: Object.assign({}, this.cache)
    };
  }

  update(data) {
    stream.update({
      username: data.username,
      avatar: data.avatar,
      online: data.online
    }, true, false);

    data.online && stream.update({
      title: data.title,
      count: data.count,
      game: data.game
    }, true, false);
  }

  open() {
    Browser.open(this.url);
    return this;
  }

  get url() {
    return this.user.cache.url || this.temp.url || this.provider.getURL(this);
  }
};


App.register('Service', Service);
