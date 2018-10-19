#InAppBase as InApp, Utils;

const ChromeInApp = new (class extends InApp {
  constructor() {
    super();
    this.portID = 0;
    this.ports = {};

    chrome.runtime.onConnect.addListener(port => {
      if(port.name !== 'osnot-main') {
        port.disconnect();
        return;
      }

      const portID = this.nextPort;

      this.ports[portID] = port;
      port.onDisconnect.addListener(() => delete this.ports[portID]);

      port.onMessage.addListener(async dispatch => {
        console.log(dispatch);
        if(dispatch.query < 0) {
          dispatch.query = -dispatch.query;
          if(this.queries.hasOwnProperty(dispatch.query)) {
            if(dispatch.data === App.error) {
              this.queries[dispatch.query].reject();
            } else {
              this.queries[dispatch.query].resolve(dispatch.data);
            }

            delete this.queries[dispatch.query];
          }
          return;
        }

        port.postMessage({
          name: dispatch.name,
          data: await this.handle(dispatch.name, dispatch.data),
          query: -dispatch.query
        });
      });
    });
  }

  dispatch(name, data) {
    return new Promise((resolve, reject) => {
      data = {
        name: name,
        data: data,
        query: this.nextQuery()
      };

      for(let id in this.ports) {
        this.ports[id].postMessage(data);
      }
      this.queries[this.queryID] = {
        resolve: resolve,
        reject: reject
      };
    }).catch(e => {});
  }

  get nextPort() {
    return this.portID = Utils.nextPossible(this.portID, this.ports);
  }
})();

App.register('InApp', ChromeInApp);
