#InAppBase as InApp, Utils;

const ChromeInApp = new class extends InApp {
  constructor() {
    super();

    this.port = chrome.runtime.connect({name:'osnot-main'});
    this.port.onMessage.addListener(async dispatch => {
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

      this.port.postMessage({
        name: dispatch.name,
        data: await this.handle(dispatch.name, dispatch.data),
        query: -dispatch.query
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

      this.port.postMessage(data);

      this.queries[this.queryID] = {
        resolve: resolve,
        reject: reject
      };
    }).catch(e => {});
  }
}();

App.register('InApp', ChromeInApp);
