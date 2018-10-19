#Utils, Channel;

const InApp = class {
  constructor() {
    this.channels = {};
    this.queries = {};
    this.queryID = 1; //Must be 1 or higher. Queries use the negative value for answers.
  }

  async dispatch(name, data) {}

  async handle(name, data) {
    return Channel.get(name).handle(data);
  }

  nextQuery() {
    return this.queryID = Utils.nextPossible(this.queryID, this.queries, 1);
  }
}

App.register('InAppBase', InApp);
