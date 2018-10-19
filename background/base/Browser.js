let INSTANCE;

const Browser = class {
  constructor() {
    INSTANCE = this;
  }

  get name() { return 'unknown'; }
  get lang() { return 'en'; }

  text(text, keyVars = {}) {
    for(let keyVar in keyVars) {
      text = text.replace(new RegExp(`{${keyVar}}`, 'gi'), keyVars[keyVar]);
    }
    return text;
  }

  open(url) {}

  get version() { return ''; }
};

App.register('Browser', Browser);
