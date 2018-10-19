#Listener;

const ChannelList = [];
const Channel = class {
  static get list() {
    return ChannelList;
  }

  static get(name) {
    if(!Channel.has(name)) {
      return new Channel(name);
    }

    return ChannelList.find(group => group.name === name);
  }

  static has(name) {
    return ChannelList.find(group => group.name === name) !== undefined;
  }

  constructor(name) {
    this.name = name;
    this.listeners = [];

    ChannelList.push(this);
  }

  is(name) {
    return this.name.toLowerCase() === name.toLowerCase();
  }

  addListener(listener) {
    this.listeners.push(listener.setIndex(this.listeners.length));
    this.listeners.sort(Listener.sort);
    return this;
  }

  async dispatch(data) {
    return await #InApp?.dispatch(this.name, data);
  }

  async handle(data) {
    let response = App.error;
    for(let i = 0; i < this.listeners.length; i++) {
      if((response = await this.listeners[i].handle(data)) !== App.error) {
        break;
      }
    }

    return response;
  }
};

App.register('Channel', Channel);
