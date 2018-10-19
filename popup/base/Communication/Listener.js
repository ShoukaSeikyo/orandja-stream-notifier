const Listener = class {

  static sort(a, b) {
    return a.priority > b.priority || a.index > b.index;
  }

  constructor(method = false) {
    this.priority = -1;
    this.index = -1;
    this.method = method || (() => false);
  }

  setIndex(index) {
    this.index = index;

    return this;
  }

  setPriority(priority) {
    this.priority = priority;

    return this;
  }

  async handle(data) {
    return this.method(data);
  }

  async register(name) {
    #Channel?.get(name).addListener(this);
  }
};

App.register('Listener', Listener);
